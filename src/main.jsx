import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Inter incluida en el proyecto (funciona sin internet y trae las variantes de .codigo)
import 'inter-ui/inter-variable-latin.css';
import './index.css';
import { cargarEntorno } from '@/app/entorno';
import { ThemeProvider } from '@/shared/context/ThemeContext';

// Primero config.env (broker, API, credenciales) y recién después la app,
// porque los módulos de configuración leen esos valores al importarse.
cargarEntorno()
  .then(() => import('@/app/App'))
  .then(({ default: App }) => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </StrictMode>,
    );
  });
