'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Resolves the path to qc-rules.json dynamically.
 * Precedence:
 *   1. Direct file or directory path argument
 *   2. CLI --data-root argument
 *   3. process.env.DATA_ROOT
 *   4. Current working directory reference/qc-rules.json
 *   5. Project root reference/qc-rules.json
 */
function resolveRulesPath(dataRootOrPath) {
  if (typeof dataRootOrPath === 'string' && dataRootOrPath.trim().length > 0) {
    const directPath = path.resolve(process.cwd(), dataRootOrPath);
    if (fs.existsSync(directPath)) {
      if (fs.statSync(directPath).isFile()) return directPath;
      const sub1 = path.join(directPath, 'reference', 'qc-rules.json');
      if (fs.existsSync(sub1)) return sub1;
      const sub2 = path.join(directPath, 'qc-rules.json');
      if (fs.existsSync(sub2)) return sub2;
    }
  }

  // CLI argument check
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--data-root' && args[i + 1]) {
      const cliRoot = path.resolve(process.cwd(), args[i + 1]);
      const cliCand1 = path.join(cliRoot, 'reference', 'qc-rules.json');
      if (fs.existsSync(cliCand1)) return cliCand1;
      const cliCand2 = path.join(cliRoot, 'qc-rules.json');
      if (fs.existsSync(cliCand2)) return cliCand2;
    }
  }

  // Environment variable check
  if (process.env.DATA_ROOT) {
    const envRoot = path.resolve(process.cwd(), process.env.DATA_ROOT);
    const envCand1 = path.join(envRoot, 'reference', 'qc-rules.json');
    if (fs.existsSync(envCand1)) return envCand1;
    const envCand2 = path.join(envRoot, 'qc-rules.json');
    if (fs.existsSync(envCand2)) return envCand2;
  }

  // Working directory fallback
  const cwdCand = path.join(process.cwd(), 'reference', 'qc-rules.json');
  if (fs.existsSync(cwdCand)) return cwdCand;

  // Project root fallback
  const defaultCand = path.resolve(__dirname, '..', 'reference', 'qc-rules.json');
  if (fs.existsSync(defaultCand)) return defaultCand;

  // Template fallbacks for standalone core repo / test environments
  if (typeof dataRootOrPath === 'string' && dataRootOrPath.trim().length > 0) {
    const directTemplate = path.join(path.resolve(process.cwd(), dataRootOrPath), 'reference-templates', 'qc-rules.template.json');
    if (fs.existsSync(directTemplate)) return directTemplate;
  }
  const rootTemplate = path.resolve(__dirname, '..', 'reference-templates', 'qc-rules.template.json');
  if (fs.existsSync(rootTemplate)) return rootTemplate;
  const schemaTemplate = path.resolve(__dirname, '..', 'schemas', 'qc-rules.template.json');
  if (fs.existsSync(schemaTemplate)) return schemaTemplate;

  return null;
}

/**
 * Loads and parses candidate-specific rules from qc-rules.json.
 */
function loadUserRules(dataRootOrPath) {
  const rulesPath = resolveRulesPath(dataRootOrPath);
  if (rulesPath && fs.existsSync(rulesPath)) {
    try {
      const raw = fs.readFileSync(rulesPath, 'utf8').replace(/^\uFEFF/, '');
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`Warning: Could not parse qc-rules.json at ${rulesPath}: ${e.message}`);
    }
  }
  return {};
}

/**
 * User-Configurable Quality Control Checks.
 * Evaluates candidate-specific rules defined in reference/qc-rules.json.
 */
