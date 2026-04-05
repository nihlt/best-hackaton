import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { AppBar, Box, Chip, Container, Stack, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import React from 'react';
import type { ScenarioType, WorldState } from '../types/types';

interface HeaderProps {
    worldState: WorldState;
    currentScenario: ScenarioType;
    onScenarioChange: (scenario: ScenarioType) => void;
}

const Header: React.FC<HeaderProps> = ({ worldState, currentScenario, onScenarioChange }) => {
    const isOnline = worldState.execution_context.connectivity_status === 'stable';

    const handleChange = (_: React.SyntheticEvent, newValue: ScenarioType) => {
        onScenarioChange(newValue);
    };

    return (
        <AppBar
            position="static"
            sx={{
                backgroundColor: 'var(--blue-slate)',
                borderBottom: '2px solid var(--periwinkle)',
                boxShadow: 'none',
                zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
        >
            <Container maxWidth={false}>
                <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography
                            variant="h5"
                            sx={{
                                color: 'var(--periwinkle)',
                                fontWeight: 900,
                                letterSpacing: '0.5px',
                            }}
                        >
                            LOGISTICS AI
                        </Typography>
                        <Box
                            sx={{
                                height: '24px',
                                width: '1px',
                                backgroundColor: 'rgba(183, 195, 243, 0.3)',
                            }}
                        />
                        <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                            {worldState.scenario_id.toUpperCase()}
                        </Typography>
                    </Stack>

                    <Tabs
                        value={currentScenario}
                        onChange={handleChange}
                        textColor="inherit"
                        indicatorColor="primary"
                        sx={{
                            '& .MuiTabs-indicator': { backgroundColor: 'var(--periwinkle)', height: 3 },
                            '& .MuiTab-root': { fontWeight: 600, fontSize: '0.8rem', opacity: 0.7 },
                            '& .Mui-selected': { opacity: 1, color: 'var(--periwinkle) !important' },
                        }}
                    >
                        <Tab label="Normal" value="normal" />
                        <Tab label="Demand Spike" value="demand_spike" />
                        <Tab label="Blocked Route" value="blocked_route" />
                    </Tabs>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Chip
                            label={worldState.execution_context.optimization_goal}
                            variant="outlined"
                            sx={{
                                color: '#fff',
                                borderColor: 'rgba(255,255,255,0.25)',
                                maxWidth: 260,
                            }}
                        />
                        <Chip
                            icon={isOnline ? <WifiIcon style={{ color: 'inherit' }} /> : <WifiOffIcon style={{ color: 'inherit' }} />}
                            label={isOnline ? 'ONLINE' : 'OFFLINE'}
                            color={isOnline ? 'success' : 'error'}
                            variant="outlined"
                            sx={{
                                fontWeight: 'bold',
                                borderWidth: 2,
                                px: 1,
                                animation: isOnline ? 'none' : 'pulse 2s infinite',
                                '@keyframes pulse': {
                                    '0%': { opacity: 1 },
                                    '50%': { opacity: 0.6 },
                                    '100%': { opacity: 1 },
                                },
                            }}
                        />
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Header;
