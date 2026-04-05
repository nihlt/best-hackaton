# Project Structure And Logic

## 1. Project idea

This project is a mock logistics decision-support system built around a simple JSON pipeline.

At a high level, the project does this:

1. Takes a scenario as input
2. Produces AI analysis for that scenario
3. Converts scenario + AI analysis into optimizer input
4. Produces a delivery plan and KPI output
5. Renders the result in a viewer and a frontend map UI

The project is intentionally simple:

- modules communicate through files
- the main integration contract is JSON
- mocks can be replaced later with real components

This is the core pipeline:

```text
scenarios/<scenario>/world_state.json
  -> ai_analysis.json
  -> optimizer_input.json
  -> solution.json
  -> viewer/frontend
```

## 2. Abstract architecture

The project has 5 logical layers.

### A. Contracts layer

This defines the expected shape of the JSON files.

- `world_state.json`
- `ai_analysis.json`
- `optimizer_input.json`
- `solution.json`

This layer is the shared agreement between all modules.

### B. Scenario layer

This provides the raw demo input data:

- resources
- nodes
- edges
- vehicles
- events
- execution context

### C. Processing pipeline

This is the backend logic flow:

- AI module reads `world_state.json` and produces `ai_analysis.json`
- orchestrator reads `world_state.json` + `ai_analysis.json` and produces `optimizer_input.json`
- optimizer reads `optimizer_input.json` and produces `solution.json`

### D. Viewer layer

This shows the output in two ways:

- text summary in terminal
- interactive frontend map/dashboard

### E. Tooling / run layer

This is everything used to run the demo conveniently:

- CLI
- `.bat` scripts
- data export script
- Python and frontend dependency setup

## 3. End-to-end logic of the project

### Step 1. Scenario is selected

A scenario is stored in:

- `scenarios/normal/world_state.json`
- `scenarios/demand_spike/world_state.json`
- `scenarios/blocked_route/world_state.json`

Each scenario describes the logistics world:

- nodes
- available stock
- demand
- road edges
- vehicle fleet
- environment events

### Step 2. AI analysis is generated

The AI module reads the scenario and produces:

- a summary
- demand forecasts
- route risk adjustments
- recommendations

The project currently uses a rule-based mock for this, plus an optional frontend assistant endpoint that can call Gemini or fall back to a local heuristic response.

### Step 3. Optimizer input is prepared

The orchestrator combines:

- real world state
- AI demand forecasts
- AI route risk adjustments

Then it creates a normalized optimizer input:

- supply
- demand
- routes
- vehicles
- constraints

### Step 4. Optimizer builds a plan

The optimizer tries to minimize unmet demand and penalties from risky routes.

Current behavior:

- Python optimizer is preferred when available
- JavaScript fallback optimizer is used if Python fails

The result is:

- allocation plan
- alerts
- explanations
- KPI
- objective score

### Step 5. Result is shown to the user

The result is displayed in:

- CLI summary
- frontend map
- AI panel
- KPI dashboard

### Step 6. Frontend derives local routing visuals

The frontend also has its own local routing layer for map rendering.

It:

- builds a local Lviv road graph
- runs Dijkstra between map points
- derives route polylines
- recalculates edges and allocation paths visually

This means the frontend is not only a passive renderer. It also derives client-side route geometry and KPI-related display state from scenario data.

## 4. Main integration principle

The project is designed around this rule:

> modules communicate through JSON contracts, not through each other's internals

This is reinforced by:

- [docs/guideline.md](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/docs/guideline.md)
- [TEAM_ROLES.md](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/TEAM_ROLES.md)

So if one module changes internally, it should still keep the same input/output contract.

## 5. Concrete folder structure

```text
best-hackaton/
├─ contracts/
├─ docs/
├─ mock/
├─ pipeline/
├─ scenarios/
├─ scripts/
├─ src/
│  ├─ cli/
│  ├─ lib/
│  ├─ modules/
│  │  ├─ ai/
│  │  └─ optimizer/
│  ├─ orchestrator/
│  └─ viewer/
├─ .venv/
├─ README.md
├─ TEAM_ROLES.md
├─ TEAM_TASKS.md
├─ run.bat
├─ run_all.bat
└─ requirements.txt
```

