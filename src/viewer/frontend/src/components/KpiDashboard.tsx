import React from 'react';
import { Grid, Paper, Typography, Box, Stack } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarningIcon from '@mui/icons-material/Warning';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';

interface KpiProps {
    kpis: {
        total_delivered: number;
        unmet_demand: number;
        vehicle_utilization: number;
        avg_delivery_time_min: number;
    };
}

const KpiCard = ({
    title,
    value,
    icon,
    color,
    subtitle
}: {
    title: string,
    value: string | number,
    icon: React.ReactNode,
    color: string,
    subtitle: string
}) => (
    <Paper sx={{
        p: 2,
        backgroundColor: 'var(--blue-slate)',
        border: `1px solid ${color}`,
        borderRadius: 4,
        height: '100%',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' }
    }}>
        <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                p: 1.5,
                borderRadius: 3,
                display: 'flex',
                color: color,
                border: `1px solid rgba(255,255,255,0.1)`
            }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {title}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                    {value}
                </Typography>
                <Typography variant="caption" sx={{ color: color, fontWeight: 500 }}>
                    {subtitle}
                </Typography>
            </Box>
        </Stack>
    </Paper>
);

const KpiDashboard: React.FC<KpiProps> = ({ kpis }) => {
    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                    title="Доставлено"
                    value={kpis.total_delivered}
                    subtitle="Ресурсів у дорозі"
                    icon={<LocalShippingIcon fontSize="large" />}
                    color="var(--periwinkle)"
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                    title="Дефіцит"
                    value={kpis.unmet_demand}
                    subtitle="Критичний попит"
                    icon={<WarningIcon fontSize="large" />}
                    color="var(--rosewood)"
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                    title="Ефективність"
                    value={`${(kpis.vehicle_utilization * 100).toFixed(0)}%`}
                    subtitle="Завантаження флоту"
                    icon={<SpeedIcon fontSize="large" />}
                    color="var(--petal-rouge)"
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                    title="Сер. Час"
                    value={`${kpis.avg_delivery_time_min} хв`}
                    subtitle="Час на маршруті"
                    icon={<TimerIcon fontSize="large" />}
                    color="#ffffff"
                />
            </Grid>
        </Grid>
    );
};

export default KpiDashboard;