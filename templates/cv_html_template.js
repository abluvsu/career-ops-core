/**
 * cv_html_template.js — Standard 1-page HTML template
 * Exports: generateHTML(C) → HTML string for Puppeteer PDF rendering
 *
 * Restored: feat(phase3) emptied this file; this restores the standard layout
 * that cv_template.js depends on for the Fit-Guard + PDF pipeline.
 *
 * Visual design matches the Dow ISC local template (cv_template_dow.js style):
 * blue shaded section headers, Calibri font, compact 1-page A4 layout.
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Load profile for static contact data
let profile;
try {
  profile = require(path.resolve(__dirname, '../reference/profile.json'));
} catch (e) {
  profile = {
    name: { first: '', last: '', full: '' },
    contact: {
      phone: '',
      email: '',
      linkedin: '',
      linkedinShort: '',
      portfolio: '',
      portfolioShort: '',
      defaultLocation: ''
    },
    education: [],
    certifications: []
  };
}

/**
 * Converts markdown bold **text** and [label](url) links to HTML spans/anchors.
 * @param {string} text
 * @returns {string} HTML string
 */
function parseRichHtml(text) {
  if (!text) return '';
  // Escape HTML first (except for our own markup)
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Replace [label](url) links
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#4A4A4A;">$1</a>');

  // Replace **bold** markers
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  return escaped;
}

/**
 * Renders a competency row (array of 3 strings) as a 3-column table row.
 */