## 6. Folder-by-folder explanation

### `contracts/`

Purpose:

- canonical JSON contracts
- source of truth for required output shapes

Typical use:

- team members check these files before changing module outputs
- validation logic in `src/lib/contracts.js` reflects these structures

Files:

- [contracts/world_state.contract.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/contracts/world_state.contract.json)
- [contracts/ai_analysis.contract.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/contracts/ai_analysis.contract.json)
- [contracts/optimizer_input.contract.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/contracts/optimizer_input.contract.json)
- [contracts/solution.contract.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/contracts/solution.contract.json)

### `docs/`

Purpose:

- human rules for architecture and collaboration

Files:

- [docs/guideline.md](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/docs/guideline.md)
  - explains the KISS rule
  - defines folder ownership
  - defines how modules should communicate

### `mock/`

Purpose:

- notes and templates for fake or mock outputs

Files:

- [mock/ai/template.ai_analysis.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/mock/ai/template.ai_analysis.json)
- [mock/ai/README.md](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/mock/ai/README.md)
- [mock/optimizer/template.solution.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/mock/optimizer/template.solution.json)
- [mock/optimizer/README.md](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/mock/optimizer/README.md)

These are mostly reference data and examples, not the main runtime logic.

### `pipeline/`

Purpose:

- generated runtime artifacts

This is where the CLI writes files during execution.

Expected flow:

- `pipeline/input/world_state.json`
- `pipeline/ai_output/ai_analysis.json`
- `pipeline/optimizer_input/optimizer_input.json`
- `pipeline/solution/solution.json`

This directory should be treated as output, not source-of-truth input.

### `scenarios/`

Purpose:

- source scenario data for demo runs

Current scenarios:

- [scenarios/normal/world_state.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/scenarios/normal/world_state.json)
- [scenarios/demand_spike/world_state.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/scenarios/demand_spike/world_state.json)
- [scenarios/blocked_route/world_state.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/scenarios/blocked_route/world_state.json)

Each scenario is one complete logistics state snapshot.

### `scripts/`

Purpose:

- project-level automation scripts

Files:

- [scripts/generate-viewer-data.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/scripts/generate-viewer-data.js)
  - runs the CLI for all predefined scenarios
  - copies generated artifacts into frontend `public/generated/`
  - writes a `manifest.json`

### `src/`

Purpose:

- main application logic

This is the most important directory in the project.

## 7. `src/` detailed structure

### `src/cli/`

Purpose:

- command-line entrypoint for the whole pipeline

File:

- [src/cli/index.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/cli/index.js)

What it does:

- lists scenarios
- runs a full scenario pipeline
- runs AI module only
- runs prepare/orchestrator step only
- runs optimizer only
- prints viewer summary
- verifies all scenarios

Main commands:

- `list-scenarios`
- `run <scenario>`
- `ai <world_state> <output>`
- `prepare <world_state> <ai_analysis> <output>`
- `optimize <optimizer_input> <output>`
- `view <world_state> <solution> <ai_analysis>`
- `verify`

This file is the main backend orchestration entrypoint.

### `src/lib/`

Purpose:

- shared low-level utilities

Files:

- [src/lib/contracts.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/lib/contracts.js)
  - validates that top-level required fields exist in JSON outputs
  - provides validators for `world_state`, `ai_analysis`, `optimizer_input`, and `solution`

- [src/lib/json.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/lib/json.js)
  - read/write JSON files
  - ensure directories exist
  - copy files
  - check file existence

These files are infrastructure helpers used by CLI and modules.

### `src/modules/ai/`

Purpose:

- scenario analysis layer

Files:

- [src/modules/ai/mock-ai.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/ai/mock-ai.js)
  - current mock AI implementation
  - reads world state
  - predicts demand changes based on events
  - adjusts route risk
  - produces recommendations
  - generates a summary

