// Gráficos chicos de las tarjetas de inicio. Cada valor también se puede leer sin pasar el mouse:
// en la leyenda, en los rótulos o en la lista para lectores de pantalla.
import { colorEstado, trazoEstado } from './colores';

const TEXTO_VACIO = 'm-0 text-center text-[14px] font-medium text-gray-600 dark:text-slate-300';

/** Globo que aparece al pasar el mouse por una marca (el contenedor lleva `group/marca relative`). */
function Globo({ children }) {
  return (
    <span
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap bg-slate-950 px-2 py-1 text-[13px] font-semibold text-white shadow-md group-hover/marca:block dark:bg-slate-700"
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/** Una barra dividida en partes de un total, con leyenda y valor de cada parte. */
function Segmentos({ segmentos, vacio }) {
  const total = segmentos.reduce((n, s) => n + s.valor, 0);
  if (!total) return <p className={TEXTO_VACIO}>{vacio}</p>;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-2 gap-0.5" aria-hidden="true">
        {segmentos
          .filter((s) => s.valor > 0)
          .map((s) => (
            <span key={s.clave} className="group/marca relative min-w-1 py-0" style={{ flexGrow: s.valor, flexBasis: 0 }}>
              <span className={`block h-2 rounded-full ${colorEstado(s.color)}`} />
              <Globo>
                {s.etiqueta}: {s.valor} ({Math.round((s.valor / total) * 100)}%)
              </Globo>
            </span>
          ))}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
        {segmentos.map((s) => (
          <li key={s.clave} className="flex items-center gap-1.5 text-[14px] font-medium text-gray-600 dark:text-slate-300">
            <span className={`h-2 w-2 flex-none rounded-full ${colorEstado(s.color)}`} aria-hidden="true" />
            {s.etiqueta}
            <span className="font-bold tabular-nums text-gray-900 dark:text-white">{s.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Porcentajes enteros que siempre suman 100 (el resto va a los de mayor parte decimal). */
function porcentajes(valores) {
  const total = valores.reduce((n, v) => n + v, 0);
  const exactos = valores.map((v) => (v / total) * 100);
  const enteros = exactos.map(Math.floor);
  const faltan = 100 - enteros.reduce((n, v) => n + v, 0);
  const orden = exactos.map((v, i) => [v - enteros[i], i]).sort((a, b) => b[0] - a[0]);
  orden.slice(0, faltan).forEach(([, i]) => {
    enteros[i] += 1;
  });
  return enteros;
}

const RADIO_DONA = 41;
const GROSOR_DONA = 16;
const SEPARACION_DONA = 1.5; // Espacio entre tramos, sobre un perímetro de 100
const TRAMO_MINIMO = 0.8; // Un tramo muy chico igual se tiene que ver

/** Tramos con valor, cada uno con su fracción de inicio y de fin. */
function armarTramos(segmentos, pcts) {
  const total = segmentos.reduce((n, s) => n + s.valor, 0);
  return segmentos
    .map((s, i) => ({ ...s, pct: pcts[i] }))
    .filter((s) => s.valor > 0)
    .reduce((lista, s) => {
      const desde = lista.length ? lista[lista.length - 1].hasta : 0;
      return [...lista, { ...s, desde, hasta: desde + s.valor / total }];
    }, []);
}

/** Gráfico de dona: el dato principal en el centro y el porcentaje de cada estado en la leyenda. */
function Dona({ segmentos, centro, vacio }) {
  const total = segmentos.reduce((n, s) => n + s.valor, 0);
  if (!total) return <p className={TEXTO_VACIO}>{vacio}</p>;

  const pcts = porcentajes(segmentos.map((s) => s.valor));
  const tramos = armarTramos(segmentos, pcts);
  const separacion = tramos.length > 1 ? SEPARACION_DONA : 0;
  const resumen = segmentos.map((s, i) => `${s.etiqueta}: ${s.valor} (${pcts[i]}%)`).join(', ');

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 100 100" className="h-48 w-48 flex-none" role="img" aria-label={`${centro.valor} ${centro.etiqueta}. ${resumen}`}>
        {/* pathLength 100: cada tramo se mide directamente en porcentaje del perímetro. Arranca arriba (rotación de -90°) */}
        <g transform="rotate(-90 50 50)">
          {tramos.map((t) => {
            const largo = Math.max((t.hasta - t.desde) * 100 - separacion, TRAMO_MINIMO);
            return (
              <circle
                key={t.clave}
                cx="50"
                cy="50"
                r={RADIO_DONA}
                fill="none"
                pathLength="100"
                strokeWidth={GROSOR_DONA}
                strokeDasharray={`${largo} ${100 - largo}`}
                strokeDashoffset={-(t.desde * 100 + separacion / 2)}
                className={trazoEstado(t.color)}
              >
                <title>{`${t.etiqueta}: ${t.valor} (${t.pct}%)`}</title>
              </circle>
            );
          })}
        </g>
        <text x="50" y="46" textAnchor="middle" dominantBaseline="central" fontSize="26" fontWeight="800" className="fill-gray-900 dark:fill-white" aria-hidden="true">
          {centro.valor}
        </text>
        <text x="50" y="64" textAnchor="middle" dominantBaseline="central" fontSize="7.5" className="fill-gray-500 uppercase dark:fill-slate-400" aria-hidden="true">
          {centro.etiqueta}
        </text>
      </svg>
      {/* Leyenda en una sola fila, con el mismo formato que los datos secundarios de las otras tarjetas */}
      <ul className="m-0 flex w-full list-none justify-between gap-2 border-t border-gray-200 p-0 pt-3 dark:border-white/[.12]">
        {segmentos.map((s, i) => (
          <li key={s.clave} className="flex min-w-0 flex-col items-center gap-0.5 text-center" title={`${s.etiqueta}: ${s.valor}`}>
            <span className="whitespace-nowrap text-[13px] font-medium leading-tight text-gray-600 dark:text-slate-300">{s.etiqueta}</span>
            <span className="flex items-center gap-1.5 text-[15px] font-extrabold leading-tight tabular-nums text-gray-900 dark:text-white">
              <span className={`h-2 w-2 flex-none rounded-full ${colorEstado(s.color)}`} aria-hidden="true" />
              {pcts[i]}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ALTO_COLUMNAS = 52;

const TONOS_COLUMNA = {
  teal: { fuerte: 'bg-teal-600 dark:bg-teal-400', suave: 'bg-teal-600/40 dark:bg-teal-400/35' },
  violeta: { fuerte: 'bg-violet-600 dark:bg-violet-400', suave: 'bg-violet-600/40 dark:bg-violet-400/35' },
};

/** Columnas de una sola serie. `rotulos`: 'todos' o 'ultimo' (el valor va arriba de esas columnas). */
function Columnas({ columnas, rotulos, color = 'teal', vacio }) {
  if (!columnas.length) return <p className={TEXTO_VACIO}>{vacio}</p>;
  const maximo = Math.max(...columnas.map((c) => c.valor), 1);

  return (
    <div className="flex flex-col gap-1.5">
      <ul className="sr-only">
        {columnas.map((c) => (
          <li key={c.clave}>{c.detalle}</li>
        ))}
      </ul>
      <div className="flex items-end gap-1 border-b border-gray-200 dark:border-white/[.12]" aria-hidden="true">
        {columnas.map((c, i) => {
          const ultimo = i === columnas.length - 1;
          const conRotulo = rotulos === 'todos' || ultimo;
          // Con rótulo 'ultimo' se resalta el día actual y el resto queda más suave
          const tono = TONOS_COLUMNA[color][rotulos === 'ultimo' && !ultimo ? 'suave' : 'fuerte'];
          return (
            <div key={c.clave} className="group/marca relative flex min-w-0 flex-1 flex-col items-center justify-end" style={{ height: ALTO_COLUMNAS + 18 }}>
              {conRotulo && <span className="mb-0.5 text-[13px] font-bold tabular-nums text-gray-900 dark:text-white">{c.valor}</span>}
              <span
                className={`block w-full max-w-6 rounded-t ${c.valor > 0 ? tono : 'bg-gray-300 dark:bg-slate-600'}`}
                style={{ height: c.valor > 0 ? Math.max(4, (c.valor / maximo) * ALTO_COLUMNAS) : 2 }}
              />
              <Globo>{c.detalle}</Globo>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {columnas.map((c) => (
          <span key={c.clave} className="min-w-0 flex-1 truncate text-center text-[13px] font-medium text-gray-600 dark:text-slate-300">
            {c.etiqueta}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Avance de una parte sobre un total. */
function Medidor({ titulo, valor, total, vacio }) {
  if (!total) return <p className={TEXTO_VACIO}>{vacio}</p>;
  const pct = Math.round((valor / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] font-medium tabular-nums text-gray-600 dark:text-slate-300">
          {valor} de {total}
        </span>
        <span className="text-[15px] font-extrabold tabular-nums text-gray-900 dark:text-white">{pct}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700"
        role="progressbar"
        aria-label={titulo}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={valor}
      >
        <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** PLC en ejecución, en vivo, con la etapa y su avance. */
function ListaPlc({ plcs }) {
  if (!plcs.length) return <p className={TEXTO_VACIO}>Ningún PLC en ejecución.</p>;

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {plcs.map((p) => (
        <li key={p.clave} className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-[14px]">
            <span className={`h-2 w-2 flex-none rounded-full ${colorEstado(p.estado)}`} aria-hidden="true" />
            <span className="flex-none font-bold text-gray-900 dark:text-white">{p.nombre}</span>
            <span className="ml-auto min-w-0 truncate font-medium text-gray-600 dark:text-slate-300" title={p.detalle}>
              {p.texto}
            </span>
          </span>
          {p.avance !== null && (
            <span className="block h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700" aria-hidden="true">
              <span className="block h-full rounded-full bg-emerald-600" style={{ width: `${Math.round(p.avance * 100)}%` }} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const TIPOS = { segmentos: Segmentos, dona: Dona, columnas: Columnas, medidor: Medidor, plcs: ListaPlc };

export default function Grafico({ tipo, ...props }) {
  const Componente = TIPOS[tipo];
  return <Componente {...props} />;
}
