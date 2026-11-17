import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RequierePermiso from '@/shared/components/RequierePermiso';

const Recetas = lazy(() => import('./pages/Recetas'));
const RecetaForm = lazy(() => import('./pages/RecetaForm'));

const SUB = 'Administración';

// El permiso de lectura (admin.ver) lo controla el router; acá solo se protegen las altas.
export const rutasAdministracion = [
  { index: true, element: <Navigate to="tolvas" replace /> },
  { path: 'tolvas', element: <Recetas />, handle: { titulo: 'Maestro de tolvas', sub: SUB } },
  {
    path: 'tolvas/nueva',
    element: <RequierePermiso permiso="admin.editar"><RecetaForm /></RequierePermiso>,
    handle: { titulo: 'Nueva receta', sub: SUB },
  },
  {
    path: 'tolvas/:id/editar',
    element: <RequierePermiso permiso="admin.editar"><RecetaForm /></RequierePermiso>,
    handle: { titulo: 'Editar receta', sub: SUB },
  },
];
