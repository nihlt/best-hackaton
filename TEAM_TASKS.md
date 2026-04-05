# Team Task Distribution

## Sofia

### Scope

- Create new scenarios
- Make the existing scenarios more detailed

### Files to edit

- [scenarios/normal/world_state.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/scenarios/normal/world_state.json)
- [scenarios/demand_spike/world_state.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/scenarios/demand_spike/world_state.json)
- [scenarios/blocked_route/world_state.json](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/scenarios/blocked_route/world_state.json)

### If adding a new scenario

- Create a new folder: `scenarios/<new_scenario>/world_state.json`
- Add the scenario to [scripts/generate-viewer-data.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/scripts/generate-viewer-data.js)
- Extend `ScenarioType` in [src/viewer/frontend/src/types/types.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/types/types.ts)
- Add fallback import and bundle wiring in [src/viewer/frontend/src/components/App.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/App.tsx)
- Add a tab in [src/viewer/frontend/src/components/Header.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/Header.tsx)

### Expected outcome

- Existing scenarios contain richer data
- New scenarios can be selected in the UI and go through the same pipeline as the current ones

## Sonya

### Scope

- Continue everything related to the AI assistant
- Improve summary, risks, recommendations, and assistant answers

### Files to edit

- [src/viewer/frontend/src/components/AiChatPanel.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/AiChatPanel.tsx)
- [src/viewer/frontend/src/utils/assistantFallback.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/utils/assistantFallback.ts)
- [src/viewer/frontend/server/assistantApi.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/server/assistantApi.ts)
- [src/modules/ai/mock-ai.js](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/modules/ai/mock-ai.js)
- [src/viewer/frontend/src/types/types.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/types/types.ts)

### Expected outcome

- AI summary is more useful and grounded in the current state
- Risks and recommendations actually depend on `worldState`, `solution`, and `aiAnalysis`
- Chat answers explain what changed after user actions

### Not in scope

- Dijkstra or route-search logic
- Map rendering
- KPI panel implementation

## Misha

### Scope

- Add the ability to create links between points
- Add arrow directions on routes

### Files to edit

- [src/viewer/frontend/src/utils/lvivRouting.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/utils/lvivRouting.ts)
- [src/viewer/frontend/src/data/lvivRoadGraph.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/data/lvivRoadGraph.ts)
- [src/viewer/frontend/src/components/Map.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/Map.tsx)
- [src/viewer/frontend/src/components/shared/MarkerEdge.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/shared/MarkerEdge.tsx)
- [src/viewer/frontend/src/components/shared/MarkerEdgePlaned.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/shared/MarkerEdgePlaned.tsx)
- [src/viewer/frontend/src/types/types.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/types/types.ts)

### Expected outcome

- A user can add a connection between two points
- New links affect routing logic, not just visuals
- Routes show direction instead of only plain lines

### Notes

- If new route or edge fields are introduced, update the shared types in `types.ts`

## Mykyta

### Scope

- Improve the bottom KPI panel
- Make the displayed data real and relevant

### Files to edit

- [src/viewer/frontend/src/components/KpiDashboard.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/KpiDashboard.tsx)
- [src/viewer/frontend/src/components/App.tsx](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/components/App.tsx)
- [src/viewer/frontend/src/utils/lvivRouting.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/utils/lvivRouting.ts)
- [src/viewer/frontend/src/types/types.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/types/types.ts)

### Expected outcome

- KPI cards show actual values derived from the current solution
- Metrics are relevant to what the user sees on the map and in the plan
- If new KPI fields are needed, they are added to shared types and computed before rendering

## Coordination Rules

- Sofia owns scenario data and should announce any new fields added to `world_state.json`
- Sonya owns AI interpretation and should not change routing internals unless discussed
- Misha owns route links and route direction visuals
- Mykyta owns KPI presentation and should avoid calculating business metrics directly inside UI components when they belong in routing-derived state

## Shared Rule

- If a new field is added to shared data structures, update [src/viewer/frontend/src/types/types.ts](/C:/Users/mykyta/Desktop/code2/git/best-hackaton/src/viewer/frontend/src/types/types.ts) and notify the team
