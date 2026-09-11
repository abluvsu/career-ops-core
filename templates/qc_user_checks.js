'use strict';
const fs = require('fs');
const path = require('path');

/**
 * User-Configurable Quality Control Checks.
 * Evaluates candidate-specific rules defined in reference/qc-rules.json.
 */
function runUserChecks(C, htmlContent, userRules = {}) {
  const results = [];
  function qc(num, name, pass, detail) {
    results.push({ num, name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}: User QC${num}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const jsonStr = JSON.stringify(C).toLowerCase();
  let checkIdx = 1;

  // 1. Banned tools
  if (Array.isArray(userRules.bannedTools)) {
    userRules.bannedTools.forEach(tool => {
      const toolLower = tool.toLowerCase();
      qc(checkIdx++, `No ${tool} in config`, !jsonStr.includes(toolLower));
    });
  }

  // 2. Required metrics in summary/experience
  if (Array.isArray(userRules.requiredMetrics)) {
    const expBullets = C.EXPERIENCE ? C.EXPERIENCE.flatMap(e => e.bullets || []) : [];
    const summaryText = (C.SUMMARY || '') + ' ' + (C.WHY_I_FIT || '') + ' ' + expBullets.join(' ');
    userRules.requiredMetrics.forEach(metric => {
      qc(checkIdx++, `Summary mentions ${metric}`, summaryText.includes(metric));
    });
  }

  // 3. Required disclosures
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

module.exports = { runUserChecks };
