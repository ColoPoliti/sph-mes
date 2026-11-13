import { useMatches } from 'react-router-dom';
import { useMonitor } from '@/modules/monitoreo/context/MonitorContext';

/**
 * Título de la vista actual, tomado del `handle` de la ruta más profunda que lo tenga:
 *   handle: { titulo: 'Órdenes de compra', sub: 'Compras' }
 * titulo/sub también pueden ser funciones que reciben el contexto del monitor
 * (ej.: el nombre de la sala seleccionada).
 * Lo usan el badge del TopBar (escritorio) y el de mobile en el Layout.
 */
export function useTituloVista() {
  const monitor = useMonitor();
  const matches = useMatches();
  const handle = [...matches].reverse().find((m) => m.handle?.titulo)?.handle;
  if (!handle) return { titulo: 'MES', sub: '' };
  const valor = (v) => (typeof v === 'function' ? v(monitor) : v || '');
  return { titulo: valor(handle.titulo), sub: valor(handle.sub) };
}
