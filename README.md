# Career Ops Core Engine

A reusable, privacy-hardened, multi-candidate career automation engine and application compilation pipeline.

---

## 1. Architectural Overview

Career Ops employs a **Dual-Repository Architecture** separating generic compilation logic from private candidate data:

```
┌─────────────────────────────────────────────────────────┐
│              Reusable Core (career-ops-core)            │
│  - Generic Zod schemas (EXPERIENCE[], PROJECTS[])       │
│  - Template compilation & WeasyPrint / Puppeteer engine │
│  - 26 Generic agent skills                              │
│  - Universal Quality Control (15 Core QC checks)        │
│  - Reusable templates & setup scripts                   │
└────────────────────────────┬────────────────────────────┘
                             │ git submodule add ../career-ops-core core
                             ▼
┌─────────────────────────────────────────────────────────┐
│           Private Data Repo (career-ops-<candidate>)    │
│  - core/ (Git Submodule pointing to career-ops-core)   │
│  - reference/                                           │
│    ├── profile.json        (Candidate biographical data)│
│    ├── bullet-library.json (Archetype frozen bullets)   │
│    ├── proof-bank.md       (Verified achievement bank)  │
│    └── qc-rules.json       (Candidate-specific QC rules)│
│  - AGENTS.md               (Candidate agent rules)      │
│  - SPEC.md                 (Candidate target roles)     │
│  - outputs/<role_slug>/    (Role-tailored applications) │
└─────────────────────────────────────────────────────────┘
```

This ensures that candidate personal data, contact details, work history, and proprietary compensation/metrics remain strictly inside private repositories with zero leakage into the shared core.

---

## 2. Core Components

| Directory | Purpose |
|-----------|---------|
| `templates/` | Dynamic CV and cover letter compiler, WeasyPrint environment detection, fit-guard visual height validator, and dual-layer QC runner. |
| `schemas/` | Standardized JSON and TypeScript Zod schemas for candidate profiles, bullet libraries, QC rules, and compilation configurations. |
| `agents/` | Challenger quality gate (`challenger-gate.ts`), review pipeline (`review-pipeline.ts`), and deterministic claims linter (`lint.js`). |
| `.agents/skills/` | Exactly 26 generic agent skills covering ATS optimization, interview preparation, portfolio case studies, salary negotiation, and resume bullet writing. |
| `reference-templates/` | Reusable starter files with `{{CANDIDATE_NAME}}`, `{{EMAIL}}`, `{{PHONE}}`, `{{EMPLOYERS}}`, and `{{DEGREES}}` placeholder tokens. |
| `scripts/` | Cross-platform setup scripts (`setup.ps1`, `setup.sh`) to initialize a new candidate data repo from reference templates. |

---

## 3. Instantiating a New Candidate Repository

To set up a new candidate's private career repository:

### Step 1: Initialize Git Repository
```bash
mkdir career-ops-<candidate_slug>
cd career-ops-<candidate_slug>
git init
```

### Step 2: Add Core as a Git Submodule
```bash
git submodule add <core-repo-url> core
git submodule update --init --recursive
```

### Step 3: Scaffold Reference Directory from Templates
Using PowerShell:
```powershell
.\core\scripts\setup.ps1 -CandidateName "Jane Doe"
```
Or manually copying from `core/reference-templates/`:
```bash
mkdir reference outputs
cp core/reference-templates/AGENTS.template.md AGENTS.md
cp core/reference-templates/SPEC.template.md SPEC.md
cp core/reference-templates/profile.template.json reference/profile.json
cp core/reference-templates/bullet-library.template.json reference/bullet-library.json
cp core/reference-templates/proof-bank.template.md reference/proof-bank.md
cp core/reference-templates/qc-rules.template.json reference/qc-rules.json
```

### Step 4: Populate Candidate Data
Edit files in `reference/` to specify:
1. `profile.json`: Name, contact info, full-time education, and degrees.
2. `bullet-library.json`: Archetypes (e.g. Strategist, Operator, Leader) with frozen `EXPERIENCE[]` and `PROJECTS[]` arrays.
3. `proof-bank.md`: Verified quantitative claims with proof levels.
4. `qc-rules.json`: Banned tools, required metrics, and custom disclosures.

---

## 4. Build Command Syntax & `--data-root`

Builds are executed within individual application output folders:

```bash
cd outputs/<role_slug>
node ../../core/templates/build.js --in partial_config.json --archetype "<Archetype_Name>" --data-root ../..
```

### Parameters:
- `--in <file>`: Path to role-specific `partial_config.json` containing 25% targeted overrides (e.g. `ROLE_INTRO`, `WHY_I_FIT`, tailored bullets).
- `--archetype <name>`: Archetype key matching `reference/bullet-library.json` (75% frozen content).
- `--data-root <path>`: Root path containing the candidate's `reference/` directory. If omitted, the engine walks up directory trees to discover the nearest `reference/` folder.

### Environment Variables:
- `DATA_ROOT`: Alternative environment variable to designate candidate data root.
- `WEASYPRINT_DLL_DIRECTORIES`: Path to GTK/GObject DLLs for WeasyPrint on Windows (auto-discovered if omitted).
- `PROOF_BANK_PATH`: Override path to `proof-bank.md`.

---

## 5. Pluggable Quality Control (Dual-Layer QC)

The build engine executes a two-phase quality gate:

### Phase 1: Universal Core QC (`qc_core_checks.js`)
Universal checks applicable to ANY candidate:
1. **Two-page budget gate**: PDF must render to exactly 2 pages.
2. **File size & existence**: Valid PDF generated (> 10KB).
3. **Primary experience bullets**: Minimum 4 bullets for anchor role.
4. **Project portfolio link**: Project entries contain active URL.
5. **WHY_I_FIT density**: Dense statement (> 200 characters).
6. **Role pillars**: Minimum structural pillars present.
7. **Numbers that matter**: Minimum quantitative callouts.
8. **Section integrity**: All required HTML sections present.
9. **Bold marker budget**: Minimum 40 bold metric tags for ATS scanning.
10. **Content density**: >= 4,000 text characters with zero undefined/null tokens.
11. **Hyphen ban**: Zero hyphens (`-`) or em-dashes (`—`) in dynamic prose (Rule 2).
12. **Date en-dash format**: En-dash (`–`) used for all date spans (Rule 9).
13. **Non-fulltime disclosures**: Part-time, advisory, or independent projects clearly labeled (Rule 7).
14. **Widow/orphan budget**: Bullets constrained to 95–115 or 180–230 characters to prevent orphan lines.
15. **Tools category count**: Minimum tooling items and groupings.

### Phase 2: Candidate User QC (`qc_user_checks.js`)
Candidate-specific validation loaded from `reference/qc-rules.json`:
- `bannedTools`: Custom prohibited tools (e.g. Zapier, n8n).
- `requiredMetrics`: Candidate mandatory proof metrics that must appear across summary or experience (e.g. revenue, volume, scale).
- `portfolioUrlRequired`: Enforce portfolio link presence.
- `minPillarsCount`: Custom pillar minimum.
- `coverLetterClosingText`: Mandatory closing commitment.
- `requiredDisclosures`: Part-time and independent disclosure enforcement.

---

## 6. Testing

Run the test suite:
```bash
npm test
```
Or directly via Node test runner:
```bash
node --test templates/engine.test.js
```
Ensures 100% test pass (10/10 tests) including schema validation, fit-guard visual height measurement, claims linter rejection of unverified numbers, and pluggable QC rule evaluation.
