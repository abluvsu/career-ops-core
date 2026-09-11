/**
 * COVER LETTER TEMPLATE — reads config from ./config.json
 * Run: node cover_letter_template.js
 */
const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, ExternalHyperlink, BorderStyle, ShadingType
} = require('docx');
const fs = require('fs');
const engine = require('./engine.js');

// Load and Validate config using the unified engine
const rawConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const C = engine.validateConfig(rawConfig);
const profile = engine.profile;

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
        new ExternalHyperlink({ link: profile.contact.linkedin, children: [new TextRun({ text: profile.contact.linkedinShort || profile.contact.linkedin, style: "Hyperlink", size: 17, font: "Calibri" })] }),
        ...(profile.contact.portfolio ? [
          new TextRun({ text: "  |  ", size: 17, font: "Calibri", color: "444444" }),
          new ExternalHyperlink({ link: profile.contact.portfolio, children: [new TextRun({ text: profile.contact.portfolioShort || profile.contact.portfolio, style: "Hyperlink", size: 17, font: "Calibri" })] })
        ] : [])
      ]}),
      new Paragraph({ spacing: { before: 0, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1A3A5C", space: 1 } }, children: [] }),
      P(C.DATE || "June 2026", 60),
      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: C.RECIPIENT_FULL || "", bold: true, size: 21, font: "Calibri" })] }),
      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: (C.RECIPIENT_TITLE || "") + "  |  " + (C.COMPANY || ""), size: 21, font: "Calibri" })] }),
      new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: "Re: Application for " + (C.ROLE || ""), size: 21, font: "Calibri", italics: true, color: "444444" })] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Dear " + (C.RECIPIENT_NAME || "") + ",", size: 21, font: "Calibri" })] }),
      P(C.PARA_1 || ""), P(C.PARA_2 || ""), P(C.PARA_3 || ""), P(C.PARA_4 || "", 300),
      P("Warm regards,", 60),
      new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: profile.name.full, bold: true, size: 21, font: "Calibri" })] }),
      new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: `${profile.contact.phone}  |  ${profile.contact.email}`, size: 19, font: "Calibri", color: "555555" })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  const finalClPath = engine.saveFileWithLockFallback(C.CL_OUTPUT, buf);
  console.log("CL:", finalClPath);
}).catch(e => { console.error(e); process.exit(1); });
