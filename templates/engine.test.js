const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const engine = require('./engine.js');

// 1. Helper to assert if a config validation succeeds (no process.exit)
function assertPass(config) {
  const originalExit = process.exit;
  let exitCalled = false;
  process.exit = (code) => {
    exitCalled = true;
    throw new Error(`exit:${code}`);
  };
  try {
    const validated = engine.validateConfig(config);
    assert.strictEqual(exitCalled, false, "Should not exit");
    assert.ok(validated, "Should return validated config");
  } catch (e) {
    if (e.message.startsWith('exit:')) {
      assert.fail(`Expected pass, but exited with code ${e.message.split(':')[1]}`);
    } else {
      throw e;
    }
  } finally {
    process.exit = originalExit;
  }
}

// Helper to assert if a config validation fails (process.exit(1))
function assertFail(config) {
  const originalExit = process.exit;
  let exitCode = null;
  process.exit = (code) => {
    exitCode = code;
    throw new Error(`exit:${code}`);
  };
  try {
    engine.validateConfig(config);
    assert.fail("Expected failure, but validation passed without exit");
  } catch (e) {
    if (e.message.startsWith('exit:')) {
      assert.strictEqual(exitCode, 1, "Should exit with code 1");
    } else {
      throw e;
    }
  } finally {
    process.exit = originalExit;
  }
}

const baseConfig = {
  SCHEMA_VERSION: 3,
  CV_OUTPUT: "dummy_cv.docx",
  CL_OUTPUT: "dummy_cl.docx",
  TAGLINE: "Senior Manager, Data & Analytics",
  LOCATION: "Bengaluru",
  SUMMARY: "Highly driven Senior Manager with Rs 5 Cr+ in operational scale. Led 70+ enterprise workflows.",
  TOOLS: "Power BI, Python, SQL",
  COMPETENCIES: [
    ["Product Incubation", "AI Strategy", "Customer Discovery"]
  ],
  EXPERIENCE: [
    {
      id: "primary",
      title: "Senior Manager, Strategy and Analytics",
      organization: "ICICI Prudential Life Insurance",
      dates: "May 2022 â€“ Present",
      type: "full-time",
      minBullets: 4,
      bullets: [
        "Drove campaign analytics conversion lift of **30%** across 800+ campaigns and 25L+ customer records in Bengaluru.",
        "Engineered fraud detection model with 99%+ accuracy reducing TAT from 7 days to 15 mins for 32K records.",
        "Delivered 70+ enterprise workflows resulting in Rs 5 Cr+ in annualised savings across business units.",
        "Led model cost optimization cutting compute costs by 25% while maintaining 99.85% accuracy threshold."
      ]
    },
    {
      id: "consulting",
      title: "Product Management Consultant (Part Time)",
      organization: "SARVM.AI, Bengaluru",
      dates: "Jan 2024 â€“ May 2024",
      type: "part-time",
      label: "Part Time",
      bullets: [
        "Consulted on data pipelines and product feature definition for Sarvm AI platform incubation phase."
      ]
    }
  ],
  PROJECTS: [
    {
      id: "projects",
      title: "Independent Projects",
      type: "independent",
      bullets: [
        "Built CareerFlow AI product using LLMs [Project Link â†—](https://example.com/)."
      ]
    }
  ],
  EMAIL_SUBJECT: "Application for Senior Manager role",
  PARA_1: "Dear Hiring Team, I am writing to apply for this role.",
  PARA_2: "I have 4 years of data leadership experience.",
  PARA_3: "I look forward to discussing my background.",
  PARA_4: "Sincerely, I am open to relocation and can join within 15 days.",
  DATE: "June 2026",
  RECIPIENT_FULL: "Hiring Manager",
  RECIPIENT_TITLE: "VP, Engineering",
  COMPANY: "Tech Corp",
  ROLE: "Senior Manager"
};

test('Batch compilation check of legacy configs', () => {
  // Verifies that validation does not crash or exit on legacy configurations
  const sampleDirs = ['EY_AI_Consulting_Lead', 'KPMG_Gen_AI_Consultant', 'abg_operations', 'adobe_ai_manager'];
  for (const dir of sampleDirs) {
    const configPath = path.resolve(__dirname, '../outputs', dir, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      // Ensure SCHEMA_VERSION is not 3 (legacy)
      const validated = engine.validateConfig(config);
      assert.ok(validated, `Legacy config ${dir} should validate successfully`);
    }
  }
});

test('Passthrough of custom HTML properties', () => {
  const customConfig = {
    ...baseConfig,
    HTML_LI_MARGIN: "4px",
    HTML_FONT_SIZE: "10pt"
  };
  const validated = engine.validateConfig(customConfig);
  assert.strictEqual(validated.HTML_LI_MARGIN, "4px");
  assert.strictEqual(validated.HTML_FONT_SIZE, "10pt");
});

