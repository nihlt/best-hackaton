import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TimelineIcon from '@mui/icons-material/Timeline';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Chip, CircularProgress, Divider, IconButton, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { AiAnalysis, AiAssistantResponse, AiUserAction, Solution, WorldState } from '../types/types';
import { buildAssistantFallback } from '../utils/assistantFallback';

interface Props {
    aiAnalysis: AiAnalysis;
    assistantState: AiAssistantResponse;
    solution: Solution;
    worldState: WorldState;
    userAction: AiUserAction;
    explanation: string[];
    alerts: {
        severity: 'info' | 'warning' | 'critical';
        message: string;
    }[];
}

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

export default function AiChatPanel({ aiAnalysis, assistantState, solution, worldState, userAction, explanation, alerts }: Props) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [curMessage, setCurMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async () => {
        if (!curMessage.trim() || isSending) return;

        const nextUserMessage = curMessage.trim();
        setMessages((prevMessages) => [...prevMessages, { role: 'user', text: nextUserMessage }]);
        setCurMessage('');
        setIsSending(true);

        try {
            const response = await fetch('/api/assistant/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    worldState,
                    solution,
                    aiAnalysis,
                    userAction,
                    userMessage: nextUserMessage,
                }),
            });

            if (!response.ok) {
                throw new Error(`Assistant endpoint failed with ${response.status}`);
            }

            const assistantReply = (await response.json()) as AiAssistantResponse;
            setMessages((prevMessages) => [...prevMessages, { role: 'assistant', text: assistantReply.chat_answer }]);
        } catch {
            const fallbackReply = buildAssistantFallback(worldState, solution, aiAnalysis, nextUserMessage, userAction);
            setMessages((prevMessages) => [...prevMessages, { role: 'assistant', text: fallbackReply.chat_answer }]);
        } finally {
            setIsSending(false);
        }
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
                        {assistantState.summary}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                        <Chip size="small" label={`Provider: ${assistantState.model_info.provider}`} sx={{ color: '#fff' }} />
                        <Chip size="small" label={`Model: ${assistantState.model_info.model}`} sx={{ color: '#fff' }} />
                        {solution.objective && (
                            <Chip size="small" label={`Score: ${solution.objective.score}`} sx={{ color: '#fff' }} />
                        )}
                        {assistantState.insights.most_critical_node_id && (
                            <Chip size="small" label={`Critical: ${assistantState.insights.most_critical_node_id}`} sx={{ color: '#fff' }} />
                        )}
                    </Box>
                </Box>

                {[...alerts, ...assistantState.risks.map((risk) => ({ severity: risk.level === 'high' ? 'critical' : 'warning', message: risk.message }))].map((alert, index) => (
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
                    {assistantState.recommendations.map((recommendation, index) => (
                        <Typography key={`rec-${index}`} variant="body2" sx={{ color: '#fff', mb: 0.75, lineHeight: 1.5 }}>
                            {recommendation.type} for {recommendation.target_id}{' -> '}{recommendation.message}
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
                            alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '90%',
                            backgroundColor: 'rgba(183, 195, 243, 0.05)',
                            p: 2,
                            borderRadius: message.role === 'user' ? '16px 0px 16px 16px' : '0px 16px 16px 16px',
                            borderRight: message.role === 'user' ? '3px solid var(--periwinkle)' : 'none',
                            borderLeft: message.role === 'assistant' ? '3px solid var(--periwinkle)' : 'none',
                        }}
                    >
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {message.text}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{ p: 2, backgroundColor: 'rgba(64, 78, 92, 0.5)' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask what changed in the current logistics state"
                    variant="outlined"
                    value={curMessage}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            void handleSendMessage();
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
                        endAdornment: isSending ? (
                            <CircularProgress size={18} sx={{ color: 'var(--periwinkle)' }} />
                        ) : (
                            <IconButton onClick={() => void handleSendMessage()} size="small" sx={{ color: 'var(--periwinkle)' }}>
                                <SendIcon fontSize="small" />
                            </IconButton>
                        ),
                    }}
                />
            </Box>
        </Paper>
    );
}
