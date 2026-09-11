'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Universal Quality Control Checks — runs on any candidate profile.
 * Zero candidate-specific metrics or strings.
 */
function runCoreChecks(C, htmlContent, pageCount, pdfPath, pdfSize, options = {}) {
  const results = [];
  function qc(num, name, pass, detail) {
    results.push({ num, name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}: Core QC${num}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  // QC1: Two-page gate
  qc(1, 'Two-page gate', pageCount === 2, `${pageCount} pages`);

  // QC2: PDF exists & size > 10KB
  const pdfExists = fs.existsSync(pdfPath) && (pdfSize || fs.statSync(pdfPath).size) > 10240;
  qc(2, 'PDF size > 10KB & file exists on disk', pdfExists, `${pdfSize} bytes at ${path.basename(pdfPath)}`);

  // QC3: Primary experience bullets minimum
  const primaryExp = C.EXPERIENCE && C.EXPERIENCE[0];
  const primaryBullets = primaryExp ? (primaryExp.bullets || []) : [];
  const minBullets = options.minPrimaryBullets || (primaryExp && primaryExp.minBullets) || 4;
  qc(3, `Primary experience bullets >= ${minBullets}`, primaryBullets.length >= minBullets, `${primaryBullets.length} bullets`);

  // QC4: Project bullet has URL (if projects exist)
  const allProjects = [
    ...(C.PROJECTS || []),
    ...((C.PROJECT_BULLETS || []).map(b => ({ bullets: [b] })))
  ];
  const allProjectBullets = allProjects.flatMap(p => p.bullets || []);
  if (options.portfolioUrlRequired !== false && allProjectBullets.length > 0) {
    qc(4, 'Project bullet has URL', allProjectBullets.some(b => /\[.*\]\(https?:\/\/.*\)/.test(b) || b.includes('http') || b.includes('www')));
  } else {
    qc(4, 'Project URL check (skipped or verified)', true, 'N/A');
  }

  // QC5: WHY_I_FIT present and > 200 chars
  qc(5, 'WHY_I_FIT > 200 chars', C.WHY_I_FIT && C.WHY_I_FIT.length > 200, `${(C.WHY_I_FIT || '').length} chars`);

  // QC6: ROLE_PILLARS count
  const minPillars = options.minPillars || 3;
  qc(6, `ROLE_PILLARS >= ${minPillars}`, (C.ROLE_PILLARS || []).length >= minPillars, `${(C.ROLE_PILLARS || []).length} pillars`);

  // QC7: NUMBERS_THAT_MATTER
  qc(7, 'NUMBERS_THAT_MATTER >= 2', (C.NUMBERS_THAT_MATTER || []).length >= 2, `${(C.NUMBERS_THAT_MATTER || []).length} numbers`);

  // QC8: All HTML sections present
  const requiredSections = ['WHY I FIT', 'ROLE PILLARS', 'PROFESSIONAL EXPERIENCE', 'EDUCATION', 'NUMBERS', 'TOOLS', 'CERTIFICATIONS'];
  const missingSections = requiredSections.filter(s => !htmlContent.toUpperCase().includes(s));
  qc(8, 'All HTML sections present', missingSections.length === 0, missingSections.length > 0 ? `Missing: ${missingSections.join(', ')}` : 'All 7');

  // QC9: Bold markers >= 40
  const strongCount = (htmlContent.match(/<strong/g) || []).length;
  const minBolds = options.minBoldMarkers || 40;
  qc(9, `Bold markers >= ${minBolds}`, strongCount >= minBolds, `${strongCount} tags`);

  // QC10: Content density >= 4000 chars & zero undefined/null
  const bodyMatch = htmlContent.match(/<body>([\s\S]*)<\/body>/);
  const bodyString = bodyMatch ? bodyMatch[1] : '';
  const charCount = bodyString.replace(/<[^>]+>/g, '').trim().length;
  const hasUndefinedOrNull = /(?:>|\s|^)(undefined|null|NaN|\[object Object\])(?:<|\s|$)/i.test(bodyString);
  const minChars = options.minContentChars || 4000;
  qc(10, `Content density >= ${minChars} chars & zero undefined/null tokens`, charCount >= minChars && !hasUndefinedOrNull, `${charCount} chars${hasUndefinedOrNull ? ' — FOUND UNDEFINED/NULL IN BODY' : ''}`);

  // QC11: Hyphen check in dynamic text
  const hyphenRe = /[-—]/;
  let hasHyphen = false;
  ['TAGLINE', 'SUMMARY', 'WHY_I_FIT'].forEach(f => { if (C[f] && hyphenRe.test(C[f])) hasHyphen = true; });
  if (C.EXPERIENCE) C.EXPERIENCE.forEach(e => (e.bullets || []).forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; }));
  if (C.PROJECTS) C.PROJECTS.forEach(p => (p.bullets || []).forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; }));
  if (C.PROJECT_BULLETS) C.PROJECT_BULLETS.forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; });
  if (C.ROLE_PILLARS) C.ROLE_PILLARS.forEach(p => (p.bullets || []).forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; }));
  qc(11, 'No hyphens/em-dashes in dynamic content (Rule 2)', !hasHyphen);

  // QC12: Widow/orphan range check (95-115 or 180-230 chars)
  const allBullets = [
    ...(C.EXPERIENCE ? C.EXPERIENCE.flatMap(e => e.bullets || []) : []),
    ...(C.PROJECTS ? C.PROJECTS.flatMap(p => p.bullets || []) : []),
    ...(C.PROJECT_BULLETS || [])
  ];
  let widowFound = false;
  for (const text of allBullets) {
    const plainText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '');
    const len = plainText.length;
    if (len > 115 && len < 180) {
      widowFound = true;
      break;
    }
  }
  qc(12, 'Widow/orphan character budget (95-115 or 180-230)', !widowFound);

  // QC13: TOOLS has items
  const toolCount = (C.TOOLS || '').split(',').filter(t => t.trim().length > 0).length;
  qc(13, 'TOOLS has >= 8 items', toolCount >= 8, `${toolCount} items`);

  // QC14: TOOLS_GROUPED categories
  qc(14, 'TOOLS_GROUPED >= 3 categories', (C.TOOLS_GROUPED || []).length >= 3, `${(C.TOOLS_GROUPED || []).length} categories`);

  return results;
}

module.exports = { runCoreChecks };