- [src/modules/ai/ai_module.py](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/ai/ai_module.py)
  - Python AI-related module placeholder/integration point
  - currently not the main path used by the Node CLI flow

Important logic in `mock-ai.js`:

- `calculateDemandForecast`
- `calculateRouteAdjustment`
- `buildRecommendations`
- `runMockAi`

This folder owns:

- `world_state.json -> ai_analysis.json`

### `src/orchestrator/`

Purpose:

- adapter between AI output and optimizer input

File:

- [src/orchestrator/build-optimizer-input.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/orchestrator/build-optimizer-input.js)

What it does:

- reads `worldState` and `aiAnalysis`
- converts demand forecasts into optimizer demand quantities
- converts route risk adjustments into route penalties
- extracts supply from warehouses
- extracts demand from delivery points
- builds normalized route and vehicle arrays
- creates optimizer constraints

This file owns:

- `world_state.json + ai_analysis.json -> optimizer_input.json`

### `src/modules/optimizer/`

Purpose:

- solution planning layer

Files:

- [src/modules/optimizer/mock-optimizer.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/optimizer/mock-optimizer.js)
  - wrapper around Python optimizer
  - writes temporary input/output files
  - tries Python first
  - falls back to JS optimizer if Python fails

- [src/modules/optimizer/mock-core.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/optimizer/mock-core.js)
  - pure JS fallback optimizer
  - greedily assigns vehicles and supply to demand
  - creates KPI, alerts, explanations, and allocation plan

- [src/modules/optimizer/optimizer.py](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/optimizer/optimizer.py)
  - Python optimization implementation using PuLP
  - formulates the allocation problem as an LP/MIP
  - tries to minimize unmet demand and route risk cost
  - generates `solution.json`

Main optimizer logic:

- choose feasible route by destination
- respect forbidden edges
- respect resource compatibility
- respect vehicle capacity
- optionally allow partial delivery
- compute KPI from allocation result

This folder owns:

- `optimizer_input.json -> solution.json`

### `src/viewer/`

Purpose:

- output presentation layer

Files:

- [src/viewer/render-summary.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/render-summary.js)
  - prints terminal summary
  - shows scenario, connectivity, AI summary, KPI, plan, alerts, explanations, and artifact paths

- [src/viewer/frontend/](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend)
  - React + TypeScript frontend application

## 8. Frontend architecture

The frontend is not only a display shell. It combines:

- scenario loading
- local derived routing
- interactive map editing
- assistant panel
- KPI dashboard

### Frontend boot and config

- [src/viewer/frontend/src/main.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/main.tsx)
  - frontend entrypoint
  - mounts React app
  - imports global CSS, MUI theme, and Leaflet CSS

- [src/viewer/frontend/vite.config.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/vite.config.ts)
  - Vite config
  - loads environment variables
  - installs custom assistant API middleware
  - exposes dev server on port `5173`

- [src/viewer/frontend/index.html](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/index.html)
  - HTML shell for the app

- [src/viewer/frontend/package.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/package.json)
  - frontend dependencies and scripts

### Frontend app composition

- [src/viewer/frontend/src/components/App.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/App.tsx)
  - top-level frontend state container
  - loads scenario artifacts
  - stores selected scenario, bundle, loading state, selected node, add mode, and last user action
  - derives routing state through `deriveRoutingState`
  - refreshes assistant state through `/api/assistant/analyze`
  - handles add/move/delete of nodes
  - passes data to Header, Map, AI panel, and KPI panel

- [src/viewer/frontend/src/components/Header.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/Header.tsx)
  - top bar
  - scenario switching tabs
  - connectivity badge
  - optimization goal chip

- [src/viewer/frontend/src/components/Map.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/Map.tsx)
  - main map area
  - renders basemap
  - renders nodes, routes, planned allocations, and vehicles
  - listens to map clicks when adding points
  - supports node dragging