function renderCompetencyRows(competencies) {
  return competencies.map(row => {
    const cells = row.map(cell => `
      <td style="width:33.3%;padding:4px 8px 4px 0;vertical-align:top;">
        <span style="color:#4A4A4A;font-weight:bold;font-size:10pt;">•&nbsp;&nbsp;</span>
        <span style="font-size:10pt;color:#1A1A1A;">${parseRichHtml(cell)}</span>
      </td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
}

/**
 * Renders bullet list items.
 */
function renderBullets(bullets) {
  if (!bullets || bullets.length === 0) return '';
  return bullets.map(b => `
    <li class="cv-bullet">${parseRichHtml(b)}</li>`).join('');
}

/**
 * Renders education entries.
 */
function renderEducation(eduList) {
  return eduList.map(edu => `
    <div class="edu-item" style="margin-bottom:5px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-weight:bold;font-size:10.5pt;color:#1A1A1A;">${parseRichHtml(edu.degree)}</span>
        <span style="font-size:9.5pt;font-style:italic;color:#555;">&nbsp;&nbsp;${parseRichHtml(edu.year)}</span>
      </div>
      <div style="font-size:10pt;margin-bottom:1px;color:#4A4A4A;">${parseRichHtml(edu.institution)}</div>
      <div style="font-size:9.5pt;font-style:italic;color:#555;">${parseRichHtml(edu.description)}</div>
    </div>`).join('');
}

/**
 * Renders certification items.
 */
function renderCertifications(certList) {
  if (!certList) return '';
  return certList.map(cert => {
    if (typeof cert === 'string') {
      return `
    <div class="cert-list" style="margin-bottom:4px;">
      <span style="font-weight:bold;font-size:9.5pt;">${parseRichHtml(cert)}</span>
    </div>`;
    }
    return `
    <div class="cert-list" style="margin-bottom:${cert.spacingAfter === 0 ? '0' : '4'}px;">
      <span style="font-weight:bold;font-size:9.5pt;">${parseRichHtml(cert.title || '')}</span>
      ${cert.details ? `<span style="font-size:9.5pt;color:#444;">  |  ${parseRichHtml(cert.details)}</span>` : ''}
    </div>`;
  }).join('');
}

/**
 * Main function: generates the full HTML string for the standard 1-page CV.
 * @param {object} C - Validated config object from engine.validateConfig()
 * @returns {string} Complete HTML document
 */
function generateHTML(C) {
  if (C.FORMAT_TYPE === 'extended') {
    return require('./cv_extended_html_template.js').generateHTML(C);
  }

  const themeColor = C.THEME_COLOR || '#3A3A3A';
  const themeHex = themeColor.replace('#', '');
  const mid = '4A4A4A';
  const dark = '2C2C2C';
  const softBg = 'F0F0F0';
  const text = '1A1A1A';
  const muted = '555555';
  const location = C.LOCATION || profile.contact.defaultLocation;

  const hasProjects = (C.PROJECTS && C.PROJECTS.length > 0) || (C.PROJECT_BULLETS && C.PROJECT_BULLETS.length > 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${profile.name.full} — CV</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Calibri:wght@400;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
    font-size: 10.5pt;
    color: #${text};
    background: #fff;
    width: 210mm;
    max-width: 210mm;
    padding: 14mm 16mm 13mm 16mm;
    line-height: 1.45;
    overflow: hidden;
    max-height: 297mm;
    -webkit-font-smoothing: antialiased;
  }

  .name-block {
    text-align: center;
    margin-bottom: 4px;
  }

  .name-block h1 {
    font-size: 20pt;
    font-weight: bold;
    letter-spacing: 0.4px;
    color: #${text};
    margin-bottom: 3px;
  }

  .tagline {
    text-align: center;
    font-size: 10pt;
    color: #${themeHex};
    margin-bottom: 5px;
    font-weight: 600;
  }

  .contact-bar {
    text-align: center;
    font-size: 9.5pt;
    color: #${muted};
    margin-bottom: 7px;
  }

  .contact-bar a {
    color: #${mid};
    text-decoration: none;
  }

  .divider {
    border: none;
    border-top: 2px solid #${dark};
    margin-bottom: 0;
  }

  .section-header {
    font-size: 11pt;
    font-weight: bold;
    color: #${dark};
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 4px 6px;
    background-color: #${softBg};
    border-bottom: 1.5px solid #${themeHex};
    margin-top: 8px;
    margin-bottom: 5px;
  }

  .summary {
    font-size: 10.5pt;
    margin-bottom: 3px;
    line-height: 1.5;
    color: #${text};
  }

  .competency-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4px;
  }

  .tools-line {
    font-size: 10pt;
    margin-top: 3px;
    margin-bottom: 0;
    color: #${text};
  }

  .role-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 7px;
    margin-bottom: 4px;
  }

  .role-left {
    font-size: 10.5pt;
    color: #${text};
  }

  .role-dates {
    font-size: 9.5pt;
    font-style: italic;
    color: #${muted};
    white-space: nowrap;
  }

  ul.cv-bullets {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }

  li.cv-bullet {
    font-size: 10.5pt;
    padding-left: 18px;
    text-indent: -10px;
    margin-bottom: 4px;
    line-height: 1.45;
    color: #${text};
  }

  li.cv-bullet::before {
    content: "• ";
    color: #${mid};
    font-weight: bold;
    margin-right: 2px;
  }
</style>
</head>
<body>

  <!-- NAME -->
  <div class="name-block">
    <h1>${profile.name.first.toUpperCase()} <strong>${profile.name.last.toUpperCase()}</strong></h1>
  </div>

  <!-- TAGLINE -->
  <div class="tagline">${parseRichHtml(C.TAGLINE)}</div>

  <!-- CONTACT BAR -->
  <div class="contact-bar">
    ${[
      profile.contact.phone,
      profile.contact.email,
      (profile.contact.linkedin ? `<a href="${profile.contact.linkedin}">${profile.contact.linkedinShort || profile.contact.linkedin}</a>` : ''),
      (profile.contact.portfolio ? `<a href="${profile.contact.portfolio}">${profile.contact.portfolioShort || profile.contact.portfolio}</a>` : ''),
      (location ? parseRichHtml(location) : '')
    ].filter(Boolean).join('&nbsp;&nbsp;|&nbsp;&nbsp;')}
  </div>

  <hr class="divider">

  <!-- PROFESSIONAL SUMMARY -->
  <div class="section-header">Professional Summary</div>
  <div class="summary">${parseRichHtml(C.SUMMARY)}</div>

  <!-- CORE COMPETENCIES -->
  <div class="section-header">Core Competencies</div>
  <table class="competency-table">
    <tbody>
      ${renderCompetencyRows(C.COMPETENCIES)}
    </tbody>
  </table>
  <div class="tools-line"><strong>Tools:&nbsp;&nbsp;</strong>${parseRichHtml(C.TOOLS || '')}</div>

  <!-- PROFESSIONAL EXPERIENCE -->
  ${(C.EXPERIENCE && C.EXPERIENCE.length > 0) ? `
  <div class="section-header">Professional Experience</div>
  ${C.EXPERIENCE.map((exp, idx) => {
    if (!exp.bullets || exp.bullets.length === 0) return '';
    const rawTitle = exp.title || '';
    const titleText = exp.label && !rawTitle.includes(exp.label) ? `${rawTitle} ${exp.label}` : rawTitle;
    const introText = exp.intro || '';
    return `
  <div class="role-header"${idx > 0 ? ' style="margin-top:4px;"' : ''}>
    <span class="role-left">
      <strong>${parseRichHtml(titleText)}</strong>
      ${exp.organization ? `<span style="color:#888;">&nbsp;&nbsp;—&nbsp;&nbsp;</span><strong style="color:#4A4A4A;">${parseRichHtml(exp.organization)}</strong>` : ''}
    </span>
    <span class="role-dates">${parseRichHtml(exp.dates || '')}</span>
  </div>
  ${introText ? `<div style="font-style:italic; font-size:9pt; margin-bottom:2px;">${parseRichHtml(introText)}</div>` : ''}
  <ul class="cv-bullets">
    ${renderBullets(exp.bullets)}
  </ul>`;
  }).join('')}
  ` : ''}

  ${hasProjects ? `
  <!-- INDEPENDENT PROJECTS -->
  <div class="section-header">Independent Projects &amp; Entrepreneurship</div>
  ${C.PROJECTS && C.PROJECTS.length > 0 ? C.PROJECTS.map(proj => {
    if (!proj.bullets || proj.bullets.length === 0) return '';
    const rawTitle = proj.title || 'Independent Projects';
    const titleText = proj.label && !rawTitle.includes(proj.label) ? `${rawTitle} ${proj.label}` : rawTitle;
    const introText = proj.intro || '';
    return `
  <div class="role-header" style="margin-top:4px;">
    <span class="role-left">
      <strong>${parseRichHtml(titleText)}</strong>
      ${proj.organization ? `<span style="color:#888;">&nbsp;&nbsp;—&nbsp;&nbsp;</span><strong style="color:#4A4A4A;">${parseRichHtml(proj.organization)}</strong>` : ''}
    </span>
    ${proj.dates ? `<span class="role-dates">${parseRichHtml(proj.dates)}</span>` : ''}
  </div>
  ${introText ? `<div style="font-style:italic; font-size:9pt; margin-bottom:2px;">${parseRichHtml(introText)}</div>` : ''}
  <ul class="cv-bullets">
    ${renderBullets(proj.bullets)}
  </ul>`;
  }).join('') : `
  <ul class="cv-bullets">
    ${renderBullets(C.PROJECT_BULLETS)}
  </ul>`}
  ` : ''}

  <!-- EDUCATION -->
  <div class="section-header">Education</div>
  ${renderEducation(C.EDUCATION || profile.education)}

  <!-- CERTIFICATIONS -->
  <div class="section-header">Certifications &amp; Training</div>
  ${renderCertifications(C.CERTIFICATIONS || profile.certifications)}

</body>
</html>`;
}

module.exports = { generateHTML };
