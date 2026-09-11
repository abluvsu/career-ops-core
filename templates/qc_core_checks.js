'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Universal Quality Control Checks — runs on any candidate profile.
 * Contains only structural and typographical checks that apply universally.
 * ZERO candidate-specific metrics, employer names, or candidate identities.
 */
function runCoreChecks(C, htmlContent, pageCount, pdfPath, pdfSize, options = {}) {
  const results = [];
  function qc(num, name, pass, detail) {
    results.push({ num, name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}: Core QC${num}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  // QC1: Two-page gate
  qc(1, 'Two-page gate', pageCount === 2, `${pageCount} pages`);

  // QC2: PDF size > 10KB & file exists on disk
  const pdfExists = fs.existsSync(pdfPath) && (pdfSize || fs.statSync(pdfPath).size) > 10240;
  qc(2, 'PDF size > 10KB & file exists on disk', pdfExists, `${pdfSize} bytes at ${path.basename(pdfPath)}`);

  // QC3: Primary experience bullets minimum
  const primaryExp = C.EXPERIENCE && C.EXPERIENCE[0];
  const primaryBullets = primaryExp ? (primaryExp.bullets || []) : [];
  const minBullets = options.minPrimaryBullets || (primaryExp && primaryExp.minBullets) || 4;
  qc(3, `Primary experience bullets >= ${minBullets}`, primaryBullets.length >= minBullets, `${primaryBullets.length} bullets`);

  // QC4: WHY_I_FIT present and > 200 chars
  qc(4, 'WHY_I_FIT > 200 chars', Boolean(C.WHY_I_FIT && C.WHY_I_FIT.length > 200), `${(C.WHY_I_FIT || '').length} chars`);

  // QC5: ROLE_PILLARS count (structural minimum)
  const minPillars = options.minPillars || 3;
  qc(5, `ROLE_PILLARS >= ${minPillars}`, (C.ROLE_PILLARS || []).length >= minPillars, `${(C.ROLE_PILLARS || []).length} pillars`);

  // QC6: NUMBERS_THAT_MATTER
  qc(6, 'NUMBERS_THAT_MATTER >= 2', (C.NUMBERS_THAT_MATTER || []).length >= 2, `${(C.NUMBERS_THAT_MATTER || []).length} numbers`);

  // QC7: All HTML sections present
  const requiredSections = ['WHY I FIT', 'ROLE PILLARS', 'PROFESSIONAL EXPERIENCE', 'EDUCATION', 'NUMBERS', 'TOOLS', 'CERTIFICATIONS'];
  const missingSections = requiredSections.filter(s => !htmlContent.toUpperCase().includes(s));
  qc(7, 'All HTML sections present', missingSections.length === 0, missingSections.length > 0 ? `Missing: ${missingSections.join(', ')}` : 'All 7');

  // QC8: Bold markers >= 40
  const strongCount = (htmlContent.match(/<strong/g) || []).length;
  const minBolds = options.minBoldMarkers || 40;
  qc(8, `Bold markers >= ${minBolds}`, strongCount >= minBolds, `${strongCount} tags`);

  // QC9: Content density >= 4000 chars & zero undefined/null
  const bodyMatch = htmlContent.match(/<body>([\s\S]*)<\/body>/);
  const bodyString = bodyMatch ? bodyMatch[1] : '';
  const charCount = bodyString.replace(/<[^>]+>/g, '').trim().length;
  const hasUndefinedOrNull = /(?:>|\s|^)(undefined|null|NaN|\[object Object\])(?:<|\s|$)/i.test(bodyString);
  const minChars = options.minContentChars || 4000;
  qc(9, `Content density >= ${minChars} chars & zero undefined/null tokens`, charCount >= minChars && !hasUndefinedOrNull, `${charCount} chars${hasUndefinedOrNull ? ' — FOUND UNDEFINED/NULL IN BODY' : ''}`);

  // QC10: Hyphen/em-dash ban in dynamic content (Rule 2)
  const hyphenRe = /[-—]/;
  let hasHyphen = false;
  ['TAGLINE', 'SUMMARY', 'WHY_I_FIT'].forEach(f => { if (C[f] && hyphenRe.test(C[f])) hasHyphen = true; });
  if (C.EXPERIENCE) C.EXPERIENCE.forEach(e => (e.bullets || []).forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; }));
  if (C.PROJECTS) C.PROJECTS.forEach(p => (p.bullets || []).forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; }));
  if (C.PROJECT_BULLETS) C.PROJECT_BULLETS.forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; });
  if (C.ROLE_PILLARS) C.ROLE_PILLARS.forEach(p => (p.bullets || []).forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; }));
  qc(10, 'No hyphens/em-dashes in dynamic content (Rule 2)', !hasHyphen);

  // QC11: Date en-dash check (Rule 9: en-dash for dates, no hyphen-minus)
  let badDate = null;
  const checkDateStr = (d) => {
    if (!d || typeof d !== 'string') return;
    if (d.includes('-')) {
      badDate = d;
    }
  };
  if (C.EXPERIENCE) C.EXPERIENCE.forEach(e => checkDateStr(e.dates));
  if (C.PROJECTS) C.PROJECTS.forEach(p => checkDateStr(p.dates));
  if (Array.isArray(C.EDUCATION)) C.EDUCATION.forEach(ed => checkDateStr(ed.dates || ed.year));
  qc(11, 'Date en-dash format (Rule 9)', !badDate, badDate ? `Found hyphen in date: "${badDate}"` : 'All dates use en-dash');

  // QC12: Rule 7 non-fulltime role labeling
  let nonFullTimeUnlabeled = null;
  if (C.EXPERIENCE) {
    C.EXPERIENCE.forEach(e => {
      const type = (e.type || 'full-time').toLowerCase();
      if (type !== 'full-time') {
        const combined = `${e.title || ''} ${e.label || ''}`.toLowerCase();
        const isLabeled = combined.includes('part-time') || combined.includes('part time') || combined.includes('independent') || combined.includes('consulting') || combined.includes('contract') || combined.includes('internship');
        if (!isLabeled) {
          nonFullTimeUnlabeled = `${e.title || e.id} (${type})`;
        }
      }
    });
  }
  if (C.PROJECTS && C.PROJECTS.length > 0) {
    C.PROJECTS.forEach(p => {
      const combined = `${p.title || ''} ${p.label || ''} ${C.PROJECT_TITLE || ''}`.toLowerCase();
      const isLabeled = combined.includes('independent') || combined.includes('part-time') || combined.includes('part time') || combined.includes('side project');
      if (!isLabeled) {
        nonFullTimeUnlabeled = `${p.title || p.id || 'Project'}`;
      }
    });
  }
  qc(12, 'Non-fulltime roles labeled clearly (Rule 7)', !nonFullTimeUnlabeled, nonFullTimeUnlabeled ? `Missing label on: ${nonFullTimeUnlabeled}` : 'All labeled');

  // QC13: Widow/orphan range check (95-115 or 180-230 chars)
  const allBullets = [
    ...(C.EXPERIENCE ? C.EXPERIENCE.flatMap(e => e.bullets || []) : []),
    ...(C.PROJECTS ? C.PROJECTS.flatMap(p => p.bullets || []) : []),
    ...(C.PROJECT_BULLETS || [])
  ];
  let widowFound = false;
  let widowDetail = '';
  for (const text of allBullets) {
    const plainText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '');
    const len = plainText.length;
    if (len > 115 && len < 180) {
      widowFound = true;
      widowDetail = `${len} chars: "${plainText.slice(0, 30)}..."`;
      break;
    }
  }
  qc(13, 'Widow/orphan character budget (95-115 or 180-230)', !widowFound, widowDetail || 'OK');

  // QC14: TOOLS has items
  const toolCount = (C.TOOLS || '').split(',').filter(t => t.trim().length > 0).length;
  qc(14, 'TOOLS has >= 8 items', toolCount >= 8, `${toolCount} items`);

  // QC15: TOOLS_GROUPED categories
  qc(15, 'TOOLS_GROUPED >= 3 categories', (C.TOOLS_GROUPED || []).length >= 3, `${(C.TOOLS_GROUPED || []).length} categories`);

  return results;
}

module.exports = { runCoreChecks };
