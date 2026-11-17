import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate,
  faBarcode,
  faClipboardList,
  faFlask,
  faMagnifyingGlass,
  faStamp,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitulo, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import { BOTON, INPUT, TD, TH } from '@/shared/components/clases';
import { Chip } from '@/shared/components/ui';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { CLASES, alerta, esc } from '@/shared/lib/alertas';
import { useSesion } from '@/shared/lib/auth';
import { getOrdenesBejerman, porLinea } from '@/modules/programacion/lib/api';
import { cantidad, fecha } from '@/modules/programacion/lib/formato';
import { ESTADOS_REVISION, estadoRevision, quitarRevision, registrarRevision } from '@/modules/programacion/lib/revision';
import ChipRevision from '@/modules/programacion/components/ChipRevision';
import { BASE_KG, INSUMOS, aPantalla, escalar, getRecetas, totalKg } from '@/modules/administracion/lib/api';
import { confirmarQuitarAprobacion, preguntarDecision, toastCalidad } from '../lib/alertasCalidad';

const FILTROS = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aprobado', label: 'Aprobadas' },
  { key: 'rechazado', label: 'Rechazadas' },
  { key: 'todas', label: 'Todas' },
];

// Receta del maestro de tolvas para el código de la orden, escalada a su tolva (en un modal)
function verReceta(orden, receta) {
  const kg = orden.tolva_kg || BASE_KG;
  const insumos = escalar(receta, kg);
  const filas = INSUMOS.map((i) => {
    const ins = insumos.find((x) => x.etapa === i.etapa);
    const valor = aPantalla(ins?.sp, i.unidad);
    return `<tr class="border-t border-gray-200 dark:border-slate-800">
      <th class="py-2 pr-3 text-left text-[13px] font-bold uppercase tracking-[0.6px] text-gray-500 dark:text-slate-400">${esc(i.nombre)}</th>
      <td class="py-2 pr-3 text-left text-gray-500 dark:text-slate-400">${esc(ins?.codigo_mp || '')}</td>
      <td class="py-2 text-right font-bold tabular-nums text-gray-900 dark:text-white">${esc(cantidad(valor))} ${esc(i.unidad)}</td>
    </tr>`;
  }).join('');
  return alerta.fire({
    title: `Receta ${esc(receta.codigo_barra)}`,
    html: `<p class="m-0 mb-2">${esc(receta.producto?.nombre)} · orden ${esc(orden.numero)}</p>
      <p class="m-0 mb-2 font-bold">Por tolva de ${kg} kg${
        orden.tolva_kg ? '' : ' (la orden todavía no tiene tamaño de tolva: se muestra la receta base)'
      }</p>
      <table class="w-full text-[16px]"><tbody>${filas}
        <tr class="border-t-2 border-gray-300 dark:border-slate-700">
          <th colspan="2" class="py-2 text-left font-bold">Total</th>
          <td class="py-2 text-right font-bold tabular-nums">${esc(cantidad(totalKg(insumos)))} kg</td>
        </tr>
      </tbody></table>`,
    confirmButtonText: 'Cerrar',
    customClass: { ...CLASES, confirmButton: CLASES.cancelButton },
    width: 520,
  });
}

/**
 * Primera revisión de Calidad: controla las cantidades de cada orden programada antes de que
 * salga a Elaboración. (La segunda revisión, sobre lo elaborado, es "Lotes a liberar".)
 */
