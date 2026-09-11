'use strict';
const fs = require('fs');
const path = require('path');
const engine = require('./engine.js');

// Parse CLI arguments
const args = process.argv.slice(2);
const params = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].substring(2);
    if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
      params[key] = args[i + 1];
      i++;
    } else {
      params[key] = true;
    }
  }
}

if (!params['in'] || !params['archetype']) {
  console.error("Usage: node assemble_config.js --in <partial_config.json> --archetype <Archetype_Name> [--data-root <path>] [--out <output_config.json>]");
  console.error("Available archetypes: Operator, Builder, Strategist, Analyst, Transformation Lead, Domain Expert");
  process.exit(1);
}

const partialPath = path.resolve(process.cwd(), params['in']);
const outPath = params['out'] ? path.resolve(process.cwd(), params['out']) : path.resolve(path.dirname(partialPath), 'config.json');
const archetype = params['archetype'];
const templatesDir = __dirname;

function resolveDataRoot(inputPath, tplDir) {
  if (inputPath) {
    const resolved = path.resolve(process.cwd(), inputPath);
    if (path.basename(resolved) === 'reference' && fs.existsSync(resolved)) {
      return path.dirname(resolved);
    }
    return resolved;
  }
  const cwdRef = path.resolve(process.cwd(), 'reference');
  if (fs.existsSync(cwdRef)) return process.cwd();
  const rootRef = path.resolve(tplDir, '..', 'reference');
  if (fs.existsSync(rootRef)) return path.resolve(tplDir, '..');
  return path.resolve(tplDir, '..');
}

const dataRoot = resolveDataRoot(params['data-root'], templatesDir);

console.log(`Assembling config for archetype: ${archetype}`);
console.log(`Data Root: ${dataRoot}`);

// 1. Load Defaults
const defaultsPath = path.resolve(templatesDir, 'config_defaults.json');
const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));

// 2. Load Bullet Library
const libraryPath = path.join(dataRoot, 'reference', 'bullet-library.json');
if (!fs.existsSync(libraryPath)) {
  console.error(`ERROR: bullet-library.json not found at ${libraryPath}`);
  process.exit(1);
}
const bulletLibrary = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));

if (!bulletLibrary[archetype]) {
  console.error(`ERROR: Archetype "${archetype}" not found in bullet-library.json`);
  process.exit(1);
}
const frozenBullets = bulletLibrary[archetype];

// 3. Load Partial Config (JD specific custom 25%)
let partialConfig = {};
try {
  partialConfig = JSON.parse(fs.readFileSync(partialPath, 'utf8'));
} catch (e) {
  console.error(`ERROR: Could not read or parse partial config at ${partialPath}`, e);
  process.exit(1);
}

// 4. Load QC Rules and Candidate Profile if present
const userRulesPath = path.join(dataRoot, 'reference', 'qc-rules.json');
let userRules = {};
if (fs.existsSync(userRulesPath)) {
  try {
    userRules = JSON.parse(fs.readFileSync(userRulesPath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {}
}

const profilePath = path.join(dataRoot, 'reference', 'profile.json');
let candidateProfile = null;
if (fs.existsSync(profilePath)) {
  try {
    candidateProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {}
}

const proofBankPath = path.join(dataRoot, 'reference', 'proof-bank.md');
if (fs.existsSync(proofBankPath)) {
  process.env.PROOF_BANK_PATH = proofBankPath;
}

// 5. Merge
const finalConfig = {
  ...defaults,
  ...(candidateProfile ? { PROFILE: candidateProfile } : {}),
  ...(userRules.portfolioUrlRequired !== undefined ? { PORTFOLIO_URL_REQUIRED: userRules.portfolioUrlRequired } : {}),
  ...(fs.existsSync(proofBankPath) ? { PROOF_BANK_PATH: proofBankPath } : {}),
  ...partialConfig,
  // Force frozen experience and projects for the chosen archetype
  EXPERIENCE: frozenBullets.EXPERIENCE,
  ...(frozenBullets.PROJECTS ? { PROJECTS: frozenBullets.PROJECTS } : {}),
  ...(frozenBullets.PROJECT_BULLETS ? { PROJECT_BULLETS: frozenBullets.PROJECT_BULLETS } : {})
};

// Map partial overrides onto EXPERIENCE and PROJECTS if present
if (finalConfig.EXPERIENCE) {
  finalConfig.EXPERIENCE = finalConfig.EXPERIENCE.map((exp, idx) => {
    const copy = { ...exp };
    if (idx === 0 && (partialConfig.ROLE_INTRO || partialConfig.PRIMARY_ROLE_INTRO)) copy.intro = partialConfig.ROLE_INTRO || partialConfig.PRIMARY_ROLE_INTRO;
    if (idx === 1 && (partialConfig.SECONDARY_ROLE_INTRO || partialConfig.ROLE_INTRO_2)) copy.intro = partialConfig.SECONDARY_ROLE_INTRO || partialConfig.ROLE_INTRO_2;
    if (exp.id && partialConfig[`${exp.id.toUpperCase()}_INTRO`]) copy.intro = partialConfig[`${exp.id.toUpperCase()}_INTRO`];
    return copy;
  });
}
if (finalConfig.PROJECTS && partialConfig.PROJECT_TITLE) {
  finalConfig.PROJECTS = finalConfig.PROJECTS.map((proj, idx) => {
    if (idx === 0) return { ...proj, title: partialConfig.PROJECT_TITLE };
    return proj;
  });
}

// 6. Pre-Commit Validation Checks (DYNAMIC 2-PAGE RESUME BUILDER spec)
console.log("=== LEVEL 1 CHECK: Pre-Assembly Validation ===");

// Check 1: Pillar Count
const minPillars = userRules.minPillarsCount !== undefined ? userRules.minPillarsCount : (userRules.minPillars !== undefined ? userRules.minPillars : 6);
if (!finalConfig.ROLE_PILLARS || finalConfig.ROLE_PILLARS.length < minPillars) {
  console.error(`FAIL: Pillar Check failed. Expected at least ${minPillars} ROLE_PILLARS, found ${finalConfig.ROLE_PILLARS ? finalConfig.ROLE_PILLARS.length : 0}.`);
  process.exit(1);
}

// Check 2: Variance Check (Text modification delta <= 25%)
const baselineLength = JSON.stringify({ ...defaults, EXPERIENCE: frozenBullets.EXPERIENCE, PROJECTS: frozenBullets.PROJECTS }).length;
const partialLength = JSON.stringify(partialConfig).length;
const varianceRatio = partialLength / (baselineLength + partialLength);
if (varianceRatio > 0.25) {
  console.error(`FAIL: Variance Check failed. Text modification delta is ${(varianceRatio * 100).toFixed(1)}% (exceeds 25% ceiling).`);
} else {
  console.log(`PASS: Variance Check OK. Modification delta is ${(varianceRatio * 100).toFixed(1)}%.`);
}

// 7. Validate Schema
console.log("Validating assembled config against schema...");
try {
  const validatedConfig = engine.validateConfig(finalConfig);
  
  // Write to output
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  fs.writeFileSync(outPath, JSON.stringify(validatedConfig, null, 2), 'utf8');
  console.log(`SUCCESS: Assembled config written to ${outPath}`);
} catch (e) {
  console.error("ASSEMBLY FAILED during validation:", e.message);
  process.exit(1);
}
