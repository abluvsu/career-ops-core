# Writing Rules (single source of truth)

> Merged from the former anti-slop, humanizer, and writing-style files. Applies to ALL outward-facing text. SPEC.md carries the top rules; this is the exhaustive version.

---

## A. Anti-Slop Rules

These rules apply to ALL outward-facing text generated in this workspace, including cover letters, LinkedIn DMs, email subjects, application notes, and proposals.

## Banned Patterns (DO NOT USE)
- Bullet-point lists with arrows (â†’) or checkmarks (âœ“) in DMs, cover letters, or LinkedIn notes.
- Corporate filler and fake enthusiasm: "I am excited about the opportunity", "I would love to discuss", "I welcome the opportunity", "It would be an honor", "I am truly passionate about".
- Buzzwords without proof: "execution excellence", "high-impact", "cross-functional synergy", "leveraging", "streamline", "optimize", "innovative", "cutting-edge".
- Starting consecutive paragraphs with "I".
- Exclamation points in professional copy (unless explicitly matching the recipient's tone).
- Overly formal or sycophantic language.
- Dashes (em-dashes, en-dashes, or hyphens) to connect clauses or thoughts. Use commas, semicolons, or short separate sentences instead.

## Required Patterns (DO USE)
- **Specific over vague:** Use numbers, names, and concrete outcomes.
- **Show, don't tell:** Describe what happened, not how great it was.
- **Customer language:** Write the way the reader thinks, not the way a corporate LinkedIn post sounds.
- **One idea per paragraph:** Keep paragraphs focused and punchy.
- **Active voice, short sentences:** Prioritize clarity and momentum.
- **Confident, not qualified:** Avoid "almost", "very", "really", "just".
- **Human tone:** Sound like a capable person who has actually done the work and doesn't need to oversell themselves. Write like you are texting a smart friend (but maintain professional grammar).

## Early-Stage Startup Outreach Rules (Aditya Thakur Playbook)
- **90-Second Skim Cap:** Cold emails to founders strictly under 180 words.
- **Max 1â€“2 Links:** Never pad messages with 5+ links. One live project demo + one LinkedIn/GitHub link.
- **Zero Throat-Clearing:** Never open with "I came across your job post" or generic praise. Lead with a product observation, friction fix, or proof of execution.
- **Proof Structure:** Always frame proof points as `Work + Context + Outcome + Link` (e.g. "Built CareerFlowAI (portfolio.example.com), 7-agent AI system with 61% session autonomy").

## Pre-Output Checklist
Before finalizing any text, scan it against the banned patterns above. If any are present, rewrite the text before outputting.

---

## C. Education vs. Certifications Rule

- **Full-Time Degrees:** MBA (IIM Sirmaur) and B.E. Civil Engineering (Ramdeobaba University, Nagpur) are full-time formal education degrees. They MUST ONLY appear in the `EDUCATION` section.
- **NEVER Mislabel Degrees as Certifications:** NEVER list full-time degrees under `CERTIFICATIONS` or use labels like "Executive Education & Engineering" in certifications.
- **Certifications Content:** The `CERTIFICATIONS` field must strictly contain legitimate professional certifications, courses, or industry projects (e.g. Certified Business Analyst Power BI, Azure OpenAI Generative AI Models, IIT Bombay Industry Consulting Project) or be left to fallback to `profile.json`.

---

## B. Humanizer Patterns

---
name: feedback-humanizer
description: Writing style rules â€” apply the humanizer skill (github.com/blader/humanizer) to every response; 33 AI-writing patterns to avoid
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 08eb1918-0adb-4c5f-bda0-0fed12caa177
---

Apply the humanizer skill (https://github.com/blader/humanizer, SKILL.md v2.8.0) to every response generated in this project. Remove all 33 AI-writing patterns before delivering output.

**Why:** User explicitly requested this so all output reads as natural human writing, not AI-generated text.

**How to apply:** Before finalizing any response or document, scan for and eliminate:

**Content patterns**
1. Significance inflation ("marking a pivotal moment", "testament to", "underscores")
2. Notability name-dropping without context
3. Superficial -ing analyses ("symbolizing...", "showcasing...", "reflecting...")
4. Promotional language ("nestled", "vibrant", "breathtaking", "groundbreaking")
5. Vague attributions ("experts believe", "industry observers note")
6. Formulaic "challenges and future prospects" sections

**Language patterns**
7. AI vocabulary words: actually, additionally, crucial, delve, enhance, foster, garner, highlight, intricate, landscape, pivotal, showcase, tapestry, testament, underscore, vibrant
8. Copula avoidance ("serves as", "stands as", "boasts") â€” use is/are/has
9. Negative parallelisms ("it's not just X, it's Y") and tailing negations ("no guessing")
10. Rule of three forced groupings
11. Synonym cycling / elegant variation
12. False ranges ("from X to Y" on a non-meaningful scale)
13. Passive voice / subjectless fragments ("No configuration file needed")

**Style patterns**
14. Em dashes (â€”) and en dashes (â€“) â€” hard cut, zero allowed in final output
15. Boldface overuse on ordinary terms
16. Inline-header bullet lists (**Term:** description) â€” convert to prose
17. Title Case In Headings â€” use sentence case
18. Emojis in headings or bullets
19. Curly quotes â€” use straight quotes
26. Hyphenated word pairs in predicate position ("the report is high-quality" â†’ "high quality")
27. Persuasive authority tropes ("at its core", "the real question is", "what really matters")
28. Signposting announcements ("let's dive in", "here's what you need to know")
29. Fragmented headers followed by a one-line restatement
30. Diff-anchored writing ("this was added to replace...")
31. Manufactured punchlines / staccato drama (run of short declarative fragments)
32. Aphorism formulas ("X is the Y of Z", "X is the language of")
33. Conversational rhetorical openers ("Honestly?", "Look,", "Here's the thing")

**Communication patterns**
20. Chatbot artifacts ("I hope this helps!", "let me know if you'd like me to expand")
21. Knowledge-cutoff disclaimers and speculative gap-filling
22. Sycophantic tone ("Great question!", "You're absolutely right!")

**Filler and hedging**
23. Filler phrases ("in order to", "due to the fact that", "it is important to note that")
24. Excessive hedging ("could potentially possibly")
25. Generic positive conclusions ("the future looks bright")

**Exception for career documents:** CV bullets and cover letters use plain, neutral voice â€” do not inject opinion or first-person editorial. Apply the patterns mechanically but do not add personality.

**Process for any substantial text block:**
1. Draft
2. Audit: "what still sounds AI-generated?"
3. Final rewrite eliminating remaining tells
4. Scan for em/en dashes â€” any hit means not done

---

## C. Writing Style

---
name: feedback-writing-style
description: "Writing rules â€” no hyphens, humanise, LinkedIn hyperlinked, answer length, CV one page"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 19dd7ee2-596f-4407-8ac1-dec8e6cc90dd
---

1. **No hyphens** in any content ever â€” rewrite as full words or phrases
2. **Human tone** â€” no stacked adjectives, no brochure-speak, no AI-sounding copy
3. **LinkedIn hyperlinked** in every CV (ExternalHyperlink in docx, style: "Hyperlink")
4. **Application answers** â€” 100 to 200 words max
5. **CV** â€” one full page always. Verify rendered PDF fills the page.
6. **Cover letter** â€” 260 to 320 words. Count before finalising.

---

## D. Advanced Humanizer & Great Thinker Tactics

### 1. First-Principles Problem Framing
- Never begin an application answer or outreach note by talking about yourself. Begin with the employer's specific operational or architectural problem.
- Connect every metric directly to the underlying business or technical constraint. Explain *why* the achievement was hard, not just *that* it occurred.

### 2. Cadence & Rhythm Variation
- **Avoid monotonous sentence lengths.** AI output often generates uniform 14 to 18 word sentences.
- **Vary deliberately:** Pair a short, 6 to 9 word declarative sentence with a longer 20 to 25 word analytical sentence. This mimics natural human speech and thought flow.
- Avoid manufactured punchlines or dramatic staccato fragments (e.g. "Simple. Effective. Fast.").

### 3. Craftsmanship Over Execution
- Frame technical work as a deliberate discipline (craftsmanship) rather than mechanical execution.
- Use direct, grounded language that sounds like a senior practitioner explaining an engineering decision to a peer.

### 4. Mechanical Anti-AI Checklist (Run Before Output)
- [ ] **Zero Hyphens & Dashes:** No `-`, `â€”`, or `â€“` in any output string.
- [ ] **No AI Words:** Banned: *crucial, delve, enhance, foster, garner, highlight, intricate, landscape, pivotal, showcase, tapestry, testament, underscore, vibrant*.
- [ ] **No Signposting or Lists:** Convert numbered/bulleted lists in text responses into clean, well-spaced paragraphs.
- [ ] **Word Cap Compliance:** Application answers strictly 100 to 200 words; cover letters strictly 260 to 320 words.

