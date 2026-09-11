// Generic Claims Linter: validates numeric tokens in CV configs against a canonical proof-bank.md
// Pure deterministic string matching — prevents hallucinated metrics.
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_PROOF_BANK_PATH = path.resolve(__dirname, "..", "reference", "proof-bank.md");

const NUM_TOKEN_RE =
  /(?:rs\.?\s?|₹\s?)?\d+(?:,\d+)*(?:\.\d+)?\s?(?:%|\+|l\+?|cr\+?|k\+?|ms|mins?|hrs?|days?|yrs?|years?|agents?|properties|locations?|leads?|interactions?)?/gi;

function normalizeToken(tok) {
  return tok
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/₹/g, "rs")
    .replace(/\s+/g, "")
    .replace(/^rs\.?/, "");
}

function extractTokens(text) {
  const matches = String(text || "").match(NUM_TOKEN_RE) || [];
  return matches.map(normalizeToken).filter((t) => /\d/.test(t));
}

function resolveProofBankPath(filePath) {
  if (filePath && fs.existsSync(filePath)) return filePath;
  if (process.env.PROOF_BANK_PATH && fs.existsSync(process.env.PROOF_BANK_PATH)) {
    return process.env.PROOF_BANK_PATH;
  }
  const candidatePaths = [
    filePath,
    path.resolve(process.cwd(), "reference", "proof-bank.md"),
    path.resolve(__dirname, "..", "reference", "proof-bank.md"),
    path.resolve(__dirname, "..", "..", "reference", "proof-bank.md"),
    path.resolve(__dirname, "..", "reference-templates", "proof-bank.template.md"),
    path.resolve(__dirname, "..", "schemas", "proof-bank.template.md")
  ].filter(Boolean);

  for (const cand of candidatePaths) {
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

function loadCanonicalTokens(filePath = null) {
  const resolvedPath = resolveProofBankPath(filePath);
  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    return new Set();
  }
  const text = fs.readFileSync(resolvedPath, "utf8");
  const tokens = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (!/^\d+$/.test(cells[1] || "")) continue;
    for (const t of extractTokens(cells[3] || "")) tokens.add(t);
  }
  return tokens;
}

const ALLOWLIST_PATTERNS = [
  /^(19|20)\d{2}$/,
  /^4(yrs?|years?)$/,
  /^[1-9]$/,
  /^90days?$/,
  /^63l\+?$/,
  /^8club$/i,
];

function isAllowlisted(token) {
  return ALLOWLIST_PATTERNS.some((re) => re.test(token));
}

const CONTENT_FIELDS = [
  "TAGLINE", "SUMMARY", "PARA_1", "PARA_2", "PARA_3", "PARA_4",
  "WHY_I_FIT", "ROLE_INTRO", "NUMBERS_INTRO"
];
const BULLET_ARRAY_FIELDS = ["PROJECT_BULLETS"];

function lintConfig(config, canonicalTokens = null) {
  const tokens = canonicalTokens || loadCanonicalTokens();
  const violations = [];
  const checkField = (field, text) => {
    for (const token of extractTokens(text)) {
      if (!tokens.has(token) && !isAllowlisted(token)) violations.push({ field, token });
    }
  };

  for (const field of CONTENT_FIELDS) {
    if (config[field]) checkField(field, config[field]);
  }
  for (const field of BULLET_ARRAY_FIELDS) {
    for (const bullet of config[field] || []) checkField(field, bullet);
  }
  if (Array.isArray(config.COMPETENCIES)) {
    for (const group of config.COMPETENCIES) for (const item of group) checkField("COMPETENCIES", item);
  }
  if (Array.isArray(config.EXPERIENCE)) {
    for (const exp of config.EXPERIENCE) {
      if (exp.intro) checkField(`EXPERIENCE[${exp.id || ''}].intro`, exp.intro);
      for (const b of exp.bullets || []) {
        checkField(`EXPERIENCE[${exp.id || ''}].bullets`, b);
      }
    }
  }
  if (Array.isArray(config.PROJECTS)) {
    for (const proj of config.PROJECTS) {
      if (proj.intro) checkField(`PROJECTS[${proj.id || ''}].intro`, proj.intro);
      for (const b of proj.bullets || []) {
        checkField(`PROJECTS[${proj.id || ''}].bullets`, b);
      }
    }
  }

  return { ok: violations.length === 0, violations };
}

module.exports = {
  lintConfig,
  loadCanonicalTokens,
  extractTokens,
  normalizeToken,
  resolveProofBankPath,
  PROOF_BANK_PATH: DEFAULT_PROOF_BANK_PATH
};
