import { lazy } from 'react';

const OrdenesElaborar = lazy(() => import('./pages/OrdenesElaborar'));

const SUB = 'Elaboración';

// El permiso de lectura (elaboracion.ver) lo controla el router.
export const rutasElaboracion = [
  { index: true, element: <OrdenesElaborar />, handle: { titulo: 'Órdenes a elaborar', sub: SUB } },
];
