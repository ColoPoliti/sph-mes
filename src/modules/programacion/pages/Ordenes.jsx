import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faArrowsRotate,
  faBarcode,
  faClipboardList,
  faMagnifyingGlass,
  faRightLeft,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitulo, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import DataTable from '@/shared/components/DataTable';
import { BOTON, INPUT } from '@/shared/components/clases';
import { Chip } from '@/shared/components/ui';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { useSesion } from '@/shared/lib/auth';
import { confirmar, toast } from '@/shared/lib/alertas';
import { num } from '@/shared/lib/format';
import { asignarTolva, getOrdenesBejerman, moverOrden, porLinea, reasignarLinea } from '../lib/api';
import { TAMANOS_TOLVA } from '@/modules/administracion/lib/api';
import { cantidad, fecha } from '../lib/formato';
import { ESTADOS_REVISION, estadoRevision } from '../lib/revision';
import ChipRevision from '../components/ChipRevision';
import Tooltip from '@/shared/components/Tooltip';

const BOTON_ICONO =
  'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

export default function Ordenes() {
  const { usuario, puede } = useSesion();
  const puedeCambiar = puede('programacion.priorizar');
  const { datos, cargando, error, recargar } = useConsulta(getOrdenesBejerman, [], { inicial: [] });

  // Los cambios de prioridad/línea se guardan aparte: "rev" vuelve a armar las colas
  const [rev, setRev] = useState(0);
  const lineas = useMemo(() => porLinea(datos), [datos, rev]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtro de línea en la URL (?linea=2): se puede compartir y sobrevive al recargar
  const [params, setParams] = useSearchParams();
  const lineaSel = params.get('linea') || 'todas';
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    return lineas
      .filter((g) => lineaSel === 'todas' || g.linea === lineaSel)
      .map((g) => ({
        ...g,
        filas: g.ordenes.filter(
          (o) =>
            !t ||
            [o.numero, o.producto, o.codigo_barras, o.lote].some((v) => String(v ?? '').toLowerCase().includes(t)),
        ),
      }));
  }, [lineas, lineaSel, busqueda]);

  const total = lineas.reduce((n, g) => n + g.ordenes.length, 0);

  const mover = async (grupo, i, hacia) => {
    await moverOrden(grupo.linea, grupo.ordenes.map((o) => o.numero), i, hacia);
    setRev((r) => r + 1);
  };

  const cambiarLinea = async (orden, nueva) => {
    if (nueva === orden.linea) return;
    const ok = await confirmar({
      titulo: `¿Pasar la orden ${orden.numero} a la línea ${nueva}?`,
      texto: 'Queda última en la cola de la línea destino.',
      confirmar: 'Reasignar',
    });
    if (!ok) return;
    const destino = lineas.find((g) => g.linea === nueva);
    await reasignarLinea(orden, nueva, destino ? destino.ordenes.map((o) => o.numero) : [], usuario);
    setRev((r) => r + 1);
    toast(`Orden ${orden.numero} reasignada a la línea ${nueva}`);
  };

  const cambiarTolva = async (orden, kg) => {
    await asignarTolva(orden.numero, kg);
    setRev((r) => r + 1);
    toast(`Orden ${orden.numero}: tolva de ${kg} kg`);
  };

  const filtro = (key, label, n) => (
    <button
      key={key}
      type="button"
      aria-pressed={lineaSel === key}
      onClick={() => setParams(key === 'todas' ? {} : { linea: key })}
      className={`min-h-9 cursor-pointer rounded-lg px-3 text-sm font-bold transition-colors ${
        lineaSel === key
          ? 'bg-slate-900 text-white dark:bg-teal-600'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {label} <span className="tabular-nums opacity-70">{n}</span>
    </button>
  );

  // Columnas de la cola de una línea. Las flechas se apagan si la tabla está ordenada por otra
  // columna: la fila no quedaría junto a la orden con la que intercambia prioridad.
  const columnasDe = (g) => [
    {
      id: 'prioridad',
      titulo: 'Prioridad',
      valor: (o) => o.prioridad,
      clase: 'text-[18px] font-extrabold tabular-nums text-teal-600 dark:text-teal-400',
    },
    {
      id: 'numero',
      titulo: 'N° producción',
      valor: (o) => o.numero,
      celda: (o) => (
        <>
          {o.numero}
          {o.reasignacion && (
            <span className="ml-2" title={`Reasignada por ${o.reasignacion.usuario}`}>
              <Chip tipo="inc" icono={faRightLeft}>
                Línea original {o.linea_bejerman}
              </Chip>
            </span>
          )}
        </>
      ),
      clase: 'codigo font-bold tabular-nums',
    },
    { id: 'producto', titulo: 'Producto', valor: (o) => o.producto },
    {
      id: 'codigo',
      titulo: 'Código de barras',
      valor: (o) => o.codigo_barras,
      celda: (o) => (
        <>
          <FontAwesomeIcon icon={faBarcode} className="mr-2 text-gray-400" aria-hidden="true" />
          {o.codigo_barras || '—'}
        </>
      ),
      clase: 'codigo whitespace-nowrap tabular-nums',
    },
    { id: 'cantidad', titulo: 'Cantidad', alinear: 'right', valor: (o) => num(o.cantidad), celda: (o) => cantidad(o.cantidad), clase: 'font-bold tabular-nums' },
    {
      id: 'tolva',
      titulo: 'Tolva',
      valor: (o) => o.tolva_kg,
      celda: (o) =>
        puedeCambiar ? (
          <>
            <label className="sr-only" htmlFor={`tolva-${o.numero}`}>
              Tamaño de tolva de la orden {o.numero}
            </label>
            <select
              id={`tolva-${o.numero}`}
              className={`${INPUT} !min-h-9 w-auto py-1 text-sm`}
              value={o.tolva_kg ?? ''}
              onChange={(e) => cambiarTolva(o, e.target.value)}
            >
              {o.tolva_kg === null && <option value="">Sin definir</option>}
              {TAMANOS_TOLVA.map((t) => (
                <option key={t} value={t}>
                  {t} kg
                </option>
              ))}
            </select>
          </>
        ) : o.tolva_kg ? (
          `${o.tolva_kg} kg`
        ) : (
          <Chip tipo="inc">Sin definir</Chip>
        ),
      clase: 'whitespace-nowrap tabular-nums',
    },
    { id: 'lote', titulo: 'Lote', valor: (o) => o.lote, clase: 'codigo tabular-nums' },
    {
      id: 'vencimiento',
      titulo: 'Vencimiento',
      valor: (o) => o.vencimiento,
      texto: (o) => fecha(o.vencimiento),
      celda: (o) => fecha(o.vencimiento),
      clase: 'tabular-nums',
    },
    {
      id: 'calidad',
      titulo: 'Calidad',
      valor: (o) => ESTADOS_REVISION[estadoRevision(o)]?.texto,
      celda: (o) => <ChipRevision orden={o} />,
      clase: 'whitespace-nowrap',
    },
    ...(puedeCambiar
      ? [
          {
            id: 'cambiar',
            titulo: 'Cambiar',
            alinear: 'right',
            celda: (o, { orden }) => {
              const i = o.prioridad - 1;
              const bloqueada = Boolean(orden) && orden.id !== 'prioridad';
              const aviso = bloqueada ? 'Quitá el orden por columna para cambiar la prioridad' : undefined;
              return (
                <span className="inline-flex items-center gap-1.5">
                  <Tooltip className="contents" texto={aviso || 'Subir la prioridad'}>
                    <button
                      type="button"
                      className={BOTON_ICONO}
                      onClick={() => mover(g, i, i - 1)}
                      disabled={i === 0 || bloqueada}
                      aria-label={`Subir la prioridad de la orden ${o.numero}`}
                    >
                      <FontAwesomeIcon icon={faArrowUp} aria-hidden="true" />
                    </button>
                  </Tooltip>
                  <Tooltip className="contents" texto={aviso || 'Bajar la prioridad'}>
                  <button
                    type="button"
                    className={BOTON_ICONO}
                    onClick={() => mover(g, i, i + 1)}
                    disabled={i === g.ordenes.length - 1 || bloqueada}
                    aria-label={`Bajar la prioridad de la orden ${o.numero}`}
                  >
                    <FontAwesomeIcon icon={faArrowDown} aria-hidden="true" />
                  </button>
                  </Tooltip>
                  <label className="sr-only" htmlFor={`linea-${o.numero}`}>
                    Línea de la orden {o.numero}
                  </label>
                  <select
                    id={`linea-${o.numero}`}
                    className={`${INPUT} !min-h-9 w-auto py-1 text-sm`}
                    value={o.linea}
                    onChange={(e) => cambiarLinea(o, e.target.value)}
                    disabled={lineas.length < 2}
                  >
                    {lineas.map((l) => (
                      <option key={l.linea} value={l.linea}>
                        Línea {l.linea}
                      </option>
                    ))}
                  </select>
                </span>
              );
            },
            clase: 'whitespace-nowrap',
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Órdenes de producción"
        descripcion="Leídas de Bejerman · prioridad por línea de elaboración"
        icono={faClipboardList}
        acciones={
          <button type="button" className={BOTON.secundario} onClick={recargar} disabled={cargando}>
            <FontAwesomeIcon icon={faArrowsRotate} aria-hidden="true" />
            Actualizar
          </button>
        }
      />

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filtro('todas', 'Todas', total)}
          {lineas.map((g) => filtro(g.linea, `Línea ${g.linea}`, g.ordenes.length))}
          <label className="relative ml-auto w-full sm:w-72">
            <span className="sr-only">Buscar</span>
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="N° de producción, producto, CB o lote…"
              className={`${INPUT} pl-9`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>
        </div>
        <Nota>
          Una orden sale a Elaboración recién cuando Calidad aprueba sus cantidades. La prioridad está
          dada por la numeración en cada línea.{' '}
          {puedeCambiar
            ? 'Podés modificarla con las flechas o reasignar la orden a otra línea.'
            : 'Solo Producción o el administrador pueden modificarla o reasignar la orden a otra línea.'}
        </Nota>
        <EstadoConsulta cargando={cargando && !total} error={error} vacio={!total} textoVacio="No hay órdenes de producción." />
      </Card>

      {visibles.map((g) => (
        <Card key={g.linea} className="flex flex-col gap-3">
          <CardTitulo icono={faClipboardList} extra={`${g.ordenes.length} órdenes`}>
            Línea {g.linea}
          </CardTitulo>
          <EstadoConsulta vacio={!g.filas.length} textoVacio="Ninguna orden cumple con la búsqueda." />

          {g.filas.length > 0 && (
            <DataTable
              titulo={`Órdenes de producción de la línea ${g.linea}`}
              columnas={columnasDe(g)}
              filas={g.filas}
              clave={(o) => o.numero}
              minWidth={1160}
              buscador={false}
              porPagina={25}
              exportar={`ordenes-linea-${g.linea}.csv`}
            />
          )}
        </Card>
      ))}
    </div>
  );
}
