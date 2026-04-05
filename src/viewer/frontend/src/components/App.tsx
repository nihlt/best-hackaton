import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { Box, Button, CircularProgress, CssBaseline, Grid, Stack, ThemeProvider, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

import templateAiJson from '../../../../../mock/ai/template.ai_analysis.json';
import templateSolutionJson from '../../../../../mock/optimizer/template.solution.json';
import blockedWorldStateJson from '../../../../../scenarios/blocked_route/world_state.json';
import demandWorldStateJson from '../../../../../scenarios/demand_spike/world_state.json';
import normalWorldStateJson from '../../../../../scenarios/normal/world_state.json';
import theme from '../styles/theme';
import { buildAssistantFallback } from '../utils/assistantFallback';
import type { AiAnalysis, AiAssistantResponse, AiUserAction, ScenarioType, Solution, WorldState } from '../types/types';
import { deriveRoutingState, deriveRoutingStateWithOsm } from '../utils/lvivRouting';
import AiChatPanel from './AiChatPanel';
import Header from './Header';
import KpiDashboard from './KpiDashboard';
import LogisticsMap from './Map';

type ScenarioBundle = {
  worldState: WorldState;
  aiAnalysis: AiAnalysis;
  solution: Solution;
};

const normalWorldState = normalWorldStateJson as WorldState;
const demandWorldState = demandWorldStateJson as WorldState;
const blockedWorldState = blockedWorldStateJson as WorldState;
const templateAi = templateAiJson as AiAnalysis;
const templateSolution = templateSolutionJson as Solution;
const NEW_NODE_STORAGE_CAPACITY = 250;
const NEW_NODE_DEMAND_QUANTITY = 25;

const fallbackWorldStates: Record<ScenarioType, WorldState> = {
  normal: normalWorldState,
  demand_spike: demandWorldState,
  blocked_route: blockedWorldState,
};

const fallbackBundle: Record<ScenarioType, ScenarioBundle> = {
  normal: {
    worldState: normalWorldState,
    aiAnalysis: { ...templateAi, scenario_id: 'normal' },
    solution: { ...templateSolution, scenario_id: 'normal' },
  },
  demand_spike: {
    worldState: demandWorldState,
    aiAnalysis: { ...templateAi, scenario_id: 'demand_spike' },
    solution: { ...templateSolution, scenario_id: 'demand_spike' },
  },
  blocked_route: {
    worldState: blockedWorldState,
    aiAnalysis: { ...templateAi, scenario_id: 'blocked_route' },
    solution: { ...templateSolution, scenario_id: 'blocked_route' },
  },
};

const App: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<ScenarioType>('normal');
  const [bundle, setBundle] = useState<ScenarioBundle>(fallbackBundle.normal);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'warehouse' | 'delivery_point' | null>(null);
  const [lastUserAction, setLastUserAction] = useState<AiUserAction>({ type: 'none', message: 'Initial state loaded.' });
  const [assistantState, setAssistantState] = useState<AiAssistantResponse>(
    buildAssistantFallback(fallbackBundle.normal.worldState, fallbackBundle.normal.solution, fallbackBundle.normal.aiAnalysis),
  );
  const [routingState, setRoutingState] = useState(() =>
    deriveRoutingState(fallbackBundle.normal.worldState, fallbackBundle.normal.aiAnalysis),
  );

  useEffect(() => {
    let cancelled = false;
    const fallbackRoutingState = deriveRoutingState(bundle.worldState, bundle.aiAnalysis);
    setRoutingState(fallbackRoutingState);

    async function resolveOsmRouting() {
      try {
        const nextRoutingState = await deriveRoutingStateWithOsm(bundle.worldState, bundle.aiAnalysis);
        if (!cancelled) {
          setRoutingState(nextRoutingState);
        }
      } catch {
        if (!cancelled) {
          setRoutingState(fallbackRoutingState);
        }
      }
    }

    resolveOsmRouting();

    return () => {
      cancelled = true;
    };
  }, [bundle.worldState, bundle.aiAnalysis]);

  useEffect(() => {
    let cancelled = false;

    async function loadScenarioData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [worldStateResponse, aiResponse, solutionResponse] = await Promise.all([
          fetch(`/generated/${currentScenario}/world_state.json`),
          fetch(`/generated/${currentScenario}/ai_analysis.json`),
          fetch(`/generated/${currentScenario}/solution.json`),
        ]);

        if (!worldStateResponse.ok || !aiResponse.ok || !solutionResponse.ok) {
          throw new Error('Generated pipeline artifacts are missing. Run run_all.bat first.');
        }

        const [worldState, aiAnalysis, solution] = await Promise.all([
          worldStateResponse.json() as Promise<WorldState>,
          aiResponse.json() as Promise<AiAnalysis>,
          solutionResponse.json() as Promise<Solution>,
        ]);

        if (!cancelled) {
          setBundle({ worldState, aiAnalysis, solution });
          setSelectedNodeId(null);
          setAddMode(null);
          setLastUserAction({ type: 'scenario_changed', message: `Scenario switched to ${currentScenario}.` });
        }
      } catch (error) {
        if (!cancelled) {
          setBundle({
            worldState: fallbackWorldStates[currentScenario],
            aiAnalysis: fallbackBundle[currentScenario].aiAnalysis,
            solution: fallbackBundle[currentScenario].solution,
          });
          setLoadError(error instanceof Error ? error.message : 'Failed to load generated artifacts.');
          setSelectedNodeId(null);
          setAddMode(null);
          setLastUserAction({ type: 'scenario_changed', message: `Fallback data loaded for ${currentScenario}.` });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadScenarioData();

    return () => {
      cancelled = true;
    };
  }, [currentScenario]);

  useEffect(() => {
    let cancelled = false;

    async function refreshAssistantState() {
      try {
        const response = await fetch('/api/assistant/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            worldState: bundle.worldState,
            solution: routingState.solution,
            aiAnalysis: bundle.aiAnalysis,
            userAction: lastUserAction,
          }),
        });

        if (!response.ok) {
          throw new Error(`Assistant endpoint failed with ${response.status}`);
        }

        const nextAssistantState = (await response.json()) as AiAssistantResponse;
        if (!cancelled) {
          setAssistantState(nextAssistantState);
        }
      } catch {
        if (!cancelled) {
          setAssistantState(
            buildAssistantFallback(bundle.worldState, routingState.solution, bundle.aiAnalysis, undefined, lastUserAction),
          );
        }
      }
    }

    refreshAssistantState();

    return () => {
      cancelled = true;
    };
  }, [bundle.worldState, bundle.aiAnalysis, routingState.solution, lastUserAction]);

  const updateWorldState = (updater: (worldState: WorldState) => WorldState) => {
    setBundle((currentBundle) => ({
      ...currentBundle,
      worldState: updater(currentBundle.worldState),
    }));
  };

  const handleAddNode = (nodeType: 'warehouse' | 'delivery_point', location: { lat: number; lng: number }) => {
    updateWorldState((worldState) => {
      const nextIndex = worldState.nodes.filter((node) => node.node_type === nodeType).length + 1;
      const prefix = nodeType === 'warehouse' ? 'W' : 'D';
      const newNodeId = `${prefix}_custom_${Date.now()}`;

      return {
        ...worldState,
        nodes: [
          ...worldState.nodes,
          {
            node_id: newNodeId,
            node_type: nodeType,
            name: nodeType === 'warehouse' ? `Warehouse ${nextIndex}` : `Destination ${nextIndex}`,
            location,
            status: 'active',
            capacity: nodeType === 'warehouse' ? { storage: NEW_NODE_STORAGE_CAPACITY } : undefined,
            inventory: nodeType === 'warehouse'
              ? worldState.resources.slice(0, 2).map((resource) => ({
                resource_id: resource.resource_id,
                quantity: NEW_NODE_STORAGE_CAPACITY,
              }))
              : undefined,
            demands: nodeType === 'delivery_point'
              ? worldState.resources.slice(0, 2).map((resource) => ({
                resource_id: resource.resource_id,
                quantity: NEW_NODE_DEMAND_QUANTITY,
                priority: 'normal',
              }))
              : undefined,
          },
        ],
      };
    });

    setSelectedNodeId(null);
    setAddMode(null);
    setLastUserAction({
      type: 'add_node',
      message: `${nodeType === 'warehouse' ? 'Warehouse' : 'Destination'} added on the map.`,
    });
  };

  const handleMoveNode = (nodeId: string, location: { lat: number; lng: number }) => {
    updateWorldState((worldState) => ({
      ...worldState,
      nodes: worldState.nodes.map((node) =>
        node.node_id === nodeId
          ? {
            ...node,
            location,
          }
          : node,
      ),
    }));

    setLastUserAction({
      type: 'move_node',
      target_id: nodeId,
      message: `${nodeId} was moved and routes were recalculated.`,
    });
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) {
      return;
    }

    updateWorldState((worldState) => ({
      ...worldState,
      nodes: worldState.nodes.filter((node) => node.node_id !== selectedNodeId),
      edges: worldState.edges.filter(
        (edge) => edge.from_node_id !== selectedNodeId && edge.to_node_id !== selectedNodeId,
      ),
    }));

    setSelectedNodeId(null);
    setLastUserAction({
      type: 'delete_node',
      target_id: selectedNodeId,
      message: `${selectedNodeId} was deleted from the scenario.`,
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--charcoal-blue)' }}>
        <Header worldState={bundle.worldState} currentScenario={currentScenario} onScenarioChange={setCurrentScenario} />
        <Box
          sx={{
            mt: 3,
            mb: 3,
            flexGrow: 1,
            width: '100%',
            px: '2%',
            boxSizing: 'border-box',
          }}
        >
          {isLoading ? (
            <Stack sx={{ height: '100%' }} alignItems="center" justifyContent="center" spacing={2}>
              <CircularProgress sx={{ color: 'var(--periwinkle)' }} />
              <Typography variant="body1">Loading pipeline data...</Typography>
            </Stack>
          ) : (
            <Grid container spacing={3} sx={{ height: '100%' }}>
              <Grid size={{ xs: 12 }}>
                {loadError && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      {loadError}
                    </Typography>
                  </Box>
                )}

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '64% calc(100% - 64% - 2%)' },
                    columnGap: { xs: 0, lg: '2%' },
                    rowGap: 3,
                    height: { xs: 'auto', lg: 'calc(100vh - 220px)' },
                    minHeight: { lg: 0 },
                    flexGrow: 1,
                    alignItems: 'stretch',
                    marginBottom: 3,
                  }}
                >
                  <Box sx={{ minWidth: 0, minHeight: { lg: 0 }, height: '100%' }}>
                    <Stack spacing={1.5} sx={{ height: '100%' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Button
                          variant={addMode === 'warehouse' ? 'contained' : 'outlined'}
                          startIcon={<WarehouseIcon />}
                          onClick={() => setAddMode((currentMode) => (currentMode === 'warehouse' ? null : 'warehouse'))}
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          Add warehouse
                        </Button>
                        <Button
                          variant={addMode === 'delivery_point' ? 'contained' : 'outlined'}
                          startIcon={<AddLocationAltIcon />}
                          onClick={() =>
                            setAddMode((currentMode) => (currentMode === 'delivery_point' ? null : 'delivery_point'))
                          }
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          Add destination
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={handleDeleteSelectedNode}
                          disabled={!selectedNodeId}
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          Delete selected
                        </Button>
                      </Stack>

                      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                        <LogisticsMap
                          worldState={{ ...bundle.worldState, edges: routingState.edges }}
                          solution={routingState.solution}
                          edgePolylines={routingState.edgePolylines}
                          allocationPolylines={routingState.allocationPolylines}
                          selectedNodeId={selectedNodeId}
                          addMode={addMode}
                          onSelectNode={setSelectedNodeId}
                          onMoveNode={handleMoveNode}
                          onAddNode={handleAddNode}
                        />
                      </Box>
                    </Stack>
                  </Box>
                  <Box sx={{ minWidth: { xs: 0, lg: 350 }, minHeight: { lg: 0 }, height: '100%' }}>
                    <AiChatPanel
                      aiAnalysis={bundle.aiAnalysis}
                      assistantState={assistantState}
                      solution={routingState.solution}
                      worldState={bundle.worldState}
                      userAction={lastUserAction}
                      explanation={routingState.solution.explanation}
                      alerts={routingState.solution.alerts}
                    />
                  </Box>
                </Box>

                <Box sx={{ marginBottom: 3 }}>
                  <KpiDashboard kpis={routingState.solution.kpis} />
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