test('Widow guard boundary checks in strict mode', () => {
  const replaceFirstBullet = (bullet) => [
    {
      ...baseConfig.EXPERIENCE[0],
      bullets: [bullet, ...baseConfig.EXPERIENCE[0].bullets.slice(1)]
    },
    ...baseConfig.EXPERIENCE.slice(1)
  ];

  // 115 length: should PASS
  const bullet115 = 'a'.repeat(115);
  const config115 = {
    ...baseConfig,
    EXPERIENCE: replaceFirstBullet(bullet115)
  };
  assertPass(config115);

  // 116 length: should FAIL
  const bullet116 = 'a'.repeat(116);
  const config116 = {
    ...baseConfig,
    EXPERIENCE: replaceFirstBullet(bullet116)
  };
  assertFail(config116);

  // 179 length: should FAIL
  const bullet179 = 'a'.repeat(179);
  const config179 = {
    ...baseConfig,
    EXPERIENCE: replaceFirstBullet(bullet179)
  };
  assertFail(config179);

  // 180 length: should PASS
  const bullet180 = 'a'.repeat(180);
  const config180 = {
    ...baseConfig,
    EXPERIENCE: replaceFirstBullet(bullet180)
  };
  assertPass(config180);
});

test('Fit-Guard visual checks', async () => {
  const originalExitCode = process.exitCode;
  
  try {
    // 1. Overflow check: Too long content (> 27.6cm)
    const overflowHtml = path.resolve(__dirname, 'temp_overflow_test.html');
    fs.writeFileSync(overflowHtml, `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0;">
          <div style="height: 30cm; background: red;">Overflow Content</div>
        </body>
      </html>
    `);
    
    process.exitCode = 0;
    try {
      await engine.runFitGuard(overflowHtml, 'dummy_pdf.pdf', true);
      assert.fail("Expected runFitGuard to throw error for overflow");
    } catch (e) {
      assert.strictEqual(process.exitCode, 1, "Exit code should be set to 1 on overflow");
    }

    // 2. Large gap check: Too short content (gap > 1.2cm, meaning height < 26.3cm)
    const gapHtml = path.resolve(__dirname, 'temp_gap_test.html');
    fs.writeFileSync(gapHtml, `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0;">
          <div style="height: 10cm; background: blue;">Short Content</div>
        </body>
      </html>
    `);

    process.exitCode = 0;
    try {
      await engine.runFitGuard(gapHtml, 'dummy_pdf.pdf', true);
      assert.fail("Expected runFitGuard to throw error for large gap");
    } catch (e) {
      assert.strictEqual(process.exitCode, 1, "Exit code should be set to 1 on large gap");
    }

    // 3. Perfect fit check: height between 26.3cm and 27.6cm
    const okHtml = path.resolve(__dirname, 'temp_ok_test.html');
    fs.writeFileSync(okHtml, `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0;">
          <div style="height: 26.8cm; background: green;">Perfect Content</div>
        </body>
      </html>
    `);

    process.exitCode = 0;
    const fitResult = await engine.runFitGuard(okHtml, 'dummy_pdf.pdf', true);
    assert.strictEqual(fitResult.fitOk, true, "Perfect content should fit OK");
    assert.strictEqual(process.exitCode, 0, "Exit code should remain 0");

    // Cleanup generated PDF
    if (fs.existsSync('dummy_pdf.pdf')) fs.unlinkSync('dummy_pdf.pdf');
  } finally {
    process.exitCode = originalExitCode;
  }
});

test('Claims Linter Rejection of fabricated metrics', () => {
  const fabricatedConfig = {
    ...baseConfig,
    EXPERIENCE: [
      {
        ...baseConfig.EXPERIENCE[0],
        bullets: [
          "Drove a **45%** conversion lift which is not in the proof bank.",
          ...baseConfig.EXPERIENCE[0].bullets.slice(1)
        ]
      },
      ...baseConfig.EXPERIENCE.slice(1)
    ]
  };
  assertFail(fabricatedConfig);
});

test('Claims Linter Prefix/Suffix handling', () => {
  // Proof bank defines "Rs 5 Cr+ annualised savings" (row 4)
  // In config, we use "5 Cr+" (missing "Rs" prefix).
  // The normalized token is "5cr+", which should match successfully.
  const prefixConfig = {
    ...baseConfig,
    EXPERIENCE: [
      {
        ...baseConfig.EXPERIENCE[0],
        bullets: [
          "Delivered 70+ enterprise workflows resulting in **5 Cr+** in annualised savings.",
          ...baseConfig.EXPERIENCE[0].bullets.slice(1)
        ]
      },
      ...baseConfig.EXPERIENCE.slice(1)
    ]
  };
  assertPass(prefixConfig);
});

test('File lock fallback resilience', () => {
  const originalWrite = fs.writeFileSync;
  let attemptCount = 0;

  // Intercept write attempts to locked_test.docx and simulate lock error
  fs.writeFileSync = (filePath, data, options) => {
    if (path.basename(filePath) === 'locked_test.docx') {
      attemptCount++;
      const err = new Error('EBUSY: resource busy or locked');
      err.code = 'EBUSY';
      throw err;
    }
    return originalWrite(filePath, data, options);
  };

  try {
    const targetPath = path.resolve(__dirname, 'locked_test.docx');
    const resultPath = engine.saveFileWithLockFallback(targetPath, Buffer.from("test-content"));
    
    assert.strictEqual(attemptCount, 1, "Should attempt to write to target path once and fail");
    assert.strictEqual(resultPath, targetPath.replace('.docx', '_v2.docx'), "Should return fallback v2 path");
    assert.ok(fs.existsSync(resultPath), "Fallback v2 file should exist");
    assert.strictEqual(fs.readFileSync(resultPath, 'utf8'), "test-content", "Fallback content should match");

    // Clean up
    if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
  } finally {
    fs.writeFileSync = originalWrite;
  }
});
