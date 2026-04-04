import InventoryIcon from '@mui/icons-material/Inventory';
import { Box, Chip, Divider, Typography } from '@mui/material';
import { Popup } from 'react-leaflet';
import type { Node } from '../../types/types';
import { Circle } from '@mui/icons-material';

export default function PopupWarehouse({ node }: { node: Node }) {
    // Використовуємо кольори з вашої теми
    const statusColor = node.status === 'active' ? 'var(--periwinkle)' : 'var(--rosewood)';

    return (
        <Popup>
            <Box sx={{
                minWidth: 240,
                p: 0.5,
                backgroundColor: 'var(--blue-slate)',
                color: 'white'
            }}>
                {/* Header: Назва складу та статусний індикатор */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--periwinkle)', lineHeight: 1 }}>
                        {node.name}
                    </Typography>
                    <Circle sx={{ fontSize: 12, color: statusColor, ml: 1 }} />

                </Box>

                {/* Status Badge */}
                <Chip
                    label={node.status === 'active' ? 'СКЛАД АКТИВНИЙ' : 'СКЛАД ЗАБЛОКОВАНО'}
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

                {/* Section Title: В наявності */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <InventoryIcon sx={{ fontSize: 16, color: 'var(--periwinkle)' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>
                        Поточні запаси
                    </Typography>
                </Box>

                {/* Список ресурсів із вирівнюванням flex: 1 */}
                {node.inventory && node.inventory.length > 0 ? (
                    node.inventory.map((item, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                py: 0.75,
                                px: 1,
                                mb: 0.5,
                                borderRadius: 1,
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                borderLeft: '3px solid var(--periwinkle)'
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, whiteSpace: 'nowrap' }}>
                                {item.resource_id.replace('_', ' ')}
                            </Typography>

                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'var(--periwinkle)',
                                    fontWeight: 800,
                                    minWidth: '40px',
                                    textAlign: 'right'
                                }}
                            >
                                {item.quantity}
                            </Typography>
                        </Box>
                    ))
                ) : (
                    <Typography variant="caption" sx={{ opacity: 0.5, fontStyle: 'italic', p: 1 }}>
                        Товари відсутні
                    </Typography>
                )}
            </Box>
        </Popup>
    )
}