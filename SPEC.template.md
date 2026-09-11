# SPEC.md — Career Ops Framework Specification

## 0. Overview
Autonomous Career Operating System for {{CANDIDATE_NAME}}.

## 1. Candidate Ground Truth
- Target Archetypes: Defined in `reference/archetypes.md`
- Verified Proof Bank: `reference/proof-bank.md`
- Frozen Bullets: `reference/bullet-library.json`
- Candidate Profile: `reference/profile.json`

## 2. Build Pipeline
The deterministic build pipeline compiles `partial_config.json` into a pixel-perfect 2-page PDF via WeasyPrint:
```bash
node core/templates/build.js --in partial_config.json --archetype "<Archetype>" --data-root ../..
```

## 3. Quality Gates
1. Two-page page budget gate
2. Zero hyphens / em-dashes (Rule 2)
3. Widow/orphan line density budget (95–115 or 180–230 characters)
4. Minimum 4 primary experience bullets
5. Claims linter verification against proof bank
