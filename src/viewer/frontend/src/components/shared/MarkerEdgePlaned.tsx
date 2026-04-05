import { Polyline, Popup } from 'react-leaflet';
import { Box, Typography, Divider, Chip } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import React from 'react';

export default function MarkerEdgePlaned({ plan, path, i }) {
    // Кольори з твоєї палітри
    const accentColor = '#b7c3f3'; // --periwinkle
    const basePathColor = '#4f6272'; // --blue-slate

    return (
        <React.Fragment key={i}>
            {/* Шар 1: Статична основа шляху */}
            <Polyline
                positions={path}
                pathOptions={{
                    color: basePathColor,
                    weight: 6,
                    opacity: 0.4,
                    interactive: false // Клік проходить крізь цей шар
                }}
            />

            {/* Шар 2: Анімована лінія (пунктир) */}
            <Polyline
                positions={path}
                pathOptions={{
                    color: accentColor,
                    weight: 4,
                    opacity: 1,
                    className: 'ant-path-animate' // Підключаємо наш CSS
                }}
            >
                <Popup>
                    <Box sx={{
                        minWidth: 220,
                        p: 0.5,
                        backgroundColor: '#404e5c', // --charcoal-blue
                        color: 'white'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: accentColor, lineHeight: 1 }}>
                                {plan.vehicle_id}
                            </Typography>
                            <LocalShippingIcon sx={{ fontSize: 18, color: accentColor }} />
                        </Box>

                        <Chip
                            label={plan.status.toUpperCase()}
                            size="small"
                            sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(183, 195, 243, 0.1)',
                                color: accentColor,
                                border: `1px solid ${accentColor}`,
                                mb: 1
                            }}
                        />

                        <Divider sx={{ my: 1, borderColor: 'rgba(183, 195, 243, 0.2)' }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <InventoryIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                <Typography variant="caption">Ресурс: <b>{plan.resource_id.replace('_', ' ')}</b></Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="caption">Кількість: <b style={{ color: accentColor }}>{plan.quantity}</b></Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <AccessTimeIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                <Typography variant="caption">ETA: <b>{plan.eta_min} хв</b></Typography>
                            </Box>
                        </Box>
                    </Box>
                </Popup>
            </Polyline>
        </React.Fragment>
    );
}