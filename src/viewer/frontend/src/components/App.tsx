import {
  Box,
  Container,
  CssBaseline,
  Grid,
  ThemeProvider
} from '@mui/material';
import React, { useState } from 'react';


import theme from '../styles/theme';
import type { ScenarioType, Solution } from '../types/types';
import AiChatPanel from './AiChatPanel';
import Header from './Header';
import KpiDashboard from './KpiDashboard';
import LogisticsMap from './Map';
import blocked_world_state from '../../../../../scenarios/blocked_route/world_state.json'
import demand_world_state from '../../../../../scenarios/demand_spike/world_state.json'
import normal_world_state from '../../../../../scenarios/normal/world_state.json'
import template_solution from '../../../../../mock/optimizer/template.solution.json'
const App: React.FC = () => {
  const [worldState, setWorldState] = useState(normal_world_state);
  const [solution] = useState<Solution>(template_solution);
  const [curScenario, setcurScenario] = useState<ScenarioType>("normal")

  const handleChangeScenario = (s: ScenarioType) => {
    setcurScenario(s)
    setWorldState(() => {
      switch (s) {
        case "normal":
          return normal_world_state;
        case "blocked_route":
          return blocked_world_state;
        case "demand_spike":
          return demand_world_state
        default:
          return normal_world_state
      }
    })

  }
  console.log(curScenario)
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--charcoal-blue)' }}>


        <Header worldState={worldState} currentScenario={curScenario} onScenarioChange={handleChangeScenario} />
        <Container maxWidth="xl" sx={{ mt: 3, mb: 3, flexGrow: 1 }}>
          <Grid container spacing={3} sx={{ height: '100%' }}>

            <Grid size={{ xs: 12, }}  >
              <Box sx={{ marginBottom: 6 }}>
                <KpiDashboard kpis={solution.kpis} />
              </Box>
              <Box sx={{ display: 'flex', height: '90vh', flexGrow: 1, gap: 3 }}>
                <Box sx={{ flex: 3, minWidth: 0 }}>

                  <LogisticsMap worldState={worldState} solution={solution} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 350 }}>
                  <AiChatPanel explanation={solution.explanation} alerts={solution.alerts} />
                </Box>
              </Box>
            </Grid>



          </Grid>
        </Container>
      </Box>
    </ThemeProvider >
  );
};

export default App;