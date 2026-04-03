import { Typography, Box, Chip, Divider } from '@mui/material'
import { getPriorityColor } from '../../styles/theme'
import type { Node, Priority } from '../../types/types'
import { Popup } from 'react-leaflet'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Circle } from '@mui/icons-material';

export default function PopupDelivery({ node }: { node: Node }) {
    const statusColor = node.status === 'active' ? 'var(--periwinkle)' : 'var(--rosewood)';

    const getPriorityLabel = (p: Priority | string | undefined) => {
        switch (p) {
            case 'critical': return 'Критично';
            case 'high':
            case 'elevated': return 'Високий';
            case 'medium':
            case 'normal': return 'Норма';
            case 'low': return 'Низький';
            default: return 'Стандарт';
        }
    };

    return (
        <Popup>
            <Box sx={{
                minWidth: 240, // Трохи збільшено ширину для кращого вирівнювання
                p: 0.5,
                backgroundColor: 'var(--blue-slate)',
                color: 'white'
            }}>
                {/* Header: Назва та статус */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--periwinkle)', lineHeight: 1 }}>
                        {node.name}
                    </Typography>
                    <Circle sx={{ fontSize: 12, color: statusColor, ml: 1 }} />
                </Box>
                {/* Status Badge */}
                <Chip
                    label={node.status === 'active' ? 'ONLINE' : 'OFFLINE'}
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

                {/* Section: Demands */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <ShoppingCartIcon sx={{ fontSize: 16, color: 'var(--periwinkle)' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>
                        Поточні потреби
                    </Typography>
                </Box>

                {node.demands && node.demands.length > 0 ? (
                    node.demands.map((d, index) => {
                        const priorityColor = getPriorityColor(d.priority);
                        const isCritical = d.priority === 'critical';

                        return (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5, // Фіксований відступ між усіма елементами ряду
                                    py: 0.75,
                                    px: 1,
                                    mb: 0.5,
                                    borderRadius: 1,
                                    backgroundColor: isCritical ? 'rgba(207, 18, 89, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                    borderLeft: `3px solid ${priorityColor}`
                                }}
                            >
                                {/* Назва ресурсу займає весь вільний простір */}
                                <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, whiteSpace: 'nowrap' }}>
                                    {d.resource_id.replace('_', ' ')}
                                </Typography>

                                {/* Блок із чипом та кількістю завжди вирівняний справа */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        label={getPriorityLabel(d.priority)}
                                        size="small"
                                        sx={{
                                            height: 16,
                                            fontSize: '0.55rem',
                                            backgroundColor: `${priorityColor}33`,
                                            color: priorityColor,
                                            fontWeight: 'bold',
                                            border: `1px solid ${priorityColor}`,
                                            minWidth: '60px' // Фіксована ширина чипа для візуальної стабільності
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: priorityColor,
                                            fontWeight: 800,
                                            minWidth: '25px', // Фіксована ширина для чисел
                                            textAlign: 'right'
                                        }}
                                    >
                                        {d.quantity}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })
                ) : (
                    <Typography variant="caption" sx={{ opacity: 0.5, fontStyle: 'italic' }}>
                        Потреби відсутні
                    </Typography>
                )}
            </Box>
        </Popup>
    )
}