import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate,
  faBarcode,
  faCirclePlay,
  faPlay,
  faRightLeft,
  faTrashCan,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitulo, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import { BOTON, INPUT, TD, TH } from '@/shared/components/clases';
import { Chip } from '@/shared/components/ui';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { alerta, confirmar, esc, toast } from '@/shared/lib/alertas';
import { useSesion } from '@/shared/lib/auth';
import { hoyISO } from '@/shared/lib/format';
import { CALIDAD_TOLVA, calidadDeTolva, conectarTolva, getTolvas, vaciarTolva } from '@/shared/lib/tolvas';
import { getHistorial } from '@/modules/monitoreo/lib/api';
import { getOrdenesBejerman, porLinea } from '@/modules/programacion/lib/api';

const comparar = (a, b) => String(a).localeCompare(String(b), 'es', { numeric: true });

/**
 * Producción (Línea): tolvas de cada línea. En uso, en espera (en orden de prioridad de su
 * orden) y cambio de tolva con lectura del código de barras, validando que sea la que sigue.
 */
export default function TolvasLinea() {
  const { usuario, puede } = useSesion();
  const puedeOperar = puede('produccion.operar');

  const { datos, cargando, error, recargar } = useConsulta(
    async () => {
      // Los lotes traen la decisión de Calidad; alcanza con los últimos días
      const [ordenes, tolvas, lotes] = await Promise.all([
        getOrdenesBejerman().catch(() => []),
        getTolvas(),
        getHistorial({ sector: 'todos', desde: hoyISO(-6), hasta: hoyISO(0) }).catch(() => []),
      ]);
      return { ordenes, tolvas, lotes };
    },
    [],
    { inicial: { ordenes: [], tolvas: [], lotes: [] }, intervaloMs: 60000 },
  );

  // Prioridad de cada orden dentro de su línea
  const prioridad = useMemo(() => {
    const p = {};
    porLinea(datos.ordenes).forEach((g) => g.ordenes.forEach((o) => (p[o.numero] = o.prioridad)));
    return p;
  }, [datos.ordenes]);

  const lineas = useMemo(() => {
    const nombres = [...new Set(datos.tolvas.filter((t) => t.estado !== 'sucia').map((t) => t.linea))].sort(comparar);
    return nombres.map((linea) => {
      const deLinea = datos.tolvas.filter((t) => t.linea === linea);
      const espera = deLinea
        .filter((t) => t.estado === 'elaboracion')
        .map((t) => ({ ...t, calidad: calidadDeTolva(t, datos.lotes) }))
        .sort(
          (a, b) =>
            (prioridad[a.orden] ?? Infinity) - (prioridad[b.orden] ?? Infinity) ||
            String(a.asignada).localeCompare(String(b.asignada)),
        );
      return {
        linea,
        enUso: deLinea.filter((t) => t.estado === 'linea'),
        espera,
        siguiente: espera.find((t) => t.calidad === 'aprobado') || null,
      };
    });
  }, [datos.tolvas, datos.lotes, prioridad]);

  const [escaneo, setEscaneo] = useState({});

  const error_ = (titulo, texto) =>
    alerta.fire({ icon: 'error', title: esc(titulo), html: esc(texto), confirmButtonText: 'Cerrar' });

  // Cambio de tolva: valida la tolva escaneada y la conecta (la que estaba en uso queda vacía)
  const cambiar = async (g, e) => {
    e.preventDefault();
    const codigo = String(escaneo[g.linea] || '').trim();
    if (!codigo) return;
    const t = datos.tolvas.find((x) => x.codigo === codigo);
    const enEspera = g.espera.find((x) => x.codigo === codigo);

    if (!t) return error_(`Tolva ${codigo}`, 'No está registrada: Elaboración todavía no la asignó a ninguna orden.');
    if (t.linea !== g.linea) return error_(`Tolva ${codigo}`, `Es de la línea ${t.linea}, no de la línea ${g.linea}.`);
    if (t.estado === 'linea') return error_(`Tolva ${codigo}`, 'Ya está conectada en la línea.');
    if (!enEspera) return error_(`Tolva ${codigo}`, 'Está vacía: no tiene una orden asignada.');
    if (enEspera.calidad !== 'aprobado') {
      return error_(`Tolva ${codigo}`, `Calidad no la aprobó (${CALIDAD_TOLVA[enEspera.calidad].texto.toLowerCase()}).`);
    }
    if (g.siguiente && g.siguiente.codigo !== codigo) {
      return error_(
        `Tolva ${codigo}`,
        `No es la que sigue en prioridad. La que sigue es la tolva ${g.siguiente.codigo} (orden ${g.siguiente.orden}).`,
      );
    }

    if (g.enUso.length) {
      const ok = await confirmar({
        titulo: `¿Cambiar a la tolva ${codigo}?`,
        texto: `La tolva ${g.enUso.map((x) => x.codigo).join(', ')} queda vacía y se avisa a Elaboración.`,
        confirmar: 'Cambiar tolva',
      });
      if (!ok) return;
      for (const x of g.enUso) await vaciarTolva(x.codigo, usuario);
    }
    await conectarTolva(codigo, usuario);
    setEscaneo((s) => ({ ...s, [g.linea]: '' }));
    toast(`Tolva ${codigo} conectada en la línea ${g.linea}`, 'aprobado');
    recargar();
  };

  const vaciar = async (t) => {
    const ok = await confirmar({
      titulo: `¿La tolva ${t.codigo} quedó vacía?`,
      texto: 'Queda sucia con su esencia y se avisa a Elaboración.',
      confirmar: 'Marcar vacía',
    });
    if (!ok) return;
    await vaciarTolva(t.codigo, usuario);
    toast(`Tolva ${t.codigo} vacía`, 'neutro');
    recargar();
  };

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Tolvas por línea"
        descripcion="Tolvas en uso y en espera, en orden de prioridad"
        icono={faWarehouse}
        acciones={
          <button type="button" className={BOTON.secundario} onClick={recargar} disabled={cargando}>
            <FontAwesomeIcon icon={faArrowsRotate} aria-hidden="true" />
            Actualizar
          </button>
        }
      />

      <Card className="flex flex-col gap-3">
        <Nota>
          Para cambiar de tolva, escaneá su código: tiene que estar aprobada por Calidad y ser la que sigue en prioridad. La
          que estaba en uso queda vacía y se avisa a Elaboración para el lavado.
        </Nota>
        <EstadoConsulta
          cargando={cargando && !datos.tolvas.length}
          error={error}
          vacio={!lineas.length}
          textoVacio="No hay tolvas asignadas a ninguna línea."
        />
      </Card>

      {lineas.map((g) => (
        <Card key={g.linea} className="flex flex-col gap-3">
          <CardTitulo icono={faWarehouse} extra={`${g.espera.length} en espera`}>
            Línea {g.linea}
          </CardTitulo>

          {/* En uso */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400">En uso:</span>
            {g.enUso.length ? (
              g.enUso.map((t) => (
                <span key={t.codigo} className="inline-flex items-center gap-2">
                  <Chip tipo="ok" icono={faCirclePlay}>
                    Tolva {t.codigo} · orden {t.orden}
                  </Chip>
                  {puedeOperar && (
                    <button type="button" className={`${BOTON.secundario} !min-h-9 !px-3 text-sm`} onClick={() => vaciar(t)}>
                      <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                      Vacía
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-[15px] font-medium text-gray-500 dark:text-slate-400">ninguna</span>
            )}
          </div>

          {/* Cambio de tolva */}
          {puedeOperar && (
            <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => cambiar(g, e)}>
              <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 sm:max-w-xs">
                <span className="text-[12px] font-extrabold uppercase tracking-[1.6px] text-gray-500 dark:text-slate-400">
                  Cambio de tolva
                </span>
                <span className="relative">
                  <FontAwesomeIcon
                    icon={faBarcode}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    className={`${INPUT} pl-9`}
                    placeholder="Escaneá el código de la tolva"
                    autoComplete="off"
                    value={escaneo[g.linea] || ''}
                    onChange={(e) => setEscaneo((s) => ({ ...s, [g.linea]: e.target.value }))}
                  />
                </span>
              </label>
              <button type="submit" className={BOTON.marca} disabled={!String(escaneo[g.linea] || '').trim()}>
                <FontAwesomeIcon icon={faRightLeft} aria-hidden="true" />
                Conectar
              </button>
            </form>
          )}

          {/* En espera */}
          <EstadoConsulta vacio={!g.espera.length} textoVacio="No hay tolvas en espera para esta línea." />
          {g.espera.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <caption className="sr-only">Tolvas en espera de la línea {g.linea}</caption>
                <thead>
                  <tr>
                    <th scope="col" className={`${TH} text-left`}>Tolva</th>
                    <th scope="col" className={`${TH} text-left`}>Orden</th>
                    <th scope="col" className={`${TH} text-left`}>Prioridad</th>
                    <th scope="col" className={`${TH} text-left`}>Producto</th>
                    <th scope="col" className={`${TH} text-left`}>Capacidad</th>
                    <th scope="col" className={`${TH} text-left`}>Calidad</th>
                  </tr>
                </thead>
                <tbody>
                  {g.espera.map((t) => {
                    const sigue = g.siguiente?.codigo === t.codigo;
                    const c = CALIDAD_TOLVA[t.calidad];
                    return (
                      <tr
                        key={t.codigo}
                        className={`border-t border-gray-200 dark:border-slate-800 ${sigue ? 'bg-teal-500/10 dark:bg-teal-400/10' : ''}`}
                      >
                        <td className={`${TD} whitespace-nowrap font-bold tabular-nums`}>
                          {t.codigo}
                          {sigue && (
                            <span className="ml-2">
                              <Chip tipo="curso" icono={faPlay} mayus>
                                Sigue
                              </Chip>
                            </span>
                          )}
                        </td>
                        <td className={`${TD} tabular-nums`}>{t.orden}</td>
                        <td className={`${TD} tabular-nums`}>{prioridad[t.orden] ?? '—'}</td>
                        <td className={TD}>{t.producto || '—'}</td>
                        <td className={`${TD} tabular-nums`}>{t.kg ? `${t.kg} kg` : '—'}</td>
                        <td className={`${TD} whitespace-nowrap`}>
                          <Chip tipo={c.tipo} mayus>
                            {c.texto}
                          </Chip>
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