- [src/viewer/frontend/src/components/AiChatPanel.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/AiChatPanel.tsx)
  - AI side panel
  - shows summary, model info, alerts, recommendations, allocation plan, unserved demand, explanations
  - lets the user ask follow-up questions
  - calls `/api/assistant/analyze`

- [src/viewer/frontend/src/components/KpiDashboard.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/KpiDashboard.tsx)
  - bottom KPI cards
  - displays delivered volume, unmet demand, utilization, average time

### Frontend shared map components

- [src/viewer/frontend/src/components/shared/MarkerNode.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/shared/MarkerNode.tsx)
  - renders warehouse and delivery markers
  - switches icon if selected
  - attaches drag/click behavior
  - chooses proper popup by node type

- [src/viewer/frontend/src/components/shared/PopupWarehouse.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/shared/PopupWarehouse.tsx)
  - detailed popup for warehouse nodes
  - shows stock/inventory

- [src/viewer/frontend/src/components/shared/PopupDelivery.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/shared/PopupDelivery.tsx)
  - detailed popup for delivery points
  - shows demand and priority

- [src/viewer/frontend/src/components/shared/MarkerVehicle.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/shared/MarkerVehicle.tsx)
  - renders vehicle marker and popup
  - shows status, type, capacity

- [src/viewer/frontend/src/components/shared/MarkerEdge.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/shared/MarkerEdge.tsx)
  - renders regular route edges
  - styles blocked/open routes differently
  - shows route popup with risk, distance, ETA

- [src/viewer/frontend/src/components/shared/MarkerEdgePlaned.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/shared/MarkerEdgePlaned.tsx)
  - renders planned delivery routes
  - shows vehicle/resource/ETA popup

### Frontend routing and assistant utilities

- [src/viewer/frontend/src/utils/lvivRouting.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/utils/lvivRouting.ts)
  - one of the most important frontend files
  - builds a local road graph adjacency list
  - finds nearest graph nodes to scenario points
  - runs Dijkstra
  - builds route polylines
  - derives synthetic edges for the map
  - derives allocation plan and KPI used by the frontend

Important functions:

- `haversineDistanceKm`
- `buildAdjacencyList`
- `runDijkstra`
- `buildRoutePath`
- `buildStaticEdges`
- `deriveRoutingState`

- [src/viewer/frontend/src/utils/assistantFallback.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/utils/assistantFallback.ts)
  - local fallback assistant logic
  - creates summary/risks/recommendations/insights if external assistant is unavailable

### Frontend data and type layer

- [src/viewer/frontend/src/data/lvivRoadGraph.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/data/lvivRoadGraph.ts)
  - hardcoded graph of Lviv road nodes and graph edges
  - used only by frontend route derivation

- [src/viewer/frontend/src/types/types.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/types/types.ts)
  - shared frontend TypeScript contracts
  - defines `WorldState`, `Solution`, `AiAnalysis`, map node types, assistant types, scenario type, etc.

### Frontend styles and hooks

- [src/viewer/frontend/src/styles/theme.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/styles/theme.ts)
  - MUI theme
  - color palette
  - typography
  - priority color helper

- [src/viewer/frontend/src/styles/index.css](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/styles/index.css)
  - CSS variables
  - body theme
  - Leaflet popup styling

- [src/viewer/frontend/src/hooks/useWifiStatus.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/hooks/useWifiStatus.ts)
  - simple browser online/offline hook
  - currently auxiliary and not central to business logic

### Frontend local server API

- [src/viewer/frontend/server/assistantApi.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/server/assistantApi.ts)
  - Vite middleware endpoint
  - handles `POST /api/assistant/analyze`
  - can call Gemini using env variables
  - validates and returns structured assistant output
  - falls back to `buildAssistantFallback` if API key is missing or request fails

## 9. Runtime and support files

- [README.md](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/README.md)
  - quick start and demo flow

- [TEAM_ROLES.md](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/TEAM_ROLES.md)
  - team ownership by module boundary

- [TEAM_TASKS.md](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/TEAM_TASKS.md)
  - current task distribution by person

