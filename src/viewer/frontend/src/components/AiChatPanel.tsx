import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Divider, IconButton, Paper, TextField, Typography } from "@mui/material";
import { useState } from 'react';

interface Props {
    explanation: string[],
    alerts: {
        severity: 'info' | 'warning' | 'critical';
        type: string;
        message: string;
        target_id: string
    }[];
}

export default function AiChatPanel({ explanation, alerts }: Props) {
    const [messages, setMessages] = useState<string[]>([])
    const [curMessage, setCurMessage] = useState("")
    const handleSendMessage = () => {
        console.log(curMessage)
        if (!curMessage.trim()) return;
        setMessages(prevMessages => [...prevMessages, curMessage]);
        // callToApi()
        setCurMessage("")
    }

    return (
        <Paper sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--blue-slate)',
            borderRadius: 4,
            border: '1px solid var(--periwinkle)',
            overflow: 'hidden',
            flex: 1
        }}>

            <Box sx={{ p: 2, backgroundColor: 'rgba(183, 195, 243, 0.1)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToyIcon sx={{ color: 'var(--periwinkle)' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Gemini Assistant</Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(183, 195, 243, 0.2)' }} />


            <Box sx={{
                p: 2,
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                    display: 'none',
                },
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}>


                {alerts && alerts.map((alert, index) => {
                    // Визначаємо стилі на основі severity
                    const isCritical = alert.severity === 'critical';
                    const isWarning = alert.severity === 'warning';

                    // Вибір кольору: rosewood для критичних, petal-rouge для попереджень, periwinkle для інфо
                    const accentColor = isCritical
                        ? 'var(--rosewood)'
                        : isWarning
                            ? 'var(--petal-rouge)'
                            : 'var(--periwinkle)';

                    const bgColor = isCritical
                        ? 'rgba(207, 18, 89, 0.1)'
                        : 'rgba(221, 117, 150, 0.1)';

                    return (
                        <Box key={`alert-${index}`} sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: bgColor,
                            border: `1px solid ${accentColor}`,
                            display: 'flex',
                            flexDirection: 'column', // Змінюємо на колонку для кращої структури
                            gap: 0.5
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WarningAmberIcon sx={{ fontSize: 18, color: accentColor }} />
                                <Typography variant="caption" sx={{ fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>
                                    {alert.type.replace('_', ' ')} {alert.target_id ? `| ${alert.target_id}` : ''}
                                </Typography>
                            </Box>

                            <Typography variant="body2" sx={{ color: '#fff', opacity: 0.9, lineHeight: 1.4 }}>
                                {alert.message}
                            </Typography>
                        </Box>
                    );
                })}


                {explanation && explanation.map((text, index) => (
                    <Box key={`exp-${index}`} sx={{
                        alignSelf: 'flex-start',
                        maxWidth: '90%',
                        backgroundColor: 'rgba(183, 195, 243, 0.05)',
                        p: 2,
                        borderRadius: '0px 16px 16px 16px',
                        borderLeft: '3px solid var(--periwinkle)'
                    }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {text}
                        </Typography>
                    </Box>
                ))}
                {messages && messages.map((m, index) => (
                    <Box key={`exp-${index}`} sx={{
                        alignSelf: 'flex-end',
                        maxWidth: '90%',
                        backgroundColor: 'rgba(183, 195, 243, 0.05)',
                        p: 2,
                        borderRadius: '0px 16px 16px 16px',
                        borderLeft: '3px solid var(--periwinkle)'
                    }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {m}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Input Area - Для команд користувача */}
            <Box sx={{ p: 2, backgroundColor: 'rgba(64, 78, 92, 0.5)' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Напишіть команду"
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
                        }
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
    )
}