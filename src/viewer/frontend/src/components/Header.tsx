import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import {
    AppBar, Box, Chip, Container, Stack, Tab, Tabs,
    Toolbar, Typography, MenuItem, Select, FormControl
} from '@mui/material';
import React from 'react';
import type { ScenarioType, WorldState } from '../types/types';

interface HeaderProps {
    worldState: WorldState;
    currentScenario: ScenarioType;
    onScenarioChange: (scenario: ScenarioType) => void;
}

const Header: React.FC<HeaderProps> = ({ worldState, currentScenario, onScenarioChange }) => {
    const isOnline = worldState.execution_context.connectivity_status === 'stable';

    const handleTabChange = (_: React.SyntheticEvent, newValue: ScenarioType) => {
        onScenarioChange(newValue);
    };

    const handleSelectChange = (event) => {
        onScenarioChange(event.target.value as ScenarioType);
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
            {/* Зменшили відступи (padding) по боках на мобільних пристроях з xs: 2 до xs: 1 (8px) */}
            <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
                <Toolbar disableGutters sx={{ justifyContent: 'space-between', gap: { xs: 0.5, sm: 1 } }}>

                    {/* Ліва частина: Заголовок */}
                    <Stack direction="row" spacing={{ xs: 0.5, sm: 2 }} alignItems="center">
                        <Typography
                            variant="h5"
                            sx={{
                                color: 'var(--periwinkle)',
                                fontWeight: 900,
                                letterSpacing: '0.5px',
                                // Трохи зменшили шрифт для найменших екранів
                                fontSize: { xs: '0.9rem', sm: '1.25rem', md: '1.5rem' },
                                whiteSpace: 'nowrap'
                            }}
                        >
                            LOGISTICS AI
                        </Typography>
                        <Box
                            sx={{
                                height: '24px',
                                width: '1px',
                                backgroundColor: 'rgba(183, 195, 243, 0.3)',
                                display: { xs: 'none', sm: 'block' }
                            }}
                        />
                    </Stack>

                    {/* Центральна частина: Вибір сценарію */}
                    <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: { xs: 'center', md: 'center' }, px: { xs: 0.5, md: 0 } }}>
                        {/* Зменшили minWidth до 105px для екранів 320px */}
                        <FormControl size="small" sx={{ display: { xs: 'block', md: 'none' }, minWidth: 105 }}>
                            <Select
                                value={currentScenario}
                                onChange={handleSelectChange}
                                sx={{
                                    height: 32,
                                    color: 'white',
                                    backgroundColor: 'rgba(183, 195, 243, 0.1)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'var(--periwinkle)' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--periwinkle)' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--periwinkle)' },
                                    '.MuiSvgIcon-root ': { fill: "var(--periwinkle) !important" },
                                }}
                            >
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="demand_spike">Demand Spike</MenuItem>
                                <MenuItem value="blocked_route">Blocked Route</MenuItem>
                            </Select>
                        </FormControl>

                        <Tabs
                            value={currentScenario}
                            onChange={handleTabChange}
                            textColor="inherit"
                            indicatorColor="primary"
                            sx={{
                                display: { xs: 'none', md: 'flex' },
                                '& .MuiTabs-indicator': { backgroundColor: 'var(--periwinkle)', height: 3 },
                                '& .MuiTab-root': { fontWeight: 600, fontSize: '0.8rem', opacity: 0.7 },
                                '& .Mui-selected': { opacity: 1, color: 'var(--periwinkle) !important' },
                            }}
                        >
                            <Tab label="Normal" value="normal" />
                            <Tab label="Demand Spike" value="demand_spike" />
                            <Tab label="Blocked Route" value="blocked_route" />
                        </Tabs>
                    </Box>

                    {/* Права частина: Чіпи статусів */}
                    <Stack direction="row" spacing={{ xs: 0.5, sm: 2 }} alignItems="center">
                        <Chip
                            label={worldState.execution_context.optimization_goal}
                            variant="outlined"
                            size="small"
                            sx={{
                                display: { xs: 'none', sm: 'inline-flex' },
                                color: '#fff',
                                borderColor: 'rgba(255,255,255,0.25)',
                                maxWidth: { sm: 150, md: 260 },
                                '& .MuiChip-label': {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    px: 1.5
                                }
                            }}
                        />
                        <Chip
                            icon={isOnline ? <WifiIcon style={{ color: 'inherit', fontSize: '1rem' }} /> : <WifiOffIcon style={{ color: 'inherit', fontSize: '1rem' }} />}
                            label={isOnline ? 'ONLINE' : 'OFFLINE'}
                            color={isOnline ? 'success' : 'error'}
                            variant="outlined"
                            size="small"
                            sx={{
                                fontWeight: 'bold',
                                borderWidth: 2,
                                px: { xs: 0, sm: 1 }, // Зменшили внутрішній padding чіпа
                                fontSize: { xs: '0.65rem', sm: '0.8125rem' },
                                animation: isOnline ? 'none' : 'pulse 2s infinite',
                                '@keyframes pulse': {
                                    '0%': { opacity: 1 },
                                    '50%': { opacity: 0.6 },
                                    '100%': { opacity: 1 },
                                },
                            }}
                        />
                    </Stack>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Header;