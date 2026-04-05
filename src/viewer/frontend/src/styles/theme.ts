import { createTheme } from '@mui/material/styles';
import type { Priority } from '../types/types';

const theme = createTheme({
    palette: {
        mode: 'dark', // Оскільки основний колір темний
        primary: {
            main: '#b7c3f3', // --periwinkle: Акценти, активні маршрути
            contrastText: '#404e5c',
        },
        secondary: {
            main: '#dd7596', // --petal-rouge: Другорядні кнопки/попередження
        },
        error: {
            main: '#cf1259', // --rosewood: Критичні алерти, блоки
        },
        background: {
            default: '#404e5c', // --charcoal-blue: Основний фон додатка
            paper: '#4f6272',   // --blue-slate: Картки, панелі, чат
        },
        text: {
            primary: '#ffffff',
            secondary: '#b7c3f3',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h6: {
            fontWeight: 600,
            color: '#b7c3f3',
        },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    backgroundColor: '#4f6272', // Використання Blue Slate
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none', // Для більш сучасного вигляду
                    fontWeight: 600,
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                filledError: {
                    backgroundColor: '#cf1259', // Rosewood для помилок
                },
            },
        },
    },
});

export default theme;


export const getPriorityColor = (priority: Priority | string | undefined): string => {
    switch (priority) {
        case 'critical':
            return 'var(--rosewood)';

        case 'high':
        case 'elevated':
            return 'var(--petal-rouge)';

        case 'medium':
        case 'normal':
            return 'var(--periwinkle)';

        case 'low':
            return "var(--success-green)"

        default:
            return 'var(--periwinkle)';
    }
};