export default function OrdenesRevisar() {
  const { usuario, puede } = useSesion();
  const puedeAprobar = Boolean(usuario) && puede('calidad.aprobar');

  const { datos, cargando, error, recargar } = useConsulta(
    async () => {
      const [ordenes, recetas] = await Promise.all([getOrdenesBejerman(), getRecetas()]);
      return { ordenes, recetas };
    },
    [],
    { inicial: { ordenes: [], recetas: [] } },
  );

  // Las decisiones se guardan aparte: "rev" vuelve a leerlas
  const [rev, setRev] = useState(0);
  const ordenes = useMemo(
    () => porLinea(datos.ordenes).flatMap((g) => g.ordenes),
    [datos.ordenes, rev], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const receta = useMemo(
    () => Object.fromEntries(datos.recetas.map((r) => [r.codigo_barra, r])),
    [datos.recetas],
  );

  // Filtro de estado en la URL (?estado=aprobado); por defecto, las pendientes
  const [params, setParams] = useSearchParams();
  const estado = params.get('estado') || 'pendiente';
  const [texto, setTexto] = useState('');

  const filas = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return ordenes.filter(
      (o) =>
        (estado === 'todas' || estadoRevision(o) === estado) &&
        (!t || [o.numero, o.producto, o.codigo_barras, o.lote].some((v) => String(v ?? '').toLowerCase().includes(t))),
    );
  }, [ordenes, estado, texto]);

  const cuenta = (e) => (e === 'todas' ? ordenes.length : ordenes.filter((o) => estadoRevision(o) === e).length);

  const revisar = async (o) => {
    // Misma ventana que los lotes: Aprobar / Rechazar (con motivo) / Quitar rechazo
    const fila = {
      ref: `orden ${o.numero}`,
      femenino: true,
      nombre_producto: `${o.producto || ''} · cantidad ${cantidad(o.cantidad)}`,
      estado: estadoRevision(o),
      calidad: o.revision,
    };
    const nombre = `orden ${o.numero}`;

    if (fila.estado === 'aprobado') {
      if (!(await confirmarQuitarAprobacion(fila))) return;
      quitarRevision(o.numero);
      setRev((r) => r + 1);
      toastCalidad(`Quitaste la aprobación de la ${nombre}`, 'neutro');
      return;
    }

    const r = await preguntarDecision(fila);
    if (!r) return;
    if (r.decision === 'quitar') {
      quitarRevision(o.numero);
      toastCalidad(`Quitaste el rechazo de la ${nombre}`, 'neutro');
    } else {
      registrarRevision(o.numero, r, usuario);
      if (r.decision === 'aprobado') toastCalidad(`Aprobaste las cantidades de la ${nombre}`, 'aprobado');
      else toastCalidad(`Rechazaste la ${nombre}`, 'rechazado');
    }
    setRev((x) => x + 1);
  };

  const filtro = ({ key, label }) => (
    <button
      key={key}
      type="button"
      aria-pressed={estado === key}
      onClick={() => setParams(key === 'pendiente' ? {} : { estado: key })}
      className={`min-h-9 cursor-pointer rounded-lg px-3 text-sm font-bold transition-colors ${
        estado === key
          ? 'bg-slate-900 text-white dark:bg-teal-600'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {label} <span className="tabular-nums opacity-70">{cuenta(key)}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Órdenes a revisar"
        descripcion="Calidad controla las cantidades antes de que la orden salga a Elaboración."
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
          {FILTROS.map(filtro)}
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
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </label>
        </div>

        <CardTitulo icono={faMagnifyingGlass} extra={cargando ? 'Buscando…' : `${filas.length} órdenes`}>
          {FILTROS.find((f) => f.key === estado)?.label || 'Órdenes'}
        </CardTitulo>
        <EstadoConsulta
          cargando={cargando && !ordenes.length}
          error={error}
          vacio={!filas.length}
          textoVacio={ordenes.length ? 'Ninguna orden cumple con el filtro.' : 'No hay órdenes de producción.'}
        />

        {filas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <caption className="sr-only">Órdenes de producción a revisar</caption>
              <thead>
                <tr>
                  <th scope="col" className={`${TH} text-left`}>N° producción</th>
                  <th scope="col" className={`${TH} text-left`}>Producto</th>
                  <th scope="col" className={`${TH} text-left`}>Código de barras</th>
                  <th scope="col" className={`${TH} text-right`}>Cantidad</th>
                  <th scope="col" className={`${TH} text-left`}>Tolva</th>
                  <th scope="col" className={`${TH} text-left`}>Línea</th>
                  <th scope="col" className={`${TH} text-left`}>Lote</th>
                  <th scope="col" className={`${TH} text-left`}>Receta</th>
                  <th scope="col" className={`${TH} text-left`}>Estado</th>
                  {puedeAprobar && <th scope="col" className={`${TH} text-right`}><span className="sr-only">Acción</span></th>}
                </tr>
              </thead>
              <tbody>
                {filas.map((o) => {
                  const r = receta[String(o.codigo_barras ?? '').trim()];
                  const st = estadoRevision(o);
                  return (
                    <tr key={o.numero} className="border-t border-gray-200 dark:border-slate-800">
                      <td className={`${TD} font-bold tabular-nums`}>{o.numero}</td>
                      <td className={TD}>{o.producto || '—'}</td>
                      <td className={`${TD} whitespace-nowrap tabular-nums`}>
                        <FontAwesomeIcon icon={faBarcode} className="mr-2 text-gray-400" aria-hidden="true" />
                        {o.codigo_barras || '—'}
                      </td>
                      <td className={`${TD} text-right font-bold tabular-nums`}>{cantidad(o.cantidad)}</td>
                      <td className={`${TD} whitespace-nowrap tabular-nums`}>
                        {o.tolva_kg ? `${o.tolva_kg} kg` : <Chip tipo="inc">Sin definir</Chip>}
                      </td>
                      <td className={`${TD} tabular-nums`}>{o.linea || '—'}</td>
                      <td className={`${TD} tabular-nums`}>{o.lote || '—'}</td>
                      <td className={`${TD} whitespace-nowrap`}>
                        {r ? (
                          <button
                            type="button"
                            className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 font-bold text-teal-600 underline dark:text-teal-400"
                            onClick={() => verReceta(o, r)}
                          >
                            <FontAwesomeIcon icon={faFlask} aria-hidden="true" />
                            Ver receta
                          </button>
                        ) : (
                          <Chip tipo="neutro">Sin receta en el maestro</Chip>
                        )}
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <ChipRevision orden={o} />
                        {o.revision && (
                          <span className="mt-1 block text-[13px] text-gray-500 dark:text-slate-400">
                            {o.revision.usuario} · {fecha(o.revision.fecha)}
                          </span>
                        )}
                      </td>
                      {puedeAprobar && (
                        <td className={`${TD} whitespace-nowrap text-right`}>
                          <button
                            type="button"
                            className={st === 'aprobado' ? BOTON.secundario : BOTON.exito}
                            onClick={() => revisar(o)}
                          >
                            <FontAwesomeIcon icon={faStamp} aria-hidden="true" />
                            {st === 'aprobado' ? 'Quitar aprobación' : 'Revisar'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!puedeAprobar && <Nota>Tu perfil es de consulta: solo Calidad o el administrador pueden aprobar.</Nota>}
        <Nota>
          {ESTADOS_REVISION.rechazado.texto}: la orden vuelve a Programación para corregirla en Bejerman. Las
          cantidades de la receta son las del maestro de tolvas.
        </Nota>
      </Card>
    </div>
  );
}
