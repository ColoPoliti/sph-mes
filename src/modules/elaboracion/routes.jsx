import { lazy } from 'react';

// "Órdenes a elaborar" (cola por línea) se quitó el 2026-11-19; está guardada en el commit 4474790.
const Elaboraciones = lazy(() => import('./pages/Elaboraciones'));
const Historial = lazy(() => import('./pages/Historial'));
const EtiquetaDigital = lazy(() => import('./pages/EtiquetaDigital'));

const SUB = 'Elaboración';

// El permiso de lectura (elaboracion.ver) lo controla el router.
// Las rutas fijas (historial, lotes) van antes de :area/:plc para que no se confundan con un PLC.
export const rutasElaboracion = [
  { index: true, element: <Elaboraciones />, handle: { titulo: 'Últimas elaboraciones', sub: 'Todos los PLC' } },
  { path: 'historial', element: <Historial />, handle: { titulo: 'Historial de elaboraciones', sub: 'Todos los PLC' } },
  { path: 'lotes/:id', element: <EtiquetaDigital />, handle: { titulo: 'Etiqueta digital', sub: SUB } },
  { path: ':area/:plc', element: <Elaboraciones />, handle: { titulo: 'Últimas elaboraciones', sub: SUB } },
];
