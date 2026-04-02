# Team Roles And Integration Guide

This project is organized as a simple file-based pipeline. Each participant should work inside one module boundary and integrate through JSON contracts.

## Core rule

We integrate through JSON contracts, not through each other's internal code.

Pipeline:

```text
scenario -> ai -> orchestrator -> optimizer -> viewer
```

Source of truth:

- `contracts/` - JSON shapes and required keys
- `scenarios/` - input demo scenarios
- `docs/guideline.md` - project rules

## Shared rules for everyone

- Do not change JSON contracts without team agreement.
- Do not depend on another person's internal implementation.
- Build your module as `input -> output`.
- If your module has a custom internal format, add an adapter in your own area.
- If your logic is not ready yet, return a valid fallback JSON instead of breaking the pipeline.
- Test your module using files from `scenarios/`.

## AI Engineer -- Соня

Owns:

- `src/modules/ai/`

Responsibility:

- Implement `world_state.json -> ai_analysis.json`
- Replace or extend `src/modules/ai/mock-ai.js`

Input:

- `world_state.json`

Output:

- `ai_analysis.json`

Must produce:

- `schema_version`
- `scenario_id`
- `timestamp`
- `model_info`
- `summary`
- `demand_forecasts`
- `route_risk_adjustments`
- `recommendations`

Should not do:

- Rewrite `world_state.json`
- Build `optimizer_input.json`
- Build `solution.json`
- Depend on viewer or UI code

## Optimizer Engineer -- Софія

Owns:

- `src/modules/optimizer/`

Responsibility:

- Implement `optimizer_input.json -> solution.json`
- Replace or extend `src/modules/optimizer/mock-optimizer.js`

Input:

- `optimizer_input.json`

Output:

- `solution.json`

Must produce:

- `schema_version`
- `scenario_id`
- `timestamp`
- `objective`
- `kpis`
- `allocation_plan`
- `unserved_demands`
- `alerts`
- `explanation`

Should not do:

- Read the whole pipeline and make assumptions outside `optimizer_input.json`
- Rebuild AI logic
- Depend on UI details

Note:

- If your algorithm returns a different shape, add an adapter so the final output still matches our `solution.json` contract.

## Viewer / Frontend Engineer -- Михайло

Owns:

- `src/viewer/`

Responsibility:

- Render the result of the pipeline in a simple, understandable form
- Read generated artifacts and present scenario, summary, KPI, alerts, and plan

Input:

- `world_state.json`
- `solution.json`
- optional `ai_analysis.json`

Output:

- Text viewer or UI

Must show:

- Scenario name
- Connectivity status
- AI summary
- KPI
- Allocation plan
- Alerts
- Explanation

Should not do:

- Calculate AI outputs
- Calculate optimizer outputs
- Change contracts

## Integration rule

If you want to replace a mock with your real module:

1. Accept the same input contract.
2. Return the same output contract.
3. If needed, add an adapter in your own module.
4. Do not force changes in other modules because of your internal implementation.

## What nobody changes alone

- `contracts/`
- JSON field names and required keys
- Top-level pipeline structure

## Practical goal

We are not aiming for perfect architecture. We are aiming for a stable demo where any mock can be replaced by a real module with minimal pain.
