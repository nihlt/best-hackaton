import { Polyline, Popup } from 'react-leaflet';
import { Box, Typography, Divider, Chip } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function MarkerEdgePlaned({ plan, path, i }) {
    // Використовуємо Periwinkle для активних планів доставки
    const accentColor = 'var(--periwinkle)';

    return (
        <Polyline
            key={i}
            positions={path}
            pathOptions={{
                color: 'var(--success-green)',
                weight: 4,
                opacity: 0.8
            }}
        >
            <Popup>
                <Box sx={{
                    minWidth: 220,
                    p: 0.5,
                    backgroundColor: 'var(--blue-slate)',
                    color: 'white'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: accentColor, lineHeight: 1 }}>
                            {plan.vehicle_id}
                        </Typography>
                        <LocalShippingIcon sx={{ fontSize: 18, color: accentColor }} />
                    </Box>

                    {/* Status Badge */}
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                                <InventoryIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Ресурс:</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                {plan.resource_id.replace('_', ' ')}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Кількість:</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: accentColor }}>
                                {plan.quantity}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                                <AccessTimeIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>ETA:</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                {plan.eta_min} хв
                            </Typography>
                        </Box>

                    </Box>
                </Box>
            </Popup>
        </Polyline>
    );
}