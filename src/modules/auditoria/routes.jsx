import { lazy } from 'react';

const TolvasControlar = lazy(() => import('./pages/TolvasControlar'));

const SUB = 'Auditoría';

// El permiso de lectura (auditoria.ver) lo controla el router.
export const rutasAuditoria = [
  { index: true, element: <TolvasControlar />, handle: { titulo: 'Tolvas a controlar', sub: SUB } },
];
