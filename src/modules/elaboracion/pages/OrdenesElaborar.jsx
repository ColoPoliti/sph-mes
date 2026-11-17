import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate,
  faBarcode,
  faBroom,
  faFlask,
  faGears,
  faHourglassHalf,
  faPlay,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitulo, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import { BOTON, TD, TH } from '@/shared/components/clases';
import { Chip } from '@/shared/components/ui';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { CLASES, alerta, esc, toast } from '@/shared/lib/alertas';
import { useSesion } from '@/shared/lib/auth';
import { asignarTolva, esenciaDe, evaluarLavado, getTolvas } from '@/shared/lib/tolvas';
import { getOrdenesBejerman, porLinea } from '@/modules/programacion/lib/api';
import { cantidad } from '@/modules/programacion/lib/formato';
import { estadoRevision } from '@/modules/programacion/lib/revision';
import { INSUMOS, aPantalla, escalar, getRecetas } from '@/modules/administracion/lib/api';

const codigoDe = (o) => String(o.codigo_barras ?? '').trim();

// Texto de la regla de lavado para una tolva y la receta que sigue
function textoLavado(tolva, receta) {
  const r = evaluarLavado(tolva, receta);
  const sigue = esenciaDe(receta);
  if (r === 'no_lavar') return { r, texto: `No lavar: misma esencia (${tolva.esencia})` };
  if (r === 'nueva') return { r, texto: 'Tolva sin uso registrado' };
  if (!tolva.esencia || !sigue) return { r, texto: 'Lavar: no hay dato de esencia para comparar' };
  return { r, texto: `Lavar: tenía ${tolva.esencia} y sigue ${sigue}` };
}

/**
 * Cola de Elaboración: por línea y en orden de prioridad, solo las órdenes cuyas cantidades
 * ya aprobó Calidad, con la receta escalada a su tolva (250/1000 kg). El elaborador escanea
 * la tolva para asignarla a la orden; las tolvas que Línea vació aparecen con la regla de lavado.
 */
