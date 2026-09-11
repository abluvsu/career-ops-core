const fs = require('fs');
const path = require('path');
const { z } = require('zod');
let puppeteer;
const { TextRun, ExternalHyperlink } = require('docx');

// Load central candidate profile if present
let profile = {};
try {
  profile = require(path.resolve(__dirname, '../reference/profile.json'));
} catch (e) {}

const ExperienceTypeEnum = z.enum([
  'full-time',
  'part-time',
  'contract',
  'independent',
  'internship'
]);

const ExperienceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  organization: z.string(),
  dates: z.string(),
  type: ExperienceTypeEnum.default('full-time'),
  label: z.string().optional(),
  intro: z.string().optional(),
  bullets: z.array(z.string()).min(1),
  minBullets: z.number().int().positive().optional()
});

const ProjectItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  organization: z.string().optional(),
  dates: z.string().optional(),
  type: z.literal('independent').default('independent').optional(),
  label: z.string().optional(),
  intro: z.string().optional(),
  bullets: z.array(z.string()).min(1),
  minBullets: z.number().int().positive().optional()
});

// Define Unified Zod Schema
const configSchema = z.object({
  CV_OUTPUT: z.string(),
  CL_OUTPUT: z.string().optional(),
  TAGLINE: z.string(),
  LOCATION: z.string().optional(),
  SUMMARY: z.string(),
  TOOLS: z.string().optional(),
  COMPETENCIES: z.array(z.array(z.string())),
  EXPERIENCE: z.array(ExperienceItemSchema).min(1),
  PROJECTS: z.array(ProjectItemSchema).optional(),
  PROJECT_BULLETS: z.array(z.string()).optional(),
  EMAIL_SUBJECT: z.string().optional(),
  RECIPIENT_FULL: z.string().optional(),
  RECIPIENT_TITLE: z.string().optional(),
  COMPANY: z.string().optional(),
  ROLE: z.string().optional(),
  RECIPIENT_NAME: z.string().optional(),
  PARA_1: z.string().optional(),
  PARA_2: z.string().optional(),
  PARA_3: z.string().optional(),
  PARA_4: z.string().optional(),
  DATE: z.string().optional(),
  THEME_COLOR: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#DC3522"),
  BULLET_SPACING: z.number().optional(),
  LAST_BULLET_SPACING: z.number().optional(),
  HEADER_BEFORE_SPACING: z.number().optional(),
  HEADER_AFTER_SPACING: z.number().optional(),
  ROLE_BEFORE_SPACING: z.number().optional(),
  ROLE_AFTER_SPACING: z.number().optional(),
  CERT_SPACING: z.number().optional(),
  EDU_SPACING: z.number().optional(),
  PAGE_MARGIN_TOP: z.number().optional(),
  PAGE_MARGIN_BOTTOM: z.number().optional(),
  PAGE_MARGIN_LEFT: z.number().optional(),
  PAGE_MARGIN_RIGHT: z.number().optional(),
  SCHEMA_VERSION: z.number().optional()
}).passthrough();

/**
 * Parses rich text strings containing markdown bold **text** or links [label](url)
 */
function parseRich(text, size = 19, font = "Calibri") {
  const tokenRe = /(\*\*.*?\*\*|\[[^\]]+\]\([^)]+\))/g;
  return text.split(tokenRe).filter(Boolean).map(seg => {
    const link = seg.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return new ExternalHyperlink({
        link: link[2],
        children: [new TextRun({ text: link[1], style: "Hyperlink", size, font })],
      });
    }
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return new TextRun({ text: seg.slice(2, -2), bold: true, size, font });
    }
    return new TextRun({ text: seg, size, font });
  });
}

/**
 * Fallback file-lock writing procedure
 */
function saveFileWithLockFallback(filePath, buffer) {
  try {
    fs.writeFileSync(filePath, buffer);
    return filePath;
  } catch (err) {
    if (err.code === 'EBUSY' || err.code === 'EPERM') {
      const ext = path.extname(filePath);
      const base = filePath.slice(0, -ext.length);
      const fallbackPath = `${base}_v2${ext}`;
      console.warn(`Original file is locked. Writing to fallback: ${fallbackPath}`);
      fs.writeFileSync(fallbackPath, buffer);
      return fallbackPath;
    } else {
      throw err;
    }
  }
}

/**
 * Validates config structure and content constraints.
 * STRICT vs LEGACY modes:
 * If SCHEMA_VERSION === 3, enforce hard crash checks (process.exit(1)).
 * Otherwise, output warnings via console.warn and proceed.
 */
