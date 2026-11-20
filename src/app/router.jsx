import { Navigate, Outlet, createBrowserRouter, useParams } from 'react-router-dom';
import { MonitorProvider } from '@/modules/monitoreo/context/MonitorContext';
import Layout from '@/shared/layout/Layout';
import RequierePermiso from '@/shared/components/RequierePermiso';
import ErrorRuta from '@/pages/ErrorRuta';
import Inicio from '@/pages/Inicio';
import { rutasProgramacion } from '@/modules/programacion/routes';
import { rutasMonitoreo } from '@/modules/monitoreo/routes';
import { rutasCalidad } from '@/modules/calidad/routes';
import { rutasCompras } from '@/modules/compras/routes';
import { rutasElaboracion } from '@/modules/elaboracion/routes';
import { rutasProduccion } from '@/modules/produccion/routes';
import { rutasAuditoria } from '@/modules/auditoria/routes';
import { rutasAdministracion } from '@/modules/administracion/routes';

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
  return <Navigate to={`/elaboracion/lotes/${id}`} replace />;
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
          {
            path: 'programacion',
            element: <RequierePermiso permiso="programacion.ver" />,
            children: rutasProgramacion,
          },
          { path: 'monitoreo', children: rutasMonitoreo },
          {
            path: 'calidad',
            element: <RequierePermiso permiso="calidad.ver" />,
            children: rutasCalidad,
          },
          {
            path: 'elaboracion',
            element: <RequierePermiso permiso="elaboracion.ver" />,
            children: rutasElaboracion,
          },
          {
            path: 'produccion',
            element: <RequierePermiso permiso="produccion.ver" />,
            children: rutasProduccion,
          },
          {
            path: 'auditoria',
            element: <RequierePermiso permiso="auditoria.ver" />,
            children: rutasAuditoria,
          },
          {
            path: 'compras',
            element: <RequierePermiso permiso="compras.ver" />,
            children: rutasCompras,
          },
          {
            path: 'administracion',
            element: <RequierePermiso permiso="admin.ver" />,
            children: rutasAdministracion,
          },

          { path: 'historial', element: <Navigate to="/elaboracion/historial" replace /> },
          { path: 'lotes/:id', element: <LoteViejo /> },
          { path: '*', element: <ErrorRuta noEncontrada /> },
        ],
      },
    ],
  },
]);
