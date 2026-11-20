import { Navigate, useParams } from 'react-router-dom';
import { lazy } from 'react';

// Páginas cargadas bajo demanda: el bundle de cada módulo se baja solo al entrar
const Dashboard = lazy(() => import('./pages/Dashboard'));

const tituloSala = ({ selectedRoom }) =>
  selectedRoom ? `${selectedRoom.area.label} ${selectedRoom.plc}` : 'Monitor';

// El historial y la etiqueta digital pasaron a Elaboración: las rutas viejas redirigen
function LoteMovido() {
  const { id } = useParams();
  return <Navigate to={`/elaboracion/lotes/${id}`} replace />;
}

export const rutasMonitoreo = [
  {
    index: true,
    element: <Dashboard />,
    handle: { titulo: tituloSala, sub: ({ selectedRoom }) => selectedRoom?.key || '' },
  },
  { path: 'historial', element: <Navigate to="/elaboracion/historial" replace /> },
  { path: 'lotes/:id', element: <LoteMovido /> },
];
