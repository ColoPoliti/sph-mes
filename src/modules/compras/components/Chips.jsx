import { Chip } from '@/shared/components/ui';
import { ESTADOS_OC, ESTADOS_RECEPCION } from '../lib/estados';

function ChipDe({ mapa, estado }) {
  const e = mapa[estado] || { tipo: 'neutro', texto: estado };
  return (
    <Chip tipo={e.tipo} icono={e.icono} mayus>
      {e.texto}
    </Chip>
  );
}

export const ChipOC = ({ estado }) => <ChipDe mapa={ESTADOS_OC} estado={estado} />;
export const ChipRecepcion = ({ estado }) => <ChipDe mapa={ESTADOS_RECEPCION} estado={estado} />;

/** Barra de stock respecto del mínimo (rojo si está por debajo) */
export function BarraStock({ stock, minimo }) {
  const ref = Math.max(Number(minimo) * 2, Number(stock), 1);
  const pct = Math.min(100, (Number(stock) / ref) * 100);
  const marca = Math.min(100, (Number(minimo) / ref) * 100);
  const bajo = Number(stock) < Number(minimo);
  return (
    <div className="relative h-2.5 w-28 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800" aria-hidden="true">
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${bajo ? 'bg-red-500' : 'bg-teal-600 dark:bg-teal-400'}`}
        style={{ width: `${pct}%` }}
      />
      <div className="absolute inset-y-0 w-0.5 bg-gray-900/60 dark:bg-white/70" style={{ left: `${marca}%` }} />
    </div>
  );
}
