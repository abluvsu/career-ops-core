# Career Ops Core 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-10%2F10%20Pass-brightgreen.svg)](templates/engine.test.js)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**An open-source, privacy-first career automation system and publication-grade 2-page CV compiler driven by autonomous AI agents.**

Career Ops transforms how candidates create, optimize, and build job applications. Instead of manual editing or generic templates, Career Ops compiles mathematically constrained, publication-grade PDFs guaranteed to fit **exactly 2 pages**, pass rigorous ATS quality checks, and prevent metric hallucinations using a canonical proof bank.

---

## 🌟 Why Career Ops?

- **Deterministic 2-Page Fit Guard**: Prevents overflow onto Page 3. Automatically balances typography, line budgets, and vertical spacing using WeasyPrint / Puppeteer.
- **Widow & Orphan Elimination**: Strict character budgeting (95–115 or 180–230 characters per bullet) guarantees that lines never trail into awkward single-word wraps (>35% blank line space).
- **Zero Hallucination Claims Linter**: Deterministic token verification matches every number, percentage, and metric on your CV against your verified `proof-bank.md`.
- **Dual-Layer Pluggable QC**: 15 universal core checks (formatting, geometry, typography) + candidate-specific rules (banned tools, mandatory metrics).
- **Privacy-First Architecture**: Keep your private personal data in your own private repository while leveraging the open-source core via Git Submodule.

---

## 🏗️ Dual-Repository Architecture

```
┌─────────────────────────────────────────────────────────┐
│         OPEN-SOURCE CORE (career-ops-core)              │
│  - Generic Zod schemas (EXPERIENCE[], PROJECTS[])       │
│  - Template compilation & WeasyPrint / Puppeteer engine │
│  - 26 Generic AI agent skills                           │
│  - Universal Quality Control (15 Core QC checks)        │
│  - Reusable templates & setup scripts                   │
└────────────────────────────┬────────────────────────────┘
                             │ git submodule add ../career-ops-core core
                             ▼
┌─────────────────────────────────────────────────────────┐
│     YOUR PRIVATE DATA REPO (career-ops-<your-name>)     │
│  - core/ (Git Submodule pointing to career-ops-core)   │
│  - reference/                                           │
│    ├── profile.json        (Your biographical data)     │
│    ├── bullet-library.json (Your archetype bullets)     │
│    ├── proof-bank.md       (Your verified achievements) │
│    └── qc-rules.json       (Your custom QC rules)       │
│  - AGENTS.md               (Agent rules & constraints)  │
│  - SPEC.md                 (Target roles specification) │
│  - outputs/<role_slug>/    (Generated 2-page PDF CVs)   │
└─────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Zero Data Leakage**: Your private contact details, employer records, compensation targets, and verified achievements never touch the public core.

---

## ⚡ Quickstart: Build Your Own CV in 5 Minutes

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [Python](https://www.python.org/) 3.10+ with WeasyPrint (`pip install weasyprint`) or Chrome/Puppeteer

### Step 1: Fork & Create Your Private Career Repo

```bash
# 1. Create your private data directory
mkdir career-ops-myname
cd career-ops-myname
git init

# 2. Add career-ops-core as a submodule
git submodule add https://github.com/abluvsu/career-ops-core.git core
git submodule update --init --recursive
```

### Step 2: Scaffold Your Configuration

Using the automated setup script:
```powershell
# On Windows:
.\core\scripts\setup.ps1 -CandidateName "Alex Morgan"
```

Or copy the starter templates manually:
```bash
mkdir reference outputs
cp core/reference-templates/AGENTS.template.md AGENTS.md
cp core/reference-templates/SPEC.template.md SPEC.md
cp core/reference-templates/profile.template.json reference/profile.json
cp core/reference-templates/bullet-library.template.json reference/bullet-library.json
cp core/reference-templates/proof-bank.template.md reference/proof-bank.md
cp core/reference-templates/qc-rules.template.json reference/qc-rules.json
```

### Step 3: Fill Your Reference Data
- `reference/profile.json`: Name, contact info, LinkedIn, education, skills.
- `reference/proof-bank.md`: Your verified metrics (e.g. `Rs 5 Cr`, `100+`, `45%`).
- `reference/bullet-library.json`: Your frozen career bullets grouped by archetype.

### Step 4: Build Your 2-Page CV

```bash
# Navigate to your role output folder
cd outputs/<role_slug>

