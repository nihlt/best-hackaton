import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './components/App'
import { ThemeProvider } from '@mui/material/styles'
import theme from './styles/theme'
import 'leaflet/dist/leaflet.css';
createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
    <StrictMode>
      <App />
    </StrictMode>,
  </ThemeProvider>
)
