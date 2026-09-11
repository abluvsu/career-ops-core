'use strict';
/**
 * UNIFIED BUILD — single command from partial_config to final PDF.
 *
 * Usage:
 *   node build.js --in partial_config.json --archetype Operator
 *
 * Steps:
 *   1. assemble_config: merge partial + frozen bullets + defaults
 *   2. fast_iter: optimise spacing/content (100 passes, HTML-only)
 *   3. render: WeasyPrint → 2-page PDF
 *   4. qc20: run 20 QC checks
 *   5. report: pass/fail summary
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const params = {};
for (let i = 0; i < args.length; i += 2) {
  if (args[i].startsWith('--')) params[args[i].substring(2)] = args[i + 1];
}
if (!params['in'] || !params['archetype']) {
  console.error('Usage: node build.js --in <partial_config.json> --archetype <Archetype_Name>');
  console.error('Archetypes: Operator, Builder, Strategist, Analyst, Transformation Lead, Domain Expert');
  process.exit(1);
}

const partialPath = path.resolve(process.cwd(), params['in']);
const archetype = params['archetype'];
const outDir = process.cwd();
const templatesDir = path.resolve(__dirname);
const dataRoot = params['data-root'] ? path.resolve(process.cwd(), params['data-root']) : path.resolve(templatesDir, '..');

// ── WeasyPrint env ────────────────────────────────────────────────────
const msysBin = process.env.MSYS_BIN || path.join(process.env.SystemDrive || 'C:', 'msys64', 'mingw64', 'bin');
const venvBin = process.env.VENV_BIN || path.resolve(templatesDir, '..', '.venv', 'Scripts');
const pythonBin = process.env.PYTHON_BIN || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Python', 'bin') : '');
const wpEnv = Object.assign({}, process.env, { 
  WEASYPRINT_DLL_DIRECTORIES: msysBin,
  PATH: `${pythonBin};${venvBin};${process.env.PATH}`
});

// ── Helpers ───────────────────────────────────────────────────────────
function hr(label) { console.log(`\n${'═'.repeat(50)}\n  ${label}\n${'═'.repeat(50)}`); }

// ══════════════════════════════════════════════════════════════════════
//  STEP 1: ASSEMBLE CONFIG
// ══════════════════════════════════════════════════════════════════════
hr('STEP 1: Assemble Config');
console.log(`Partial: ${partialPath}`);
console.log(`Archetype: ${archetype}`);
console.log(`Data Root: ${dataRoot}`);

const defaultsPath = path.join(templatesDir, 'config_defaults.json');
const libraryPath = path.join(dataRoot, 'reference', 'bullet-library.json');
const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));
const bulletLibrary = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));

if (!bulletLibrary[archetype]) {
  console.error(`ERROR: Archetype "${archetype}" not found in bullet-library.json`);
  process.exit(1);
}
const frozenBullets = bulletLibrary[archetype];
const partialConfig = JSON.parse(fs.readFileSync(partialPath, 'utf8'));

const userRulesPath = path.join(dataRoot, 'reference', 'qc-rules.json');
let userRules = {};
if (fs.existsSync(userRulesPath)) {
  try { userRules = JSON.parse(fs.readFileSync(userRulesPath, 'utf8')); } catch (e) {}
}

const profilePath = path.join(dataRoot, 'reference', 'profile.json');
let candidateProfile = null;
if (fs.existsSync(profilePath)) {
  try { candidateProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8')); } catch (e) {}
}

const assembledConfig = {
  ...defaults,
  ...(candidateProfile ? { PROFILE: candidateProfile } : {}),
  ...(userRules.portfolioUrlRequired !== undefined ? { PORTFOLIO_URL_REQUIRED: userRules.portfolioUrlRequired } : {}),
  ...partialConfig,
  EXPERIENCE: frozenBullets.EXPERIENCE,
  ...(frozenBullets.PROJECTS ? { PROJECTS: frozenBullets.PROJECTS } : {}),
  ...(frozenBullets.PROJECT_BULLETS ? { PROJECT_BULLETS: frozenBullets.PROJECT_BULLETS } : {})
};

if (assembledConfig.EXPERIENCE) {
  assembledConfig.EXPERIENCE = assembledConfig.EXPERIENCE.map((exp, idx) => {
    const copy = { ...exp };
    if (idx === 0 && partialConfig.ROLE_INTRO) copy.intro = partialConfig.ROLE_INTRO;
    if (idx === 1 && partialConfig.SARVM_INTRO) copy.intro = partialConfig.SARVM_INTRO;
    return copy;
  });
}
if (assembledConfig.PROJECTS && partialConfig.PROJECT_TITLE) {
  assembledConfig.PROJECTS = assembledConfig.PROJECTS.map((proj, idx) => {
    if (idx === 0) return { ...proj, title: partialConfig.PROJECT_TITLE };
    return proj;
  });
}

// Validate
const engine = require(path.join(templatesDir, 'engine.js'));
let validatedConfig;
try {
  validatedConfig = engine.validateConfig(assembledConfig);
  console.log('PASS: Schema validation OK');
} catch (e) {
  console.error('FAIL: Schema validation:', e.message);
  process.exit(1);
}

// Pillar check
const userRulesPathPre = path.join(dataRoot, 'reference', 'qc-rules.json');
let userRulesPre = {};
if (fs.existsSync(userRulesPathPre)) {
  try { userRulesPre = JSON.parse(fs.readFileSync(userRulesPathPre, 'utf8')); } catch (e) {}
}
const minPillars = userRulesPre.minPillars !== undefined ? userRulesPre.minPillars : 6;
if (!validatedConfig.ROLE_PILLARS || validatedConfig.ROLE_PILLARS.length < minPillars) {
  console.error(`FAIL: Need at least ${minPillars} ROLE_PILLARS, got ${validatedConfig.ROLE_PILLARS ? validatedConfig.ROLE_PILLARS.length : 0}`);
  process.exit(1);
}
console.log(`PASS: ${validatedConfig.ROLE_PILLARS.length} ROLE_PILLARS (min ${minPillars})`);

// Write assembled config
const configPath = path.join(outDir, 'config.json');
fs.writeFileSync(configPath, JSON.stringify(validatedConfig, null, 2));
console.log(`Config written: ${configPath}`);

// ══════════════════════════════════════════════════════════════════════
//  STEP 2: FAST ITERATION (optimise spacing, content density)
// ══════════════════════════════════════════════════════════════════════
hr('STEP 2: Fast Iteration (100 passes)');

const { generateHTML } = require(path.join(templatesDir, 'cv_weasyprint_template.js'));

const strategies = [
  (c) => { c.BULLET_SPACING = Math.max(20, (c.BULLET_SPACING || 28) - 1); return c; },
  (c) => { c.LAST_BULLET_SPACING = Math.max(5, (c.LAST_BULLET_SPACING || 10) - 1); return c; },
  (c) => { c.HEADER_BEFORE_SPACING = Math.max(60, (c.HEADER_BEFORE_SPACING || 90) - 2); return c; },
  (c) => { c.HEADER_AFTER_SPACING = Math.max(20, (c.HEADER_AFTER_SPACING || 35) - 1); return c; },
  (c) => { c.ROLE_BEFORE_SPACING = Math.max(40, (c.ROLE_BEFORE_SPACING || 60) - 2); return c; },
  (c) => { c.ROLE_AFTER_SPACING = Math.max(15, (c.ROLE_AFTER_SPACING || 22) - 1); return c; },
  (c) => { c.CERT_SPACING = Math.max(20, (c.CERT_SPACING || 32) - 1); return c; },
  (c) => { c.EDU_SPACING = Math.max(24, (c.EDU_SPACING || 36) - 1); return c; },
  (c) => { c.PAGE_MARGIN_TOP = Math.max(500, (c.PAGE_MARGIN_TOP || 650) - 10); return c; },
  (c) => { c.PAGE_MARGIN_BOTTOM = Math.max(450, (c.PAGE_MARGIN_BOTTOM || 580) - 10); return c; },
  (c) => { c.PAGE_MARGIN_LEFT = Math.max(600, (c.PAGE_MARGIN_LEFT || 800) - 20); return c; },
  (c) => { c.PAGE_MARGIN_RIGHT = Math.max(600, (c.PAGE_MARGIN_RIGHT || 800) - 20); return c; },
];

function checkConfig(c) {
  const C = engine.validateConfig(c);
  const html = generateHTML(C, candidateProfile);
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  const charCount = bodyText.length;
  const boldCount = (html.match(/<strong>/g) || []).length;
  const htmlLower = html.toLowerCase();
  const sections = ['why i fit', 'role pillars', 'professional experience', 'education', 'numbers', 'tools', 'certifications'];
  const missing = sections.filter(s => !htmlLower.includes(s));
  const hasZapier = htmlLower.includes('zapier');
  const hasN8n = htmlLower.includes('n8n');
  const hyphenRe = /[-—]/;
  let hasHyphen = false;
  ['TAGLINE', 'SUMMARY', 'WHY_I_FIT'].forEach(f => { if (C[f] && hyphenRe.test(C[f])) hasHyphen = true; });
  if (C.EXPERIENCE) C.EXPERIENCE.forEach(e => (e.bullets || []).forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; }));
  if (C.PROJECTS) C.PROJECTS.forEach(p => (p.bullets || []).forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; }));
  if (C.PROJECT_BULLETS) C.PROJECT_BULLETS.forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; });
  if (C.ROLE_PILLARS) C.ROLE_PILLARS.forEach(p => p.bullets.forEach(b => { if (hyphenRe.test(b)) hasHyphen = true; }));
  const ok = missing.length === 0 && charCount > 2000 && boldCount >= 40 && !hasZapier && !hasN8n && !hasHyphen;
  return { ok, charCount, boldCount, missing };
}

let bestConfig = JSON.parse(JSON.stringify(validatedConfig));
let bestResult = checkConfig(bestConfig);
let passCount = 0;

for (let i = 0; i < 100; i++) {
  const testConfig = JSON.parse(JSON.stringify(bestConfig));
  strategies[i % strategies.length](testConfig);
  const result = checkConfig(testConfig);
  if (result.ok) {
    bestConfig = testConfig;
    bestResult = result;
    passCount++;
  }
}

console.log(`Iterations: ${passCount}/100 PASS`);
console.log(`Best: ${bestResult.charCount} chars, ${bestResult.boldCount} bolds`);

// Save optimised config
fs.writeFileSync(configPath, JSON.stringify(bestConfig, null, 2));

// ══════════════════════════════════════════════════════════════════════
//  STEP 3: RENDER PDF VIA WEASYPRINT
// ══════════════════════════════════════════════════════════════════════
hr('STEP 3: Render PDF');

const C = engine.validateConfig(bestConfig);
const htmlContent = generateHTML(C, candidateProfile);
const htmlPath = path.join(outDir, 'cv_final.html');
fs.writeFileSync(htmlPath, htmlContent);

const tmpPdfPath = path.join(require('os').tmpdir(), `build_${Date.now()}.pdf`);
execSync(`python -m weasyprint "${htmlPath}" "${tmpPdfPath}"`, { env: wpEnv, stdio: 'pipe' });

const pageCount = parseInt(
  execSync(`python -c "from PyPDF2 import PdfReader; print(len(PdfReader(r'${tmpPdfPath.replace(/\\/g, '\\\\')}').pages))"`, { env: wpEnv, encoding: 'utf8' }).trim()
);

const pdfFileName = (C.CV_OUTPUT || 'CV.pdf').replace('.docx', '.pdf');
let pdfPath = path.join(outDir, pdfFileName);
function copyWithRetry(src, dest, retries) {
  for (let i = 0; i < retries; i++) {
    try { fs.copyFileSync(src, dest); return dest; } catch (e) {
      if (i < retries - 1) { dest = dest.replace('.pdf', `_v${i + 2}.pdf`); }
    }
  }
  return dest;
}
pdfPath = copyWithRetry(tmpPdfPath, pdfPath, 5);
console.log(`PDF: ${pdfPath} (${pageCount} pages)`);

if (pageCount !== 2) {
  console.error(`FAIL: Expected 2 pages, got ${pageCount}`);
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════════════
//  STEP 4: QC CHECKS (CORE + USER RULES)
// ══════════════════════════════════════════════════════════════════════
hr('STEP 4: QC Checks');

const { runCoreChecks } = require(path.join(templatesDir, 'qc_core_checks.js'));
const { runUserChecks } = require(path.join(templatesDir, 'qc_user_checks.js'));

const pdfSize = fs.existsSync(pdfPath) ? fs.statSync(pdfPath).size : 0;
const coreResults = runCoreChecks(C, htmlContent, pageCount, pdfPath, pdfSize, userRules);
const userResults = runUserChecks(C, htmlContent, userRules);
const results = [...coreResults, ...userResults];

// ══════════════════════════════════════════════════════════════════════
//  STEP 5: REPORT
// ══════════════════════════════════════════════════════════════════════
hr('STEP 5: Final Report');
const strongCount = (htmlContent.match(/<strong/g) || []).length;
const bodyMatch = htmlContent.match(/<body>([\s\S]*)<\/body>/);
const charCount = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, '').trim().length : 0;

const passTotal = results.filter(r => r.pass).length;
const totalChecks = results.length;
const failTotal = totalChecks - passTotal;

console.log(`\n  QC Score: ${passTotal}/${totalChecks}`);
console.log(`  Pages: ${pageCount}`);
console.log(`  Content: ${charCount} chars`);
console.log(`  Bold: ${strongCount} tags`);
console.log(`  Archetype: ${archetype}`);
console.log(`  PDF: ${pdfPath}`);

if (failTotal === 0) {
  console.log(`\n  BUILD SUCCESS — all ${totalChecks} QC checks passed.`);
} else {
  console.log(`\n  BUILD PARTIAL — ${failTotal} QC check(s) failed:`);
  results.filter(r => !r.pass).forEach(r => console.log(`    FAIL: ${r.name}`));
}

// Clean up temp files
try { fs.unlinkSync(path.join(outDir, 'cv_check.html')); } catch (e) {}
try { fs.unlinkSync(path.join(outDir, 'qc20_check.html')); } catch (e) {}