export default function OrdenesElaborar() {
  const { usuario, puede } = useSesion();
  const puedeOperar = puede('elaboracion.operar');

  const { datos, cargando, error, recargar } = useConsulta(
    async () => {
      const [ordenes, recetas, tolvas] = await Promise.all([getOrdenesBejerman(), getRecetas(), getTolvas()]);
      return { ordenes, recetas, tolvas };
    },
    [],
    { inicial: { ordenes: [], recetas: [], tolvas: [] }, intervaloMs: 60000 },
  );

  const receta = useMemo(
    () => Object.fromEntries(datos.recetas.map((r) => [r.codigo_barra, r])),
    [datos.recetas],
  );

  // Por línea: las aprobadas (en prioridad) y cuántas esperan la revisión de Calidad
  const lineas = useMemo(
    () =>
      porLinea(datos.ordenes).map((g) => ({
        linea: g.linea,
        aprobadas: g.ordenes.filter((o) => estadoRevision(o) === 'aprobado'),
        enRevision: g.ordenes.filter((o) => estadoRevision(o) === 'pendiente').length,
      })),
    [datos.ordenes],
  );

  const tolvasDe = (numero) => datos.tolvas.filter((t) => t.orden === numero && t.estado !== 'sucia');
  const sucias = datos.tolvas.filter((t) => t.estado === 'sucia');
  // Siguiente orden con receta de una línea (para la regla de lavado de las tolvas vacías)
  const siguienteDe = (linea) => lineas.find((g) => g.linea === linea)?.aprobadas.find((o) => receta[codigoDe(o)]);

  const [params, setParams] = useSearchParams();
  const lineaSel = params.get('linea') || 'todas';
  const visibles = lineas.filter((g) => lineaSel === 'todas' || g.linea === lineaSel);
  const total = lineas.reduce((n, g) => n + g.aprobadas.length, 0);

  // Escanear la tolva y asignarla a la orden (con la regla de lavado)
  const asignar = async (orden) => {
    const r = receta[codigoDe(orden)];
    if (!r) {
      toast(`La orden ${orden.numero} no tiene receta en el maestro`, 'rechazado');
      return;
    }
    const pedido = await alerta.fire({
      title: `Asignar tolva a la orden ${esc(orden.numero)}`,
      html: esc(orden.producto || ''),
      input: 'text',
      inputLabel: 'Escaneá o escribí el código de la tolva',
      inputAttributes: { autocomplete: 'off', 'aria-label': 'Código de la tolva' },
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (v) => (!String(v || '').trim() ? 'Falta el código de la tolva' : undefined),
    });
    if (!pedido.isConfirmed) return;
    const codigo = String(pedido.value).trim();
    const tolva = datos.tolvas.find((t) => t.codigo === codigo) || null;

    let lavada = false;
    const { r: regla, texto } = textoLavado(tolva, r);
    if (regla === 'lavar' || regla === 'no_lavar') {
      const c = await alerta.fire({
        icon: regla === 'lavar' ? 'warning' : 'info',
        title: `Tolva ${esc(codigo)}`,
        html: esc(texto),
        showCancelButton: true,
        confirmButtonText: regla === 'lavar' ? 'Está lavada, asignar' : 'Asignar',
        cancelButtonText: 'Cancelar',
        customClass: CLASES,
      });
      if (!c.isConfirmed) return;
      lavada = regla === 'lavar';
    }

    try {
      await asignarTolva(codigo, { orden, receta: r }, usuario, { lavada });
      toast(`Tolva ${codigo} asignada a la orden ${orden.numero}`, 'aprobado');
      recargar();
    } catch (e) {
      alerta.fire({ icon: 'error', title: 'No se pudo asignar', html: esc(e.message), confirmButtonText: 'Cerrar' });
    }
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

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Órdenes a elaborar"
        descripcion="Órdenes con cantidades aprobadas por Calidad, por línea y en orden de prioridad"
        icono={faGears}
        acciones={
          <button type="button" className={BOTON.secundario} onClick={recargar} disabled={cargando}>
            <FontAwesomeIcon icon={faArrowsRotate} aria-hidden="true" />
            Actualizar
          </button>
        }
      />

      {sucias.length > 0 && (
        <Card className="flex flex-col gap-3">
          <CardTitulo icono={faBroom} extra={`${sucias.length} tolvas`}>
            Tolvas vacías (aviso de Línea)
          </CardTitulo>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <caption className="sr-only">Tolvas vacías y regla de lavado</caption>
              <thead>
                <tr>
                  <th scope="col" className={`${TH} text-left`}>Tolva</th>
                  <th scope="col" className={`${TH} text-left`}>Línea</th>
                  <th scope="col" className={`${TH} text-left`}>Esencia que tenía</th>
                  <th scope="col" className={`${TH} text-left`}>Siguiente orden de la línea</th>
                  <th scope="col" className={`${TH} text-left`}>Lavado</th>
                </tr>
              </thead>
              <tbody>
                {sucias.map((t) => {
                  const sig = siguienteDe(t.linea);
                  const regla = sig ? textoLavado(t, receta[codigoDe(sig)]) : null;
                  return (
                    <tr key={t.codigo} className="border-t border-gray-200 dark:border-slate-800">
                      <td className={`${TD} font-bold tabular-nums`}>{t.codigo}</td>
                      <td className={`${TD} tabular-nums`}>{t.linea || '—'}</td>
                      <td className={TD}>{t.esencia || '—'}</td>
                      <td className={TD}>{sig ? `${sig.numero} · ${sig.producto || ''}` : '—'}</td>
                      <td className={`${TD} whitespace-nowrap`}>
                        {regla ? (
                          <Chip tipo={regla.r === 'no_lavar' ? 'ok' : 'inc'} icono={faBroom}>
                            {regla.texto}
                          </Chip>
                        ) : (
                          <Chip tipo="neutro">Sin orden siguiente con receta</Chip>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filtro('todas', 'Todas', total)}
          {lineas.map((g) => filtro(g.linea, `Línea ${g.linea}`, g.aprobadas.length))}
        </div>
        <Nota>
          Las cantidades son por tolva (250 o 1000 kg, según la orden), calculadas con la receta del maestro de tolvas. El
          colorante va en ml.
        </Nota>
        <EstadoConsulta cargando={cargando && !datos.ordenes.length} error={error} vacio={!lineas.length} textoVacio="No hay órdenes de producción." />
      </Card>

      {visibles.map((g) => (
        <Card key={g.linea} className="flex flex-col gap-3">
          <CardTitulo
            icono={faGears}
            extra={`${g.aprobadas.length} para elaborar`}
            acciones={
              g.enRevision > 0 && (
                <Chip tipo="inc" icono={faHourglassHalf}>
                  {g.enRevision} esperando revisión de Calidad
                </Chip>
              )
            }
          >
            Línea {g.linea}
          </CardTitulo>
          <EstadoConsulta vacio={!g.aprobadas.length} textoVacio="No hay órdenes aprobadas para elaborar en esta línea." />

          {g.aprobadas.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1240px]">
                <caption className="sr-only">Órdenes a elaborar de la línea {g.linea}</caption>
                <thead>
                  <tr>
                    <th scope="col" className={`${TH} text-left`}>#</th>
                    <th scope="col" className={`${TH} text-left`}>N° producción</th>
                    <th scope="col" className={`${TH} text-left`}>Producto</th>
                    <th scope="col" className={`${TH} text-right`}>Cantidad</th>
                    <th scope="col" className={`${TH} text-left`}>Tolva</th>
                    {INSUMOS.map((i) => (
                      <th key={i.etapa} scope="col" className={`${TH} text-right`}>
                        {i.nombre} <span className="normal-case">({i.unidad})</span>
                      </th>
                    ))}
                    <th scope="col" className={`${TH} text-left`}>Tolvas asignadas</th>
                  </tr>
                </thead>
                <tbody>
                  {g.aprobadas.map((o, idx) => {
                    const r = receta[codigoDe(o)];
                    const insumos = r && o.tolva_kg ? escalar(r, o.tolva_kg) : null;
                    const siguiente = idx === 0;
                    const asignadas = tolvasDe(o.numero);
                    return (
                      <tr
                        key={o.numero}
                        className={`border-t border-gray-200 dark:border-slate-800 ${
                          siguiente ? 'bg-teal-500/10 dark:bg-teal-400/10' : ''
                        }`}
                      >
                        <td className={`${TD} text-[18px] font-extrabold tabular-nums text-teal-600 dark:text-teal-400`}>
                          {idx + 1}
                        </td>
                        <td className={`${TD} whitespace-nowrap font-bold tabular-nums`}>
                          {o.numero}
                          {siguiente && (
                            <span className="ml-2">
                              <Chip tipo="curso" icono={faPlay} mayus>
                                Siguiente
                              </Chip>
                            </span>
                          )}
                        </td>
                        <td className={TD}>
                          <span className="block">{o.producto || '—'}</span>
                          <span className="block whitespace-nowrap text-[13px] text-gray-500 dark:text-slate-400">
                            <FontAwesomeIcon icon={faBarcode} className="mr-1.5" aria-hidden="true" />
                            {o.codigo_barras || '—'}
                            {o.lote ? ` · Lote ${o.lote}` : ''}
                          </span>
                        </td>
                        <td className={`${TD} text-right font-bold tabular-nums`}>{cantidad(o.cantidad)}</td>
                        <td className={`${TD} whitespace-nowrap tabular-nums`}>
                          {o.tolva_kg ? `${o.tolva_kg} kg` : <Chip tipo="inc">Sin definir</Chip>}
                        </td>
                        {insumos ? (
                          INSUMOS.map((i) => {
                            const ins = insumos.find((x) => x.etapa === i.etapa);
                            return (
                              <td key={i.etapa} className={`${TD} text-right tabular-nums`}>
                                <span className="block font-bold">{cantidad(aPantalla(ins?.sp, i.unidad))}</span>
                                {ins?.codigo_mp && (
                                  <span className="block text-[13px] text-gray-500 dark:text-slate-400">{ins.codigo_mp}</span>
                                )}
                              </td>
                            );
                          })
                        ) : (
                          <td colSpan={INSUMOS.length} className={`${TD} text-right`}>
                            <Chip tipo="neutro" icono={faFlask}>
                              {!r ? 'Sin receta en el maestro' : 'Falta definir el tamaño de tolva en Programación'}
                            </Chip>
                          </td>
                        )}
                        <td className={TD}>
                          <span className="flex flex-wrap items-center gap-1.5">
                            {asignadas.map((t) => (
                              <Chip key={t.codigo} tipo="curso">
                                {t.codigo}
                              </Chip>
                            ))}
                            {puedeOperar && (
                              <button
                                type="button"
                                className={`${BOTON.secundario} !min-h-9 !px-3 text-sm`}
                                onClick={() => asignar(o)}
                                disabled={!r}
                              >
                                <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                                Tolva
                              </button>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
