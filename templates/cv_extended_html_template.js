'use strict';
/**
 * CV EXTENDED HTML TEMPLATE — for Puppeteer PDF generation
 * Anti-blank-space rules enforced globally:
 *  - NO page-break-inside: avoid (removed — it was the root cause of blank voids)
 *  - widows: 1; orphans: 1 → prevents single-line pulls to next page
 *  - Tight section/grid gaps
 */
let defaultProfile = {
  name: { first: '', last: '', full: '' },
  contact: { phone: '', email: '', linkedin: '', linkedinShort: '', portfolio: '', portfolioShort: '', defaultLocation: '' },
  education: [],
  certifications: []
};
try {
  defaultProfile = require(path.resolve(__dirname, '../reference/profile.json'));
} catch (e) {}

module.exports.generateHTML = (C, profileOverride = null) => {
  const profile = profileOverride || C.PROFILE || defaultProfile;
  const themeColor = C.THEME_COLOR || '#3A3A3A';

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
            <span><strong class="exp-title">${parseRich(titleText)}</strong>${exp.organization ? ` &nbsp;|&nbsp; <span class="exp-org">${parseRich(exp.organization)}</span>` : ''}</span>
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
        ${C.NUMBERS_THAT_MATTER.map(n => {
          if (typeof n === 'string') {
            return `<div class="number-item">${parseRich(n)}</div>`;
          }
          const label = n.label ? `<strong>${parseRich(n.label)}:</strong> ` : '';
          return `<div class="number-item">${label}${parseRich(n.value || '')}</div>`;
        }).join('')}
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
        ${C.TOOLS_GROUPED.map(g => {
          const items = g.items || g.tools || '';
          return `<div class="tool-row"><strong>${parseRich(g.category || '')}:</strong> ${parseRich(items)}</div>`;
        }).join('')}
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
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&family=Source+Sans+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --theme-color: ${themeColor};
      --text-color: #1A1A1A;
      --gray-text: #555555;
      --light-gray: #666666;
    }

    @page {
      size: A4;
      margin: 1.0cm 1.2cm 1.0cm 1.2cm;
    }

    body {
      font-family: 'Source Sans Pro', sans-serif;
      color: var(--text-color);
      margin: 0;
      padding: 0;
      font-size: 9.5pt;
      line-height: 1.5;
      /* CRITICAL: prevents PDF engine from pulling orphan/widow lines to next page */
      widows: 1;
      orphans: 1;
    }

    strong { font-weight: 700; }

    /* NO page-break-inside: avoid — that was the root cause of blank voids on page 1 */

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .section { margin-bottom: 25px; }
    .name {
      font-family: 'Roboto', sans-serif;
      font-size: 1.8em;
      margin: 0;
      letter-spacing: 0.6px;
    }
    .tagline {
      color: var(--theme-color);
      font-size: 1.1em;
      margin: 4px 0 8px 0;
      font-family: 'Roboto', sans-serif;
    }
    .contact {
      font-size: 0.9em;
      color: var(--gray-text);
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: nowrap;
      white-space: nowrap;
    }
    .contact-item i { margin-right: 4px; color: var(--theme-color); }
    .contact-item a { color: var(--gray-text); text-decoration: none; }

    /* Spaced Headers */
    .spaced-header {
      font-family: 'Roboto', sans-serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: var(--theme-color);
      border-bottom: 2px solid var(--theme-color);
      padding-bottom: 3px;
      margin-top: 14px;
      margin-bottom: 8px;
    }

    .why-body {
      font-size: 9.5pt;
      margin-bottom: 10px;
      line-height: 1.5;
    }

    /* Pillar Grid — gap reduced to minimize empty space */
    .pillar-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .pillar-cell {
      padding: 6px 8px;
      background: #F0F0F0;
      border-radius: 3px;
    }
    .pillar-cell h4 {
      color: var(--theme-color);
      margin: 0 0 4px 0;
      font-size: 9.5pt;
    }
    .pillar-cell ul { margin: 0; padding-left: 13px; font-size: 9pt; line-height: 1.4; }
    .pillar-cell li { margin-bottom: 2px; }

    /* Experience */
    .experience-item { margin-bottom: 10px; }
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3px;
    }
    .exp-title { font-size: 1.05em; font-weight: 700; color: var(--text-color); }
    .exp-org { font-size: 1.0em; font-weight: 700; color: var(--theme-color); }
    .exp-date { font-size: 0.95em; font-style: italic; color: var(--gray-text); }
    .role-intro { font-style: italic; font-size: 9.5pt; color: var(--gray-text); margin-bottom: 4px; }

    ul { margin: 0; padding-left: 18px; }
    li { margin-bottom: 4px; }
    li a, .why-body a { color: var(--theme-color); text-decoration: underline; }

    /* Education */
    .edu-item { margin-bottom: 8px; }
    .edu-header { display: flex; justify-content: space-between; align-items: baseline; }
    .edu-deg { font-size: 1.0em; font-weight: 700; }
    .edu-inst { font-size: 1.0em; }
    .edu-date { font-size: 0.9em; font-style: italic; color: var(--gray-text); }
    .edu-desc { font-size: 0.9em; font-style: italic; color: var(--gray-text); margin-top: 2px; }

    /* Numbers Grid */
    .numbers-intro { font-size: 9.5pt; margin-bottom: 6px; }
    .numbers-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      margin-bottom: 10px;
    }
    .number-item { font-size: 9.5pt; }
    .number-item strong { color: var(--theme-color); }

    /* Tools */
    .tools-grouped { margin-bottom: 10px; }
    .tool-row { font-size: 9.5pt; margin-bottom: 3px; }

    /* Certifications */
    .cert-list { margin: 0; padding-left: 18px; }
    .cert-list li { font-size: 9.5pt; margin-bottom: 3px; }

    hr.divider {
      border: none;
      border-top: 1.5px solid #2C2C2C;
      margin: 6px 0 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="name"><span style="font-weight:300;">${profile.name.first.toUpperCase()}</span> <span style="font-weight:700; color:var(--theme-color);">${profile.name.last.toUpperCase()}</span></h1>
    <div class="tagline">${C.TAGLINE}</div>
    <div class="contact">
      ${profile.contact.phone ? `<span class="contact-item"><i class="fas fa-phone"></i>${profile.contact.phone}</span>` : ''}
      ${profile.contact.email ? `<span class="contact-item"><i class="fas fa-envelope"></i>${profile.contact.email}</span>` : ''}
      ${(profile.contact.linkedinShort || profile.contact.linkedin) ? `<span class="contact-item"><i class="fab fa-linkedin"></i><a href="${profile.contact.linkedin || '#'}">${profile.contact.linkedinShort || profile.contact.linkedin}</a></span>` : ''}
      ${(profile.contact.portfolioShort || profile.contact.portfolio) ? `<span class="contact-item"><i class="fas fa-globe"></i><a href="${profile.contact.portfolio || '#'}">${profile.contact.portfolioShort || profile.contact.portfolio}</a></span>` : ''}
      ${(C.LOCATION || profile.contact.defaultLocation) ? `<span class="contact-item"><i class="fas fa-map-marker-alt"></i>${C.LOCATION || profile.contact.defaultLocation}</span>` : ''}
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
