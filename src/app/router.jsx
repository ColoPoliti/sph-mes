import { Navigate, Outlet, createBrowserRouter, useParams } from 'react-router-dom';
import { MonitorProvider } from '@/modules/monitoreo/context/MonitorContext';
import Layout from '@/shared/layout/Layout';
import RequierePermiso from '@/shared/components/RequierePermiso';
import ErrorRuta from '@/pages/ErrorRuta';
import Inicio from '@/pages/Inicio';
import { rutasMonitoreo } from '@/modules/monitoreo/routes';
import { rutasCalidad } from '@/modules/calidad/routes';
import { rutasCompras } from '@/modules/compras/routes';

// La conexión MQTT vive arriba de todo: el estado de planta sigue en vivo aunque
// se navegue a Calidad o Compras (y la barra de estado lo muestra siempre).
function Raiz() {
  return (
    <MonitorProvider>
      <Outlet />
    </MonitorProvider>
  );
}

// Rutas viejas del monitor (sph-monitoreo) -> nuevas, para no romper links guardados
function LoteViejo() {
  const { id } = useParams();
  return <Navigate to={`/monitoreo/lotes/${id}`} replace />;
}

export const router = createBrowserRouter([
  {
    element: <Raiz />,
    errorElement: <ErrorRuta />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Inicio />, handle: { titulo: 'Inicio', sub: 'MES · Saphirus' } },
          { path: 'monitoreo', children: rutasMonitoreo },
          {
            path: 'calidad',
            element: <RequierePermiso permiso="calidad.ver" />,
            children: rutasCalidad,
          },
          {
            path: 'compras',
            element: <RequierePermiso permiso="compras.ver" />,
            children: rutasCompras,
          },

          { path: 'historial', element: <Navigate to="/monitoreo/historial" replace /> },
          { path: 'lotes/:id', element: <LoteViejo /> },
          { path: '*', element: <ErrorRuta noEncontrada /> },
        ],
      },
    ],
  },
]);
