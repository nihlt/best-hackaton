import React from 'react';
import { Paper, Typography, Box, Stack } from '@mui/material';
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
        p: { xs: 1.5, sm: 2 },
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
                p: { xs: 1, sm: 1.5 },
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
        <Box
            sx={{
                display: 'grid',
                // Адаптивна сітка: 1 колонка на мобільних, 2 на планшетах, 4 на десктопі
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: { xs: 1.5, md: 2 }
            }}
        >
            <KpiCard
                title="Доставлено"
                value={kpis.total_delivered}
                subtitle="Ресурсів у дорозі"
                icon={<LocalShippingIcon fontSize="large" />}
                color="var(--periwinkle)"
            />
            <KpiCard
                title="Дефіцит"
                value={kpis.unmet_demand}
                subtitle="Критичний попит"
                icon={<WarningIcon fontSize="large" />}
                color="var(--rosewood)"
            />
            <KpiCard
                title="Ефективність"
                value={`${(kpis.vehicle_utilization * 100).toFixed(0)}%`}
                subtitle="Завантаження флоту"
                icon={<SpeedIcon fontSize="large" />}
                color="var(--petal-rouge)"
            />
            <KpiCard
                title="Сер. Час"
                value={`${kpis.avg_delivery_time_min} хв`}
                subtitle="Час на маршруті"
                icon={<TimerIcon fontSize="large" />}
                color="#ffffff"
            />
        </Box>
    );
};

export default KpiDashboard;