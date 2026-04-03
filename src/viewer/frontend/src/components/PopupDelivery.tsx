import { Typography, Box, Chip } from '@mui/material'
import { getPriorityColor } from '../styles/theme'
import type { Node } from '../types/types'
import { Popup } from 'react-leaflet'
import CircleIcon from '@mui/icons-material/Circle';

export default function PopupDelivery({ node }: { node: Node }) {
    // Визначаємо колір для статусу вузла
    const statusColor = node.status === 'active' ? '#b7c3f3' : '#cf1259';

    return (
        <Popup>
            <Box sx={{ minWidth: 150 }}>
                {/* Header зі статусом (Pin) */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {node.name}
                    </Typography>
                    {/* Індикатор статусу вузла */}
                    <CircleIcon sx={{ fontSize: 12, color: statusColor }} />
                </Box>

                {/* Додаткова мітка статусу (опціонально) */}
                <Chip
                    label={node.status === 'active' ? 'Активний' : 'Неактивний'}
                    size="small"
                    sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        mb: 1,
                        backgroundColor: `${statusColor}22`, // напівпрозорий фон
                        color: statusColor,
                        borderColor: statusColor
                    }}
                    variant="outlined"
                />

                <Typography variant="body2" sx={{ mt: 1, borderBottom: '1px solid rgba(183, 195, 243, 0.3)', pb: 0.5 }}>
                    Потреба:
                </Typography>

                {node.demands && node.demands.map((d, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                            py: 0.5,
                            borderBottom: '1px solid rgba(183, 195, 243, 0.1)'
                        }}
                    >
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {d.resource_id}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: getPriorityColor(d.priority),
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}
                        >
                            {d.quantity} {d.priority === 'critical' ? '(!)' : d.unit}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Popup>
    )
}