# Run the build engine
node ../../core/templates/build.js --in partial_config.json --archetype "Strategist" --data-root ../..
```

The engine will:
1. Merge your role-specific overrides (25%) with your frozen archetype library (75%).
2. Validate against Zod schemas and the Claims Linter.
3. Run 100-pass dynamic spacing and visual fit iteration.
4. Render the PDF via WeasyPrint.
5. Execute all 26 QC assertions and report the final score (`26/26 PASS`).

---

## 🛡️ The 26 Automated Quality Checks

Every build must pass 15 Universal Core Checks and 11 User-Configurable Checks:

### Core QC Checks (`templates/qc_core_checks.js`):
- `QC1`: **Two-Page Budget Gate** — Exactly 2 physical pages.
- `QC2`: **File Size & Integrity** — PDF file size > 10KB.
- `QC3`: **Primary Role Density** — Minimum 4 bullets for anchor experience.
- `QC4`: **WHY_I_FIT Depth** — Strategic fit statement > 200 characters.
- `QC5`: **Role Pillars Count** — Exactly 6 functional pillars.
- `QC6`: **Numbers That Matter** — Minimum 2 quantitative metric highlights.
- `QC7`: **Section Integrity** — All 7 standard CV sections rendered.
- `QC8`: **Bold Marker Density** — Minimum 40 bold tags for ATS skimming.
- `QC9`: **Content Density** — Minimum 4,000 characters of high-signal prose.
- `QC10`: **Hyphen Ban** — Zero ASCII hyphens (`-`) or em-dashes (`—`) in dynamic content.
- `QC11`: **Date En-Dash Standard** — Unicode en-dash (`–`) strictly enforced for date ranges.
- `QC12`: **Non-Fulltime Disclosures** — Advisory, part-time, or independent ventures clearly labeled.
- `QC13`: **Widow Line Prevention** — Bullets adhere to 95–115 or 180–230 character budgets.
- `QC14`: **Tools Breadth** — Minimum 8 tools declared.
- `QC15`: **Tools Grouping** — Grouped into at least 3 logical categories.

---

## 🤖 Built-In AI Agent Skills (26 Reusable Skills)

Career Ops Core includes 26 pre-built, candidate-agnostic skills under `.agents/skills/`:

| Category | Skills Included |
|:---|:---|
| **Resume & ATS Optimization** | `resume-ats-optimizer`, `resume-bullet-writer`, `resume-formatter`, `resume-quantifier`, `resume-section-builder`, `resume-tailor`, `resume-version-manager`, `tech-resume-optimizer`, `executive-resume-writer`, `creative-portfolio-resume`, `academic-cv-builder` |
| **Strategy & Applications** | `job-description-analyzer`, `application-form-filler`, `cover-letter-generator`, `career-changer-translator`, `portfolio-case-study-writer`, `reference-list-builder`, `offer-comparison-analyzer`, `salary-negotiation-prep` |
| **Interview Preparation** | `interview-prep-generator` (STAR stories, behavioral frameworks, technical probes) |
| **Outreach & Networking** | `cold-email`, `cold-email-writer`, `linkedin-profile-optimizer`, `copywriting`, `upwork`, `upwork-proposal` |

---

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Direct Node test runner:
```bash
node --test templates/engine.test.js
```

Covers:
- Zod schema validation across all positional experience blocks.
- Claims linter rejection of unverified metrics.
- Token allowlist handling (percentages, currencies, dates).
- Visual fit-guard and character budget assertions.

---

## 🤝 Contributing

Contributions, bug reports, and new agent skills are warmly welcomed! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on branch conventions, testing requirements, and maintaining the privacy-first boundary.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal and commercial use.