- [run.bat](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/run.bat)
  - lightweight local run script
  - checks Node
  - ensures frontend dependencies exist
  - generates viewer data
  - starts frontend

- [run_all.bat](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/run_all.bat)
  - full environment setup
  - creates Python venv if needed
  - installs Python deps
  - installs frontend deps
  - generates pipeline outputs
  - starts frontend

- [requirements.txt](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/requirements.txt)
  - Python dependencies
  - includes PuLP, dotenv, google-generativeai

## 10. Where the main business logic lives

If someone asks “where is the real logic?”, the answer is:

### Core backend logic

- AI heuristics: [src/modules/ai/mock-ai.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/ai/mock-ai.js)
- optimizer input transformation: [src/orchestrator/build-optimizer-input.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/orchestrator/build-optimizer-input.js)
- optimization: [src/modules/optimizer/optimizer.py](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/optimizer/optimizer.py)
- fallback optimizer: [src/modules/optimizer/mock-core.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/optimizer/mock-core.js)

### Core frontend logic

- app state and interaction flow: [src/viewer/frontend/src/components/App.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/App.tsx)
- local route derivation and KPI generation: [src/viewer/frontend/src/utils/lvivRouting.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/utils/lvivRouting.ts)
- assistant fallback and AI UI integration: [src/viewer/frontend/src/utils/assistantFallback.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/utils/assistantFallback.ts)

## 11. Important architectural nuance

There are effectively two “solution-producing” paths in this project.

### Path A. Backend pipeline solution

This is the CLI/file-based flow:

- scenario
- AI analysis
- optimizer input
- optimizer solution

### Path B. Frontend-derived routing solution

Inside the UI, [src/viewer/frontend/src/utils/lvivRouting.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/utils/lvivRouting.ts) derives:

- local routes
- edges
- allocation plan
- KPI

This means:

- the frontend is currently partly simulating logistics logic too
- some KPI shown in the UI can be derived locally, not only from pipeline files
- if you change routing behavior, you must check both backend and frontend assumptions

## 12. What each major area is responsible for

### Scenario data responsibility

- `scenarios/`

Owns:

- world input
- demo realism
- events and route availability

### AI responsibility

- `src/modules/ai/`
- `src/viewer/frontend/server/assistantApi.ts`
- `src/viewer/frontend/src/utils/assistantFallback.ts`
- `src/viewer/frontend/src/components/AiChatPanel.tsx`

Owns:

- explanation
- recommendations
- assistant interaction

### Optimization responsibility

- `src/orchestrator/`
- `src/modules/optimizer/`

Owns:

- formal planning
- capacity handling
- unmet demand
- route constraints
- objective score

### Frontend responsibility

- `src/viewer/frontend/src/components/`
- `src/viewer/frontend/src/utils/lvivRouting.ts`
- `src/viewer/frontend/src/styles/`

Owns:

- display
- interaction
- local map edits
- local route visualization
- KPI presentation

## 13. Best files to read first if onboarding

If a new teammate wants to understand the project quickly, read in this order:

1. [README.md](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/README.md)
2. [docs/guideline.md](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/docs/guideline.md)
3. [src/cli/index.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/cli/index.js)
4. [src/modules/ai/mock-ai.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/ai/mock-ai.js)
5. [src/orchestrator/build-optimizer-input.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/orchestrator/build-optimizer-input.js)
6. [src/modules/optimizer/mock-core.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/optimizer/mock-core.js)
7. [src/viewer/frontend/src/components/App.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/App.tsx)
8. [src/viewer/frontend/src/utils/lvivRouting.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/utils/lvivRouting.ts)

## 14. Short summary

This project is a file-based logistics demo platform.

Its logic is:

- scenario JSON defines the logistics world
- AI module interprets the world
- orchestrator converts it into normalized planning input
- optimizer generates a delivery plan
- viewer/frontend displays the result

The backend pipeline is intentionally simple and contract-driven.
The frontend adds an interactive visualization layer and local route derivation on top of that pipeline.
