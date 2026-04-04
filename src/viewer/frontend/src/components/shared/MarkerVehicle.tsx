import { Box, Typography, Divider, Chip } from '@mui/material';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SpeedIcon from '@mui/icons-material/Speed';
import HubIcon from '@mui/icons-material/Hub';

const vehicleIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

export default function MarkerVehicle({ vehicle, position }) {
    // Визначаємо колір залежно від статусу транспорту
    const statusColor = vehicle.status === 'in_transit' ? 'var(--periwinkle)' :
        vehicle.status === 'idle' ? 'rgba(255,255,255,0.5)' : 'var(--rosewood)';

    return (
        <Marker
            key={vehicle.vehicle_id}
            position={[position.lat, position.lng]}
            icon={vehicleIcon}
        >
            <Popup>
                <Box sx={{
                    minWidth: 200,
                    p: 0.5,
                    backgroundColor: 'var(--blue-slate)',
                    color: 'white'
                }}>
                    {/* Header: ID Транспорту та іконка */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--periwinkle)', lineHeight: 1 }}>
                            {vehicle.vehicle_id}
                        </Typography>
                        <LocalShippingIcon sx={{ fontSize: 18, color: 'var(--periwinkle)' }} />
                    </Box>

                    {/* Status Badge */}
                    <Chip
                        label={vehicle.status.toUpperCase()}
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

                    {/* Характеристики транспорту з вирівнюванням */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                                <HubIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Тип:</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                {vehicle.vehicle_type.toUpperCase()}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                                <SpeedIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Місткість:</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--periwinkle)' }}>
                                {vehicle.capacity}
                            </Typography>
                        </Box>

                    </Box>
                </Box>
            </Popup>
        </Marker>
    );
}