import { lazy } from 'react';

const TolvasLinea = lazy(() => import('./pages/TolvasLinea'));

const SUB = 'Producción';

// El permiso de lectura (produccion.ver) lo controla el router.
export const rutasProduccion = [
  { index: true, element: <TolvasLinea />, handle: { titulo: 'Tolvas por línea', sub: SUB } },
];
