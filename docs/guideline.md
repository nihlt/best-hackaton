# Project Guideline

## Core rule

Keep it simple. If there is a choice between a clever solution and a stable simple solution, choose the simple one.

## Team rules

- JSON contracts do not change without team agreement.
- Modules communicate through files, not through each other's internals.
- New scenarios go only into `scenarios/`.
- Temporary run artifacts go only into `pipeline/`.
- `mock/` contains stub logic, templates, and notes about fake behavior.
- `contracts/` is the source of truth for JSON shapes.
- First make the demo flow stable. Improve visuals or sophistication only after that.

## Module boundaries

- AI module reads `world_state.json` and writes `ai_analysis.json`.
- Orchestrator reads `world_state.json` + `ai_analysis.json` and writes `optimizer_input.json`.
- Optimizer reads `optimizer_input.json` and writes `solution.json`.
- Viewer reads the generated artifacts and renders a human-readable summary.

## Naming and structure

- Use lowercase snake-case filenames for JSON contracts.
- Keep one scenario per folder.
- Keep one responsibility per script.
- Prefer deterministic output over randomness so demos are repeatable.
