'use strict';
/**
 * UNIFIED COVER LETTER BUILDER â€” Generates both .docx and .pdf
 *
 * Usage:
 *   node ../../templates/build_cl.js
 *   (Executes in outputs/<role_slug> using local config.json)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, ExternalHyperlink, BorderStyle, ShadingType
} = require('docx');

const templatesDir = __dirname;
const engine = require(path.join(templatesDir, 'engine.js'));
const profile = engine.profile;

// 1. Read config.json
if (!fs.existsSync('./config.json')) {
  console.error('ERROR: config.json not found in current directory.');
  process.exit(1);
}

const rawConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const C = engine.validateConfig(rawConfig);

const candidateSlug = (profile && profile.name && profile.name.full ? profile.name.full.replace(/\s+/g, '_') : 'Candidate');
const clDocxName = C.CL_OUTPUT || `${candidateSlug}_CoverLetter_${(C.COMPANY || 'Company').replace(/\s+/g, '_')}.docx`;
const clPdfName = clDocxName.replace(/\.docx$/, '.pdf');

// 2. Build DOCX Cover Letter
const P = (t, a = 180) => new Paragraph({ spacing: { after: a }, children: [new TextRun({ text: t, size: 21, font: "Calibri" })] });

const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0 },
        shading: { type: ShadingType.CLEAR, fill: "EDF2F8" },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2C5F8A", space: 2 } },
        children: [
          new TextRun({ text: "  EMAIL SUBJECT:  ", bold: true, size: 17, font: "Calibri", color: "1A3A5C", allCaps: true }),
          new TextRun({ text: C.EMAIL_SUBJECT || "", size: 17, font: "Calibri", color: "1A3A5C" }),
          new TextRun({ text: "  ", size: 17 })
        ]
      }),
      new Paragraph({ spacing: { before: 0, after: 220 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 10 }, children: [new TextRun({ text: profile.name.full.toUpperCase(), bold: true, size: 40, font: "Calibri", color: "111111" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 22 }, children: [
        new TextRun({ text: `${profile.contact.phone}  |  ${profile.contact.email}  |  `, size: 17, font: "Calibri", color: "444444" }),
        new ExternalHyperlink({ link: profile.contact.linkedin, children: [new TextRun({ text: profile.contact.linkedinShort, style: "Hyperlink", size: 17, font: "Calibri" })] }),
        new TextRun({ text: "  |  ", size: 17, font: "Calibri", color: "444444" }),
        new ExternalHyperlink({ link: profile.contact.portfolio, children: [new TextRun({ text: profile.contact.portfolioShort, style: "Hyperlink", size: 17, font: "Calibri" })] }),
      ]}),
      new Paragraph({ spacing: { before: 0, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1A3A5C", space: 1 } }, children: [] }),
      P(C.DATE || "June 2026", 60),
      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: C.RECIPIENT_FULL || "", bold: true, size: 21, font: "Calibri" })] }),
      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: (C.RECIPIENT_TITLE || "") + "  |  " + (C.COMPANY || ""), size: 21, font: "Calibri" })] }),
      new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: "Re: Application for " + (C.ROLE || ""), size: 21, font: "Calibri", italics: true, color: "444444" })] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Dear " + (C.RECIPIENT_NAME || "Hiring Team") + ",", size: 21, font: "Calibri" })] }),
      P(C.PARA_1 || ""), P(C.PARA_2 || ""), P(C.PARA_3 || ""), P(C.PARA_4 || "", 300),
      P("Warm regards,", 60),
      new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: profile.name.full, bold: true, size: 21, font: "Calibri" })] }),
      new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: `${profile.contact.phone}  |  ${profile.contact.email}`, size: 19, font: "Calibri", color: "555555" })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  const finalClPath = engine.saveFileWithLockFallback(clDocxName, buf);
  console.log("[OK] Generated Cover Letter DOCX:", finalClPath);
}).catch(e => {
  console.error("Error generating DOCX:", e);
});

// 3. Build HTML & WeasyPrint PDF Cover Letter
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4;
    margin: 18mm 18mm 18mm 18mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Calibri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.42;
    color: #222222;
    background: #FFFFFF;
  }
  .subject-bar {
    background-color: #EDF2F8;
    border-bottom: 2px solid #2C5F8A;
    padding: 6px 12px;
    font-size: 8.5pt;
    margin-bottom: 16px;
  }
  .subject-bar strong {
    color: #1A3A5C;
    letter-spacing: 0.5px;
  }
  .header {
    text-align: center;
    margin-bottom: 14px;
  }
  .header h1 {
    font-size: 20pt;
    font-weight: 700;
    color: #111111;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .contact-line {
    font-size: 9pt;
    color: #555555;
  }
  .contact-line a {
    color: #2C5F8A;
    text-decoration: none;
  }
  .divider {
    border-bottom: 1.5px solid #1A3A5C;
    margin: 12px 0 16px 0;
  }
  .meta-block {
    margin-bottom: 16px;
    font-size: 10pt;
    line-height: 1.35;
  }
  .meta-date { margin-bottom: 8px; color: #444; }
  .recipient-name { font-weight: 700; color: #111; }
  .recipient-title { color: #333; margin-bottom: 8px; }
  .re-line { font-style: italic; color: #444444; font-weight: 600; }
  .salutation { margin: 16px 0 12px 0; font-weight: 600; }
  p {
    margin-bottom: 12px;
    text-align: justify;
  }
  .sign-off {
    margin-top: 18px;
  }
  .sign-off-name {
    font-weight: 700;
    color: #111;
    margin-top: 4px;
  }
  .sign-off-contact {
    font-size: 9pt;
    color: #666666;
    margin-top: 2px;
  }
</style>
</head>
<body>

<div class="subject-bar">
  <strong>EMAIL SUBJECT:</strong> ${C.EMAIL_SUBJECT || ''}
</div>

<div class="header">
  <h1>${profile.name.full.toUpperCase()}</h1>
  <div class="contact-line">
    ${profile.contact.phone} &nbsp;|&nbsp; ${profile.contact.email} &nbsp;|&nbsp; 
    <a href="${profile.contact.linkedin}">${profile.contact.linkedinShort}</a> &nbsp;|&nbsp; 
    <a href="${profile.contact.portfolio}">${profile.contact.portfolioShort}</a>
  </div>
</div>

<div class="divider"></div>

<div class="meta-block">
  <div class="meta-date">${C.DATE || 'August 2026'}</div>
  <div class="recipient-name">${C.RECIPIENT_FULL || 'Founding Team'}</div>
  <div class="recipient-title">${C.RECIPIENT_TITLE || ''} | ${C.COMPANY || ''}</div>
  <div class="re-line">Re: Application for ${C.ROLE || ''}</div>
</div>

<div class="salutation">Dear ${C.RECIPIENT_NAME || 'Hiring Team'},</div>

<p>${C.PARA_1 || ''}</p>
<p>${C.PARA_2 || ''}</p>
<p>${C.PARA_3 || ''}</p>
<p>${C.PARA_4 || ''}</p>

<div class="sign-off">
  <div>Warm regards,</div>
  <div class="sign-off-name">${profile.name.full}</div>
  <div class="sign-off-contact">${profile.contact.phone} | ${profile.contact.email}</div>
</div>

</body>
</html>`;

const tmpHtmlPath = path.join(process.cwd(), 'cl_temp.html');
const tmpPdfPath = path.join(process.cwd(), clPdfName);
fs.writeFileSync(tmpHtmlPath, htmlContent, 'utf8');

const msysBin = process.env.MSYS_BIN || path.join(process.env.SystemDrive || 'C:', 'msys64', 'mingw64', 'bin');
const venvBin = process.env.VENV_BIN || path.resolve(templatesDir, '..', '.venv', 'Scripts');
const pythonBin = process.env.PYTHON_BIN || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Python', 'bin') : '');
const wpEnv = Object.assign({}, process.env, {
  WEASYPRINT_DLL_DIRECTORIES: msysBin,
  PATH: `${pythonBin};${venvBin};${process.env.PATH}`
});

try {
  const weasyCmd = `python -m weasyprint "${tmpHtmlPath}" "${tmpPdfPath}"`;
  execSync(weasyCmd, { env: wpEnv, stdio: 'pipe' });
  console.log("[OK] Generated Cover Letter PDF:", clPdfName);
  try { fs.unlinkSync(tmpHtmlPath); } catch (e) {}
} catch (e) {
  console.error("Warning: WeasyPrint Cover Letter PDF compilation failed:", e.message);
}

