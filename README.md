# Career Ops Core Framework

A reusable, multi-user career automation and application delivery pipeline.

## Features
- **Deterministic 2-Page PDF Compiler**: Compiles job-tailored applications into pixel-perfect 2-page PDFs via WeasyPrint.
- **Pluggable QC System**: Separates core structural/typographical checks from candidate-specific metric checks.
- **Dynamic Experience Rendering**: Supports arbitrary career histories through an `EXPERIENCE[]` array model.
- **26 Autonomous Agent Skills**: Covers ATS analysis, salary negotiation, cover letters, and interview preparation.
- **Widow & Character Density Guard**: Eliminates awkward line wrapping by enforcing 95–115 or 180–230 character line budgets.

## Quick Start
1. Create your private career data repository.
2. Add this core repository as a Git Submodule:
   ```bash
   git submodule add https://github.com/<username>/career-ops-core core
   ```
3. Initialize your reference data:
   ```powershell
   .\core\scripts\setup.ps1 -CandidateName "Your Name"
   ```
4. Populate `reference/profile.json` and `reference/bullet-library.json` from `core/schemas/`.
5. Run your first build:
   ```bash
   cd outputs/my_target_role
   node ../../core/templates/build.js --in partial_config.json --archetype "MyArchetype" --data-root ../..
   ```

## Architecture
- `templates/`: Central compilation, validation, and rendering engine.
- `agents/`: Automated challenger gates and dual-agent review pipeline.
- `.agents/skills/`: 26 standalone agent skills.
- `schemas/`: Zod and JSON schema definitions.
- `reference-templates/`: Positioning archetypes and writing rules.
