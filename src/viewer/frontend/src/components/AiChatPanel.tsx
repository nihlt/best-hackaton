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

const RECOMMENDATION_TYPE_LABELS: Record<string, string> = {
    reroute: '🔀 Reroute',
    reprioritize: '🔺 Reprioritize',
    rebalance: '⚖️ Rebalance',
    monitor: '👁 Monitor',
};

const RISK_LEVEL_COLORS: Record<string, string> = {
    high: 'rgba(207, 18, 89, 0.1)',
    medium: 'rgba(221, 117, 150, 0.1)',
    low: 'rgba(183, 195, 243, 0.07)',
};

const RISK_LEVEL_BORDER: Record<string, string> = {
    high: 'var(--rosewood)',
    medium: 'var(--petal-rouge)',
    low: 'rgba(183, 195, 243, 0.3)',
};

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
                headers: { 'Content-Type': 'application/json' },
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

    type AlertItem = { severity: 'info' | 'warning' | 'critical'; message: string; riskLevel?: string };

    const allAlerts: AlertItem[] = [
        ...alerts,
        ...assistantState.risks.map((risk) => ({
            severity: risk.level === 'high' ? 'critical' as const : 'warning' as const,
            message: risk.message,
            riskLevel: risk.level,
        })),
    ];

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
            {/* Header */}
            <Box sx={{ p: 2, backgroundColor: 'rgba(183, 195, 243, 0.1)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToyIcon sx={{ color: 'var(--periwinkle)' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Pipeline Assistant
                </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(183, 195, 243, 0.2)' }} />

            {/* Scrollable content */}
            <Box
                sx={{
                    p: 2,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { display: 'none' },
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {/* AI Summary */}
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
                        {assistantState.insights.largest_eta_min > 0 && (
                            <Chip size="small" label={`Max ETA: ${assistantState.insights.largest_eta_min} min`} sx={{ color: '#fff' }} />
                        )}
                    </Box>
                </Box>

                {/* Alerts and Risks */}
                {allAlerts.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="overline" sx={{ color: 'var(--periwinkle)', fontWeight: 700, px: 0.5 }}>
                            Risks & Alerts
                        </Typography>
                        {allAlerts.map((alert, index) => {
                            const riskLevel = alert.riskLevel ?? (alert.severity === 'critical' ? 'high' : 'medium');
                            return (
                                <Box
                                    key={`alert-${index}`}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        backgroundColor: RISK_LEVEL_COLORS[riskLevel] ?? RISK_LEVEL_COLORS.medium,
                                        border: `1px solid ${RISK_LEVEL_BORDER[riskLevel] ?? RISK_LEVEL_BORDER.medium}`,
                                        display: 'flex',
                                        gap: 1,
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <WarningAmberIcon
                                        sx={{
                                            fontSize: 18,
                                            mt: 0.2,
                                            color: riskLevel === 'high' ? 'var(--rosewood)' : 'var(--petal-rouge)',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#fff', lineHeight: 1.5 }}>
                                        {alert.message}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {/* Recommendations */}
                {assistantState.recommendations.length > 0 && (
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
                        {assistantState.recommendations.map((rec, index) => (
                            <Box key={`rec-${index}`} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                                <Typography variant="caption" sx={{ color: 'var(--periwinkle)', fontWeight: 700, whiteSpace: 'nowrap', mt: 0.1 }}>
                                    {RECOMMENDATION_TYPE_LABELS[rec.type] ?? rec.type}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.5 }}>
                                    {rec.message}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Allocation Plan */}
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
                                {plan.vehicle_id}: {plan.quantity} × {plan.resource_id} — {plan.from_node_id} → {plan.to_node_id} ({plan.eta_min} min)
                            </Typography>
                        ))
                    ) : (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            No delivery allocations were generated.
                        </Typography>
                    )}
                </Box>

                {/* Unserved Demand */}
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
                                {item.node_id}: {item.quantity} × {item.resource_id} — {item.reason}
                            </Typography>
                        ))}
                    </Box>
                )}

                {/* Explanation messages from optimizer */}
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

                {/* Chat messages */}
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

            {/* Input */}
            <Box sx={{ p: 2, backgroundColor: 'rgba(64, 78, 92, 0.5)' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask about routes, demand, KPIs, or current state..."
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