function runUserChecks(C, htmlContent, userRulesInput = {}, options = {}) {
  const results = [];
  function qc(num, name, pass, detail) {
    results.push({ num, name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}: User QC${num}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  let userRules = userRulesInput;
  if (typeof userRulesInput === 'string') {
    userRules = loadUserRules(userRulesInput);
  } else if (!userRulesInput || Object.keys(userRulesInput).length === 0) {
    const rootPath = options.dataRoot || options.data_root;
    userRules = loadUserRules(rootPath);
  }

  const jsonStr = JSON.stringify(C).toLowerCase();
  let checkIdx = 1;

  // 1. Candidate-specific banned tools list
  if (Array.isArray(userRules.bannedTools)) {
    userRules.bannedTools.forEach(tool => {
      const toolLower = tool.toLowerCase();
      qc(checkIdx++, `No ${tool} in config`, !jsonStr.includes(toolLower));
    });
  }

  // 2. Required metrics in summary, why_i_fit, and experience
  if (Array.isArray(userRules.requiredMetrics)) {
    const expBullets = C.EXPERIENCE ? C.EXPERIENCE.flatMap(e => e.bullets || []) : [];
    const summaryText = (C.SUMMARY || '') + ' ' + (C.WHY_I_FIT || '') + ' ' + expBullets.join(' ');
    userRules.requiredMetrics.forEach(metric => {
      qc(checkIdx++, `Summary mentions ${metric}`, summaryText.includes(metric));
    });
  }

  // 3. Portfolio URL requirement
  if (userRules.portfolioUrlRequired !== undefined) {
    const allProjects = [
      ...(C.PROJECTS || []),
      ...((C.PROJECT_BULLETS || []).map(b => ({ bullets: [b] })))
    ];
    const allProjectBullets = allProjects.flatMap(p => p.bullets || []);
    if (userRules.portfolioUrlRequired && allProjectBullets.length > 0) {
      const hasUrl = allProjectBullets.some(b => /\[.*\]\(https?:\/\/.*\)/.test(b) || b.includes('http') || b.includes('www'));
      qc(checkIdx++, 'Portfolio URL requirement', hasUrl, hasUrl ? 'URL present in project bullets' : 'Missing URL in project bullets');
    } else {
      qc(checkIdx++, 'Portfolio URL requirement', true, 'N/A or satisfied');
    }
  }

  // 4. Minimum pillars count
  const minPillars = userRules.minPillarsCount !== undefined ? userRules.minPillarsCount : userRules.minPillars;
  if (minPillars !== undefined) {
    const actualPillars = (C.ROLE_PILLARS || []).length;
    qc(checkIdx++, `ROLE_PILLARS >= ${minPillars}`, actualPillars >= minPillars, `${actualPillars} pillars`);
  }

  // 5. Cover letter closing text
  const closingText = (userRules.coverLetter && userRules.coverLetter.requiredClosingText) || userRules.coverLetterClosingText;
  if (closingText) {
    const clParas = [C.PARA_1, C.PARA_2, C.PARA_3, C.PARA_4].filter(Boolean);
    if (clParas.length > 0 || C.CL_OUTPUT) {
      const clText = clParas.join(' ');
      const hasClosing = clText.includes(closingText);
      qc(checkIdx++, 'Cover letter closing text', hasClosing, hasClosing ? 'Verified' : `Expected "${closingText}"`);
    } else {
      qc(checkIdx++, 'Cover letter closing text', true, 'N/A (no cover letter in config)');
    }
  }

  // 6. Required disclosures (part-time, independent labels)
  if (userRules.requiredDisclosures) {
    if (userRules.requiredDisclosures.partTimeLabel) {
      const ptExp = (C.EXPERIENCE || []).find(e => e.type === 'part-time' || (e.label && e.label.toLowerCase().includes('part time')) || (e.title && e.title.toLowerCase().includes('part time')));
      const isPtLabeled = ptExp ? ((ptExp.title || '') + ' ' + (ptExp.label || '')).toLowerCase().includes('part time') : true;
      qc(checkIdx++, 'Part-time labeled on experience', isPtLabeled, ptExp ? (ptExp.title + (ptExp.label ? ' ' + ptExp.label : '')) : 'N/A');
    }
    if (userRules.requiredDisclosures.independentLabel) {
      const projTitle = (C.PROJECTS && C.PROJECTS[0] ? C.PROJECTS[0].title : (C.PROJECT_TITLE || 'Independent Projects'));
      const isIndepLabeled = projTitle.toLowerCase().includes('independent') || (C.PROJECTS && C.PROJECTS.some(p => ((p.label || '') + ' ' + (p.title || '')).toLowerCase().includes('independent')));
      qc(checkIdx++, 'Independent labeled on Projects', isIndepLabeled, projTitle);
    }
  }

  return results;
}

module.exports = {
  runUserChecks,
  loadUserRules,
  resolveRulesPath
};
