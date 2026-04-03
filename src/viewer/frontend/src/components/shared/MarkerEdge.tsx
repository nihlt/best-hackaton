import { Polyline, Popup } from 'react-leaflet';
import { Box, Typography, Divider, Chip } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function MarkerEdge({ edge, isBlocked, path }) {
    // Кольори на основі стану маршруту [cite: 11, 14]
    const statusColor = isBlocked ? 'var(--rosewood)' : 'var(--periwinkle)';

    return (
        <Polyline
            key={edge.edge_id}
            positions={path}
            pathOptions={{
                color: statusColor,
                weight: isBlocked ? 5 : 3,
                dashArray: isBlocked ? '10, 10' : '0'
            }}
        >
            <Popup>
                <Box sx={{
                    minWidth: 180,
                    p: 0.5,
                    backgroundColor: 'var(--blue-slate)',
                    color: 'white'
                }}>
                    {/* Header: ID Маршруту та статус */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--periwinkle)', lineHeight: 1 }}>
                            {edge.edge_id}
                        </Typography>
                        <TimelineIcon sx={{ fontSize: 18, color: statusColor }} />
                    </Box>

                    {/* Status Badge [cite: 1, 13] */}
                    <Chip
                        label={isBlocked ? 'МАРШРУТ ПЕРЕКРИТО' : 'МАРШРУТ ВІДКРИТО'}
                        size="small"
                        sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            backgroundColor: `${statusColor}22`,
                            color: statusColor,
                            border: `1px solid ${statusColor}`,
                            mb: 1
                        }}
                    />

                    <Divider sx={{ my: 1, borderColor: 'rgba(183, 195, 243, 0.2)' }} />

                    {/* Параметри маршруту [cite: 10] */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SpeedIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>Ризик:</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: edge.risk_score > 0.5 ? 'var(--rosewood)' : 'white' }}>
                                {(edge.risk_score * 100).toFixed(0)}%
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <WarningAmberIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>Довжина:</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                {edge.distance_km} км
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Час (EST):</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                {edge.estimated_travel_time_min} хв
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Popup>
        </Polyline>
    );
}