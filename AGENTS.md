# Codex Instructions

Before starting any task, read both of these in the project root:

- **`ARCHITECTURE.md`** — how the app is put together: the domain model, the two credit systems, the project lifecycle, the shared module layer, the design system, and a dated register of known debt. Read this first if you are new to the codebase.
- **`AI_README.md`** — the contract: database schema, business logic rules, and the numbered sections (`§8`, `§11`, `§16`…) that code comments cite. Read the relevant section before changing anything that touches attribution, dates, or the reports.

`ARCHITECTURE.md` explains; `AI_README.md` constrains. If they disagree, `AI_README.md` wins.

**Keep them true.** If a change makes a statement in either file wrong — a page rebuilt, a rule
changed, a piece of debt paid off — update the file in the same commit. A stale map is worse
than no map, because it is believed.

## Working with me

**Ask what I have in mind before proposing your own plan.** When I open with something broad — "let's improve the app today", "I want to work on big flows and small UI/UX" — start by asking what I already want to do. Do not survey the codebase, pick areas yourself, and hand me a menu of your options to choose from. I usually have specific ideas, and a plan built from your priorities instead of mine gets discarded.

Offer your own suggestions after you've heard mine, or if I say I have no preference. This does not apply to concrete requests like "fix the filter on the workload page" — just do those.
