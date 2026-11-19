import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Inter incluida en el proyecto (funciona sin internet y trae las variantes de .codigo)
import 'inter-ui/inter-variable-latin.css';
import './index.css';
import App from '@/app/App';
import { ThemeProvider } from '@/shared/context/ThemeContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