function validateConfig(config) {
  const parsed = configSchema.safeParse(config);
  const isStrict = config.SCHEMA_VERSION === 3;
  let C = config;

  if (!parsed.success) {
    const errMsg = "Config validation failed: " + JSON.stringify(parsed.error.issues, null, 2);
    if (isStrict) {
      console.error("FAIL: " + errMsg);
      process.exit(1);
    } else {
      console.warn("WARNING: " + errMsg);
    }
  } else {
    C = parsed.data;
  }

  // 1. Min primary experience bullets count check
  if (!C.EXPERIENCE || C.EXPERIENCE.length === 0) {
    const msg = "EXPERIENCE must contain a minimum of 1 work experience entry.";
    if (isStrict) {
      console.error("FAIL: " + msg);
      process.exit(1);
    } else {
      console.warn("WARNING: " + msg);
    }
  } else {
    const primaryExp = C.EXPERIENCE[0];
    const minBullets = primaryExp.minBullets || 4;
    if (!primaryExp.bullets || primaryExp.bullets.length < minBullets) {
      const msg = `Primary work experience must contain a minimum of ${minBullets} points.`;
      if (isStrict) {
        console.error("FAIL: " + msg);
        process.exit(1);
      } else {
        console.warn("WARNING: " + msg);
      }
    }
  }

  // 2. Project URL existence check
  const allProjects = [
    ...(C.PROJECTS || []),
    ...((C.PROJECT_BULLETS || []).map(b => ({ bullets: [b] })))
  ];
  const allProjectBullets = allProjects.flatMap(p => p.bullets || []);
  const hasProjectBulletUrl = allProjectBullets.length > 0 && allProjectBullets.some(b => b.includes('http') || b.includes('www'));
  if (C.PORTFOLIO_URL_REQUIRED !== false && !hasProjectBulletUrl && allProjects.length > 0) {
    const msg = "PROJECTS must contain at least one project bullet with a valid URL link (e.g. to the portfolio).";
    if (isStrict) {
      console.error("FAIL: " + msg);
      process.exit(1);
    } else {
      console.warn("WARNING: " + msg);
    }
  }

  // 3. Widow/Orphan range checks
  const allBullets = [
    ...(C.EXPERIENCE ? C.EXPERIENCE.flatMap(e => e.bullets || []) : []),
    ...(C.PROJECTS ? C.PROJECTS.flatMap(p => p.bullets || []) : []),
    ...(C.PROJECT_BULLETS || [])
  ];
  for (const text of allBullets) {
    const plainText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '');
    const len = plainText.length;
    if (len > 115 && len < 180) {
      const msg = `Widow/Orphan detected in bullet. Length is ${len} chars. This leaves >40% whitespace on the second line. Bullets must be exactly 1 line (95-115 chars) or 2 full lines (180-230 chars). Rewrite this bullet: "${plainText.slice(0, 30)}..."`;
      if (isStrict) {
        console.error("FIT FAIL: " + msg);
        process.exit(1);
      } else {
        console.warn("WARNING: " + msg);
      }
    }
  }

  // 4. Claims linter validation checks
  try {
    const lintGate = require(path.resolve(__dirname, '../autoapply/src/gates/lint.js'));
    let lintResult = lintGate.lintConfig(C);
    if (lintGate.loadCanonicalTokens && (C.EXPERIENCE || C.PROJECTS)) {
      const canonicalTokens = lintGate.loadCanonicalTokens();
      const violations = [...(lintResult.violations || [])];
      const checkText = (field, text) => {
        for (const token of lintGate.extractTokens(text)) {
          const isAllow = /^(19|20)\d{2}$/.test(token) || /^4(yrs?|years?)$/.test(token) || /^[1-9]$/.test(token) || /^90days?$/.test(token) || /^63l\+?$/.test(token) || /^8club$/i.test(token);
          if (!canonicalTokens.has(token) && !isAllow) {
            violations.push({ field, token });
          }
        }
      };
      if (C.EXPERIENCE) {
        for (const exp of C.EXPERIENCE) {
          if (exp.intro) checkText(`EXPERIENCE[${exp.id || ''}].intro`, exp.intro);
          for (const b of exp.bullets || []) {
            checkText(`EXPERIENCE[${exp.id || ''}].bullets`, b);
          }
        }
      }
      if (C.PROJECTS) {
        for (const proj of C.PROJECTS) {
          if (proj.intro) checkText(`PROJECTS[${proj.id || ''}].intro`, proj.intro);
          for (const b of proj.bullets || []) {
            checkText(`PROJECTS[${proj.id || ''}].bullets`, b);
          }
        }
      }
      lintResult = { ok: violations.length === 0, violations };
    }
    if (!lintResult.ok) {
      const violationsStr = lintResult.violations.map(v => `${v.field}: unrecognized token "${v.token}"`).join(', ');
      const msg = "Claims Linter failed: " + violationsStr;
      if (isStrict) {
        console.error("FAIL: " + msg);
        process.exit(1);
      } else {
        console.warn("WARNING: " + msg);
      }
    }
  } catch (e) {
    if (e.message && e.message.startsWith('exit:')) {
      throw e;
    }
    console.warn("WARNING: Could not run claims linter: " + e.message);
  }

  // 5. Cover letter specific validation checks (word cap & relocation conclusion)
  if (C.CL_OUTPUT) {
    const clParas = [C.PARA_1, C.PARA_2, C.PARA_3, C.PARA_4].filter(Boolean);
    if (clParas.length > 0) {
      const clText = clParas.join(' ');
      const wordCount = clText.split(/\s+/).filter(Boolean).length;
      if (wordCount > 300) {
        const msg = `Cover Letter exceeds 300 words limit. Current: ${wordCount} words.`;
        if (isStrict) {
          console.error("FAIL: " + msg);
          process.exit(1);
        } else {
          console.warn("WARNING: " + msg);
        }
      }

      const lastPara = C.PARA_4 || C.PARA_3 || "";
      if (!lastPara.includes("I am open to relocation and can join within 15 days.")) {
        const msg = `Cover Letter must conclude with: "I am open to relocation and can join within 15 days."`;
        if (isStrict) {
          console.error("FAIL: " + msg);
          process.exit(1);
        } else {
          console.warn("WARNING: " + msg);
        }
      }
    }
  }

  return C;
}

