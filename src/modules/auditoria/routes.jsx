import { lazy } from 'react';

const TolvasControlar = lazy(() => import('./pages/TolvasControlar'));
// La etiqueta digital es la de Elaboración: Auditoría la abre dentro de su sección (sin pedir elaboracion.ver)
const EtiquetaDigital = lazy(() => import('@/modules/elaboracion/pages/EtiquetaDigital'));

const SUB = 'Auditoría';

// El permiso de lectura (auditoria.ver) lo controla el router.
export const rutasAuditoria = [
  { index: true, element: <TolvasControlar />, handle: { titulo: 'Tolvas a controlar', sub: SUB } },
  { path: 'lotes/:id', element: <EtiquetaDigital />, handle: { titulo: 'Etiqueta digital', sub: SUB } },
];
