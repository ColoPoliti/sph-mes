import { useEffect, useMemo, useState } from 'react';
import { faListCheck, faMagnifyingGlass, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LotesTable from '@/shared/components/LotesTable';
import { Card, CardTitulo, Campo, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import { INPUT } from '@/shared/components/clases';
import { mostrarInfoLote } from '../lib/alertasCalidad';
import { useAprobacionCalidad } from '../lib/useAprobacionCalidad';
import { SIN_REVISAR, useLotesCalidad } from '../lib/useLotesCalidad';
import { NIVELES, SEMAFORO_MIN, duracion, esperaSeg, nivel } from '../lib/semaforo';
import FiltroPeriodo from '../components/FiltroPeriodo';
import { EN_TABLA } from '@/shared/components/ui';

// Reloj que avanza cada segundo, para el temporizador de cuarentena
function useAhora(ms = 1000) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return ahora;
}

// Temporizador con el color del semáforo
function Temporizador({ seg }) {
  const n = nivel(seg);
  if (!n) return <span className="text-gray-600 dark:text-slate-300">Sin terminar</span>;
  const { chip, punto, texto } = NIVELES[n];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border border-current px-2.5 py-[3px] text-[15px] font-bold tabular-nums ${EN_TABLA} [td_&]:gap-1.5 ${chip}`}
      title={texto}
    >
      <span className={`h-2.5 w-2.5 flex-none rounded-full ${punto}`} aria-hidden="true" />
      {duracion(seg)}
      <span className="sr-only">({texto})</span>
    </span>
  );
}

/** Bandeja de liberación (cuarentena): tolvas elaboradas que Calidad todavía no revisó. */
export default function LotesPendientes() {
  const { filas, setFilas, cargando, error, periodo, setPeriodo } = useLotesCalidad(6);
  const { puedeAprobar, onAprobar } = useAprobacionCalidad(setFilas);
  const [texto, setTexto] = useState('');
  const [soloCompletas, setSoloCompletas] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const ahora = useAhora();

  // Pendientes con su espera; las más demoradas primero
  const pendientes = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return filas
      .filter(
        (l) =>
          SIN_REVISAR.includes(l.estado) &&
          (!soloCompletas || l.estado === 'completa') &&
          (!t || String(l.id).includes(t) || String(l.codigo_barra).includes(t) || l.nombre_producto?.toLowerCase().includes(t)),
      )
      .map((l) => ({ ...l, espera_s: esperaSeg(l, ahora) }))
      .sort((a, b) => (b.espera_s ?? -1) - (a.espera_s ?? -1));
  }, [filas, texto, soloCompletas, ahora]);

  const cuenta = (n) => pendientes.filter((l) => nivel(l.espera_s) === n).length;
  const visibles = filtroNivel === 'todos' ? pendientes : pendientes.filter((l) => nivel(l.espera_s) === filtroNivel);

  const botonNivel = (key, etiqueta, n, punto) => (
    <button
      key={key}
      type="button"
      aria-pressed={filtroNivel === key}
      onClick={() => setFiltroNivel(key)}
      className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${
        filtroNivel === key
          ? 'bg-slate-900 text-white dark:bg-teal-600'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {punto && <span className={`h-2.5 w-2.5 rounded-full ${punto}`} aria-hidden="true" />}
      {etiqueta} <span className="tabular-nums opacity-70">{n}</span>
    </button>
  );

  // N° de orden: posición del lote en la bandeja (1 = el más demorado); se mantiene al reordenar la tabla
  const nroItem = new Map(visibles.map((l, i) => [l.id, i + 1]));
  const columnaItem = {
    id: 'item',
    titulo: 'N° orden',
    alinear: 'center',
    valor: (l) => nroItem.get(l.id),
    clase: 'tabular-nums font-bold',
  };

  const columnaEspera = {
    id: 'espera',
    titulo: 'En cuarentena',
    valor: (l) => l.espera_s,
    celda: (l) => <Temporizador seg={l.espera_s} />,
    clase: 'whitespace-nowrap',
  };

  return (
    <div className="flex flex-col gap-6">
      <Encabezado titulo="Lotes a liberar" descripcion="Al aprobar o rechazar, el lote sale de la bandeja." icono={faListCheck} />

      <FiltroPeriodo periodo={periodo} setPeriodo={setPeriodo}>
        <Campo etiqueta="Buscar">
          <input type="search" className={INPUT} placeholder="Lote, código o producto" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </Campo>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={soloCompletas} onChange={(e) => setSoloCompletas(e.target.checked)} />
          Solo completas
        </label>
      </FiltroPeriodo>

      <Card className="flex flex-col gap-2.5">
        <CardTitulo icono={faMagnifyingGlass} extra={cargando ? 'Buscando…' : `${visibles.length} lotes`}>
          Pendientes de revisión
        </CardTitulo>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por demora">
          <FontAwesomeIcon icon={faStopwatch} className="text-gray-400" aria-hidden="true" />
          {botonNivel('todos', 'Todos', pendientes.length)}
          {botonNivel('verde', `Menos de ${SEMAFORO_MIN.amarillo} min`, cuenta('verde'), NIVELES.verde.punto)}
          {botonNivel('amarillo', `${SEMAFORO_MIN.amarillo} a ${SEMAFORO_MIN.rojo} min`, cuenta('amarillo'), NIVELES.amarillo.punto)}
          {botonNivel('rojo', `Más de ${SEMAFORO_MIN.rojo} min`, cuenta('rojo'), NIVELES.rojo.punto)}
        </div>

        <EstadoConsulta
          error={error}
          vacio={!cargando && !visibles.length}
          textoVacio={pendientes.length ? 'Ningún lote en ese rango de demora.' : 'No hay lotes pendientes en el período.'}
        />
        {visibles.length > 0 && (
          <LotesTable
            filas={visibles}
            conSala
            minWidth={puedeAprobar ? 1080 : 920}
            onAprobar={puedeAprobar ? onAprobar : undefined}
            onInfo={mostrarInfoLote}
            rutaLote={(id) => `/calidad/lotes/${id}`}
            columnasMedio={[columnaItem]}
            columnasExtra={[columnaEspera]}
            buscador={false}
            exportar="lotes-a-liberar.csv"
          />
        )}
        <Nota>
          El tiempo en cuarentena se cuenta desde el fin de la elaboración. Las más demoradas aparecen primero.
        </Nota>
        {!puedeAprobar && <Nota>Tu perfil es de consulta: solo Calidad o el administrador pueden aprobar.</Nota>}
      </Card>
    </div>
  );
}