/**
 * Fit-Guard Visual height checks using Puppeteer
 */
async function runFitGuard(htmlPath, pdfPath, isStrict = false, configOrPath = null) {
  let browser;
  try {
    if (!puppeteer) {
      try { puppeteer = require('puppeteer'); } catch (e) {
        console.warn("Puppeteer not installed, skipping visual Fit-Guard.");
        return;
      }
    }
    browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.goto('file://' + path.resolve(htmlPath), { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');

    let C = {};
    if (typeof configOrPath === 'object' && configOrPath !== null) {
      C = configOrPath;
    } else if (typeof configOrPath === 'string' && fs.existsSync(configOrPath)) {
      try { C = JSON.parse(fs.readFileSync(configOrPath, 'utf8')); } catch (e) {}
    }

    const isExtended = C.FORMAT_TYPE === 'extended';
    const CONTENT_BUDGET_CM = isExtended ? 56.0 : 27.5;
    const MAX_BUDGET_CM = isExtended ? 56.1 : 27.6;
    const ALLOWED_GAP = isExtended ? 7.0 : 1.2;
    const PX_PER_CM = 96 / 2.54;

    const contentPx = await page.evaluate(() => {
      const b = document.body, max = b.style.maxHeight, ov = b.style.overflow;
      b.style.maxHeight = 'none'; b.style.overflow = 'visible';
      const h = b.scrollHeight;
      b.style.maxHeight = max; b.style.overflow = ov;
      return h;
    });
    const contentCm = contentPx / PX_PER_CM;
    const gapCm = CONTENT_BUDGET_CM - contentCm;

    let fitOk = true;
    let errorMsg = "";

    if (contentCm > MAX_BUDGET_CM) {
      errorMsg = `FIT FAIL: ${contentCm.toFixed(1)}cm > ${MAX_BUDGET_CM}cm budget — bottom content is being CLIPPED. Cut a bullet or reduce spacing.`;
      fitOk = false;
    } else if (gapCm > ALLOWED_GAP) {
      errorMsg = `FIT FAIL: ${gapCm.toFixed(1)}cm blank at bottom (>${ALLOWED_GAP}cm). Strict rule violated. Add spacing/margins or a real bullet.`;
      fitOk = false;
    }

    if (!fitOk) {
      if (isStrict) {
        console.error(errorMsg);
        process.exitCode = 1;
        throw new Error(errorMsg);
      } else {
        console.warn("WARNING: " + errorMsg);
      }
    } else {
      console.log(`FIT OK: content ${contentCm.toFixed(1)}cm, gap ${gapCm.toFixed(1)}cm.`);
    }

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    const finalPdfPath = saveFileWithLockFallback(pdfPath, pdfBuffer);
    console.log("CV PDF:", finalPdfPath);
    return { fitOk, finalPdfPath, contentCm, gapCm };
  } finally {
    if (browser) {
      await browser.close();
    }
    // Clean up temporary cv_temp.html
    try {
      if (fs.existsSync(htmlPath)) {
        fs.unlinkSync(htmlPath);
      }
    } catch (e) {
      // Ignore cleanup error if file not found
    }
  }
}

module.exports = {
  profile,
  configSchema,
  ExperienceTypeEnum,
  ExperienceItemSchema,
  ProjectItemSchema,
  parseRich,
  saveFileWithLockFallback,
  validateConfig,
  runFitGuard
};
