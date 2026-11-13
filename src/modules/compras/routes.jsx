import { lazy } from 'react';
import RequierePermiso from '@/shared/components/RequierePermiso';

const PanelCompras = lazy(() => import('./pages/PanelCompras'));
const Ordenes = lazy(() => import('./pages/Ordenes'));
const OrdenForm = lazy(() => import('./pages/OrdenForm'));
const OrdenDetalle = lazy(() => import('./pages/OrdenDetalle'));
const MateriasPrimas = lazy(() => import('./pages/MateriasPrimas'));
const Proveedores = lazy(() => import('./pages/Proveedores'));
const Recepciones = lazy(() => import('./pages/Recepciones'));

const SUB = 'Compras';

// El permiso de lectura (compras.ver) lo controla el router; acá solo se protegen las altas.
export const rutasCompras = [
  { index: true, element: <PanelCompras />, handle: { titulo: 'Panel de compras', sub: SUB } },
  { path: 'ordenes', element: <Ordenes />, handle: { titulo: 'Órdenes de compra', sub: SUB } },
  {
    path: 'ordenes/nueva',
    element: <RequierePermiso permiso="compras.editar"><OrdenForm /></RequierePermiso>,
    handle: { titulo: 'Nueva orden de compra', sub: SUB },
  },
  { path: 'ordenes/:id', element: <OrdenDetalle />, handle: { titulo: 'Orden de compra', sub: SUB } },
  {
    path: 'ordenes/:id/editar',
    element: <RequierePermiso permiso="compras.editar"><OrdenForm /></RequierePermiso>,
    handle: { titulo: 'Editar orden de compra', sub: SUB },
  },
  { path: 'materias-primas', element: <MateriasPrimas />, handle: { titulo: 'Materias primas', sub: SUB } },
  { path: 'proveedores', element: <Proveedores />, handle: { titulo: 'Proveedores', sub: SUB } },
  { path: 'recepciones', element: <Recepciones />, handle: { titulo: 'Recepciones', sub: SUB } },
];
