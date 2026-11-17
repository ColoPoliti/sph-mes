import { lazy } from 'react';

const Ordenes = lazy(() => import('./pages/Ordenes'));

const SUB = 'Programación';

// El permiso de lectura (programacion.ver) lo controla el router.
export const rutasProgramacion = [
  { index: true, element: <Ordenes />, handle: { titulo: 'Órdenes de producción', sub: SUB } },
];
