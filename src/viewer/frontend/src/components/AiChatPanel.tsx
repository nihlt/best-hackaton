import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TimelineIcon from '@mui/icons-material/Timeline';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Chip, Divider, IconButton, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { AiAnalysis, Solution } from '../types/types';

interface Props {
    aiAnalysis: AiAnalysis;
    solution: Solution;
    explanation: string[];
    alerts: {
        severity: 'info' | 'warning' | 'critical';
        message: string;
    }[];
}

export default function AiChatPanel({ aiAnalysis, solution, explanation, alerts }: Props) {
    const [messages, setMessages] = useState<string[]>([]);
    const [curMessage, setCurMessage] = useState('');

    const handleSendMessage = () => {
        if (!curMessage.trim()) return;
        setMessages((prevMessages) => [...prevMessages, curMessage]);
        setCurMessage('');
    };

    return (
        <Paper
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--blue-slate)',
                borderRadius: 4,
                border: '1px solid var(--periwinkle)',
                overflow: 'hidden',
                flex: 1,
            }}
        >
            <Box sx={{ p: 2, backgroundColor: 'rgba(183, 195, 243, 0.1)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToyIcon sx={{ color: 'var(--periwinkle)' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Pipeline Assistant
                </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(183, 195, 243, 0.2)' }} />

            <Box
                sx={{
                    p: 2,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: 'rgba(183, 195, 243, 0.08)',
                        border: '1px solid rgba(183, 195, 243, 0.25)',
                    }}
                >
                    <Typography variant="overline" sx={{ color: 'var(--periwinkle)', fontWeight: 700 }}>
                        AI Summary
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.6 }}>
                        {aiAnalysis.summary}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                        <Chip size="small" label={`Provider: ${aiAnalysis.model_info.provider}`} sx={{ color: '#fff' }} />
                        <Chip size="small" label={`Model: ${aiAnalysis.model_info.model}`} sx={{ color: '#fff' }} />
                        {solution.objective && (
                            <Chip size="small" label={`Score: ${solution.objective.score}`} sx={{ color: '#fff' }} />
                        )}
                    </Box>
                </Box>

                {alerts.map((alert, index) => (
                    <Box
                        key={`alert-${index}`}
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: alert.severity === 'critical' ? 'rgba(207, 18, 89, 0.1)' : 'rgba(221, 117, 150, 0.1)',
                            border: `1px solid ${alert.severity === 'critical' ? 'var(--rosewood)' : 'var(--petal-rouge)'}`,
                            display: 'flex',
                            gap: 1,
                        }}
                    >
                        <WarningAmberIcon
                            sx={{
                                fontSize: 20,
                                color: alert.severity === 'critical' ? 'var(--rosewood)' : 'var(--petal-rouge)',
                            }}
                        />
                        <Typography variant="caption" sx={{ color: '#fff' }}>
                            {alert.message}
                        </Typography>
                    </Box>
                ))}

                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TipsAndUpdatesIcon sx={{ fontSize: 18, color: 'var(--periwinkle)' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Recommendations
                        </Typography>
                    </Box>
                    {aiAnalysis.recommendations.map((recommendation, index) => (
                        <Typography key={`rec-${index}`} variant="body2" sx={{ color: '#fff', mb: 0.75, lineHeight: 1.5 }}>
                            {recommendation.type} for {recommendation.target_id}
                            {recommendation.new_priority ? ` -> ${recommendation.new_priority}` : ''}
                            {recommendation.action ? ` -> ${recommendation.action}` : ''}
                        </Typography>
                    ))}
                </Box>

                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TimelineIcon sx={{ fontSize: 18, color: 'var(--periwinkle)' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Allocation Plan
                        </Typography>
                    </Box>
                    {solution.allocation_plan.length > 0 ? (
                        solution.allocation_plan.map((plan, index) => (
                            <Typography key={`plan-${index}`} variant="body2" sx={{ color: '#fff', mb: 0.75, lineHeight: 1.5 }}>
                                {plan.vehicle_id}: {plan.resource_id} {plan.quantity} from {plan.from_node_id} to {plan.to_node_id} ({plan.eta_min} min)
                            </Typography>
                        ))
                    ) : (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            No delivery allocations were generated.
                        </Typography>
                    )}
                </Box>

                {!!solution.unserved_demands?.length && (
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: 'rgba(207, 18, 89, 0.08)',
                            border: '1px solid rgba(207, 18, 89, 0.25)',
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            Unserved Demand
                        </Typography>
                        {solution.unserved_demands.map((item, index) => (
                            <Typography key={`unserved-${index}`} variant="body2" sx={{ color: '#fff', mb: 0.75, lineHeight: 1.5 }}>
                                {item.node_id}: {item.resource_id} {item.quantity} ({item.reason})
                            </Typography>
                        ))}
                    </Box>
                )}

                {explanation.map((text, index) => (
                    <Box
                        key={`exp-${index}`}
                        sx={{
                            alignSelf: 'flex-start',
                            maxWidth: '90%',
                            backgroundColor: 'rgba(183, 195, 243, 0.05)',
                            p: 2,
                            borderRadius: '0px 16px 16px 16px',
                            borderLeft: '3px solid var(--periwinkle)',
                        }}
                    >
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {text}
                        </Typography>
                    </Box>
                ))}

                {messages.map((message, index) => (
                    <Box
                        key={`message-${index}`}
                        sx={{
                            alignSelf: 'flex-end',
                            maxWidth: '90%',
                            backgroundColor: 'rgba(183, 195, 243, 0.05)',
                            p: 2,
                            borderRadius: '16px 0px 16px 16px',
                            borderRight: '3px solid var(--periwinkle)',
                        }}
                    >
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {message}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{ p: 2, backgroundColor: 'rgba(64, 78, 92, 0.5)' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Add review notes for the demo"
                    variant="outlined"
                    value={curMessage}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSendMessage();
                            e.preventDefault();
                        }
                    }}
                    onChange={(e) => setCurMessage(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            borderRadius: 3,
                            '& fieldset': { borderColor: 'rgba(183, 195, 243, 0.3)' },
                            '&:hover fieldset': { borderColor: 'var(--periwinkle)' },
                        },
                    }}
                    InputProps={{
                        endAdornment: (
                            <IconButton onClick={handleSendMessage} size="small" sx={{ color: 'var(--periwinkle)' }}>
                                <SendIcon fontSize="small" />
                            </IconButton>
                        ),
                    }}
                />
            </Box>
        </Paper>
    );
}
