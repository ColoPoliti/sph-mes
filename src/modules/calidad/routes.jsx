import { lazy } from 'react';

const PanelCalidad = lazy(() => import('./pages/PanelCalidad'));
const LotesPendientes = lazy(() => import('./pages/LotesPendientes'));
const Decisiones = lazy(() => import('./pages/Decisiones'));
const IngresosMP = lazy(() => import('./pages/IngresosMP'));
// La etiqueta digital es la misma del monitor: Calidad la abre dentro de su sección
const EtiquetaDigital = lazy(() => import('@/modules/monitoreo/pages/EtiquetaDigital'));

const SUB = 'Calidad';

export const rutasCalidad = [
  { index: true, element: <PanelCalidad />, handle: { titulo: 'Panel de calidad', sub: SUB } },
  { path: 'pendientes', element: <LotesPendientes />, handle: { titulo: 'Lotes a liberar', sub: SUB } },
  { path: 'ingresos', element: <IngresosMP />, handle: { titulo: 'Ingresos de materia prima', sub: SUB } },
  { path: 'decisiones', element: <Decisiones />, handle: { titulo: 'Registro de decisiones', sub: SUB } },
  { path: 'lotes/:id', element: <EtiquetaDigital />, handle: { titulo: 'Etiqueta digital', sub: SUB } },
];
