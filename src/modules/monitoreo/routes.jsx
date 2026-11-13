import { lazy } from 'react';

// Páginas cargadas bajo demanda: el bundle de cada módulo se baja solo al entrar
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Historial = lazy(() => import('./pages/Historial'));
const EtiquetaDigital = lazy(() => import('./pages/EtiquetaDigital'));

const tituloSala = ({ selectedRoom }) =>
  selectedRoom ? `${selectedRoom.area.label} ${selectedRoom.plc}` : 'Monitor';

export const rutasMonitoreo = [
  {
    index: true,
    element: <Dashboard />,
    handle: { titulo: tituloSala, sub: ({ selectedRoom }) => selectedRoom?.key || '' },
  },
  {
    path: 'historial',
    element: <Historial />,
    handle: { titulo: 'Historial de elaboraciones', sub: 'Todas las salas' },
  },
  {
    path: 'lotes/:id',
    element: <EtiquetaDigital />,
    handle: { titulo: 'Etiqueta digital', sub: 'Monitoreo' },
  },
];
