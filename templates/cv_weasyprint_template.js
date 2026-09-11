'use strict';
/**
 * CV WEASYPRINT TEMPLATE — mirrors cv_extended_html_template.js exactly
 * Pure CSS @page rules, system fonts, no external dependencies.
 * Outputs HTML that WeasyPrint renders to a perfect 2-page PDF.
 */
const path = require('path');
const profile = require(path.resolve(__dirname, '../reference/profile.json'));

module.exports.generateHTML = (C) => {
  const themeColor = C.THEME_COLOR || '#3A3A3A';
  const textColor = '#1A1A1A';
  const grayText = '#555555';
  const lightGray = '#666666';

  const spacedHeader = (text) => text.toUpperCase();

  const parseRich = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  };

  const renderCertifications = () => {
    const certList = C.CERTIFICATIONS || profile.certifications;
    if (!certList) return '';
    return certList.map(cert => {
      if (typeof cert === 'string') {
        return `<li><strong>${parseRich(cert)}</strong></li>`;
      }
      const detail = cert.details ? ` | ${parseRich(cert.details)}` : '';
      return `<li><strong>${parseRich(cert.title || '')}</strong>${detail}</li>`;
    }).join('');
  };

  const renderEducation = () => {
    const eduList = C.EDUCATION || profile.education;
    if (!eduList) return '';
    return eduList.map(edu => `
      <div class="edu-item">
        <div class="edu-header">
          <span><strong class="edu-deg">${edu.degree}</strong> &nbsp;|&nbsp; <span class="edu-inst">${edu.institution}</span></span>
          <span class="edu-date">${edu.year}</span>
        </div>
        ${edu.description ? `<div class="edu-desc">${edu.description}</div>` : ''}
      </div>
    `).join('');
  };

  const renderWhyIFit = () => {
    if (!C.WHY_I_FIT) return '';
    const company = (C.WHY_I_FIT_COMPANY || C.COMPANY || 'THIS COMPANY').toUpperCase();
    return `
    <div class="section">
      <div class="spaced-header">${spacedHeader('WHY I FIT THIS ROLE AT ' + company)}</div>
      <div class="why-body">${parseRich(C.WHY_I_FIT)}</div>
    </div>
    `;
  };

  const renderRolePillars = () => {
    if (!C.ROLE_PILLARS || C.ROLE_PILLARS.length === 0) return '';
    const count = C.ROLE_PILLARS.length;
    return `
    <div class="section">
      <div class="spaced-header">${spacedHeader('AGAINST THE ' + count + ' ROLE PILLARS')}</div>
      <div class="pillar-grid">
        ${C.ROLE_PILLARS.map(p => `
          <div class="pillar-cell">
            <h4>${p.title}</h4>
            <ul>${p.bullets.map(b => `<li>${parseRich(b)}</li>`).join('')}</ul>
          </div>
        `).join('')}
      </div>
    </div>
    `;
  };

  const renderExperience = () => {
    if (!C.EXPERIENCE || C.EXPERIENCE.length === 0) return '';

    let html = `<div class="section"><div class="spaced-header">${spacedHeader('PROFESSIONAL EXPERIENCE')}</div>`;

    for (const exp of C.EXPERIENCE) {
      if (!exp.bullets || exp.bullets.length === 0) continue;
      const rawTitle = exp.title || '';
      const titleText = exp.label && !rawTitle.includes(exp.label) ? `${rawTitle} ${exp.label}` : rawTitle;
      const introText = exp.intro || '';
      html += `
        <div class="experience-item">
          <div class="exp-header">
            <span><strong class="exp-title">${parseRich(titleText)}</strong> &nbsp;|&nbsp; <span class="exp-org">${parseRich(exp.organization || '')}</span></span>
            <span class="exp-date">${parseRich(exp.dates || '')}</span>
          </div>
          ${introText ? `<div class="role-intro">${parseRich(introText)}</div>` : ''}
          <ul>${exp.bullets.map(b => `<li>${parseRich(b)}</li>`).join('')}</ul>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  };

  const renderProjects = () => {
    if (C.PROJECTS && C.PROJECTS.length > 0) {
      let html = `<div class="section">`;
      for (const proj of C.PROJECTS) {
        if (!proj.bullets || proj.bullets.length === 0) continue;
        const rawTitle = proj.title || 'Independent Projects';
        const titleText = proj.label && !rawTitle.includes(proj.label) ? `${rawTitle} ${proj.label}` : rawTitle;
        const introText = proj.intro || '';
        html += `
          <div class="exp-header">
            <span><strong class="exp-title">${parseRich(titleText)}</strong>${proj.organization ? ` &nbsp;|&nbsp; <span class="exp-org">${parseRich(proj.organization)}</span>` : ''}</span>
            ${proj.dates ? `<span class="exp-date">${parseRich(proj.dates)}</span>` : ''}
          </div>
          ${introText ? `<div class="role-intro">${parseRich(introText)}</div>` : ''}
          <ul>${proj.bullets.map(b => `<li>${parseRich(b)}</li>`).join('')}</ul>
        `;
      }
      html += `</div>`;
      return html;
    }
    if (!C.PROJECT_BULLETS || C.PROJECT_BULLETS.length === 0) return '';
    return `
    <div class="section">
      <div class="exp-header">
        <span><strong class="exp-title">${C.PROJECT_TITLE || 'Independent Projects'}</strong>${C.PROJECT_ORG ? ` &nbsp;|&nbsp; <span class="exp-org">${C.PROJECT_ORG}</span>` : ''}</span>
        ${C.PROJECT_DATES ? `<span class="exp-date">${C.PROJECT_DATES}</span>` : ''}
      </div>
      <ul>${C.PROJECT_BULLETS.map(b => `<li>${parseRich(b)}</li>`).join('')}</ul>
    </div>
    `;
  };

  const renderNumbers = () => {
    if (!C.NUMBERS_THAT_MATTER || C.NUMBERS_THAT_MATTER.length === 0) return '';
    return `
    <div class="section">
      <div class="spaced-header">${spacedHeader('NUMBERS THAT MATTER FOR THIS ROLE')}</div>
      ${C.NUMBERS_INTRO ? `<div class="numbers-intro">${parseRich(C.NUMBERS_INTRO)}</div>` : ''}
      <div class="numbers-grid">
        ${C.NUMBERS_THAT_MATTER.map(n => `
          <div class="number-item"><strong>${n.label}:</strong> ${parseRich(n.value)}</div>
        `).join('')}
      </div>
    </div>
    `;
  };

  const renderToolsGrouped = () => {
    if (!C.TOOLS_GROUPED || C.TOOLS_GROUPED.length === 0) return '';
    return `
    <div class="section">
      <div class="spaced-header">${spacedHeader('TOOLS AND TECHNICAL SKILLS')}</div>
      <div class="tools-grouped">
        ${C.TOOLS_GROUPED.map(g => `
          <div class="tool-row"><strong>${g.category}:</strong> ${g.items}</div>
        `).join('')}
      </div>
    </div>
    `;
  };

  const renderCertificationsSection = () => {
    const certList = C.CERTIFICATIONS || profile.certifications;
    if (!certList || certList.length === 0) return '';
    return `
    <div class="section">
      <div class="spaced-header">${spacedHeader('CERTIFICATIONS')}</div>
      <ul class="cert-list">
        ${renderCertifications()}
      </ul>
    </div>
    `;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 0.5cm 0.8cm 0.5cm 0.8cm;
    }

    * { box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', Calibri, 'DejaVu Sans', Arial, sans-serif;
      color: ${textColor};
      margin: 0;
      padding: 0;
      font-size: 8.5pt;
      line-height: 1.3;
      widows: 1;
      orphans: 1;
    }

    strong { font-weight: 700; }

    a { color: ${themeColor}; text-decoration: underline; }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 4px;
    }
    .section { margin-bottom: ${C.SECTION_MARGIN || 6}px; }
    .name {
      font-size: 1.6em;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .tagline {
      color: ${themeColor};
      font-size: 1.0em;
      margin: 2px 0 4px 0;
    }
    .contact {
      font-size: 0.82em;
      color: ${grayText};
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: nowrap;
      white-space: nowrap;
    }

    /* Spaced Headers */
    .spaced-header {
      font-size: 9.5pt;
      font-weight: 700;
      color: ${themeColor};
      border-bottom: 1.5px solid ${themeColor};
      padding-bottom: 1px;
      margin-top: 6px;
      margin-bottom: 4px;
    }

    .why-body {
      font-size: 8.5pt;
      margin-bottom: 4px;
      line-height: 1.3;
    }

    /* Pillar Grid */
    .pillar-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 4px;
      margin-bottom: 4px;
    }
    .pillar-cell {
      padding: 4px 5px;
      background: #F0F0F0;
      border-radius: 3px;
    }
    .pillar-cell h4 {
      color: ${themeColor};
      margin: 0 0 3px 0;
      font-size: 9pt;
    }
    .pillar-cell ul { margin: 0; padding-left: 12px; font-size: 8.2pt; line-height: 1.25; }
    .pillar-cell li { margin-bottom: 1px; }

    /* Experience */
    .experience-item { margin-bottom: 6px; }
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }
    .exp-title { font-size: 1.0em; font-weight: 700; color: ${textColor}; }
    .exp-org { font-size: 0.95em; font-weight: 700; color: ${themeColor}; }
    .exp-date { font-size: 0.9em; font-style: italic; color: ${grayText}; }
    .role-intro { font-style: italic; font-size: 8.5pt; color: ${grayText}; margin-bottom: 2px; }

    ul { margin: 0; padding-left: 16px; }
    li { margin-bottom: 2px; }
    li a, .why-body a { color: ${themeColor}; text-decoration: underline; }

    /* Education */
    .edu-item { margin-bottom: 4px; }
    .edu-header { display: flex; justify-content: space-between; align-items: baseline; }
    .edu-deg { font-size: 0.95em; font-weight: 700; }
    .edu-inst { font-size: 0.95em; }
    .edu-date { font-size: 0.85em; font-style: italic; color: ${grayText}; }
    .edu-desc { font-size: 0.85em; font-style: italic; color: ${grayText}; margin-top: 1px; }

    /* Numbers Grid */
    .numbers-intro { font-size: 8.5pt; margin-bottom: 4px; }
    .numbers-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 12px;
      margin-bottom: 6px;
    }
    .number-item { font-size: 8.5pt; }
    .number-item strong { color: ${themeColor}; }

    /* Tools */
    .tools-grouped { margin-bottom: 6px; }
    .tool-row { font-size: 8.5pt; margin-bottom: 2px; }

    /* Certifications */
    .cert-list { margin: 0; padding-left: 16px; }
    .cert-list li { font-size: 8.5pt; margin-bottom: 2px; }

    hr.divider {
      border: none;
      border-top: 1.5px solid #2C2C2C;
      margin: 4px 0 6px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="name"><span style="font-weight:300;">${profile.name.first.toUpperCase()}</span> <span style="font-weight:700; color:${themeColor};">${profile.name.last.toUpperCase()}</span></h1>
    <div class="tagline">${C.TAGLINE}</div>
    <div class="contact">
      <span>${profile.contact.phone}</span>
      <span>${profile.contact.email}</span>
      <span>${profile.contact.linkedinShort}</span>
      <span>${C.LOCATION || profile.contact.defaultLocation}</span>
    </div>
    <hr class="divider">
  </div>

  ${renderWhyIFit()}
  ${renderRolePillars()}
  ${renderExperience()}
  ${renderProjects()}

  <div class="section">
    <div class="spaced-header">${spacedHeader('EDUCATION')}</div>
    ${renderEducation()}
  </div>

  ${renderNumbers()}
  ${renderToolsGrouped()}
  ${renderCertificationsSection()}
</body>
</html>
  `;
};
