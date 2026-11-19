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
import DataTable from '@/shared/components/DataTable';
import { BOTON } from '@/shared/components/clases';
import { Chip } from '@/shared/components/ui';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { CLASES, alerta, esc, toast } from '@/shared/lib/alertas';
import { useSesion } from '@/shared/lib/auth';
import { num } from '@/shared/lib/format';
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

  // Regla de lavado de una tolva vacía según la siguiente orden de su línea
  const reglaDe = (t) => {
    const sig = siguienteDe(t.linea);
    return sig ? textoLavado(t, receta[codigoDe(sig)]) : null;
  };

  const columnasSucias = [
    { id: 'tolva', titulo: 'Tolva', valor: (t) => t.codigo, clase: 'codigo font-bold tabular-nums' },
    { id: 'linea', titulo: 'Línea', valor: (t) => t.linea, clase: 'tabular-nums' },
    { id: 'esencia', titulo: 'Esencia que tenía', valor: (t) => t.esencia },
    {
      id: 'siguiente',
      titulo: 'Siguiente orden de la línea',
      valor: (t) => {
        const sig = siguienteDe(t.linea);
        return sig ? `${sig.numero} · ${sig.producto || ''}` : null;
      },
    },
    {
      id: 'lavado',
      titulo: 'Lavado',
      valor: (t) => reglaDe(t)?.texto,
      celda: (t) => {
        const regla = reglaDe(t);
        return regla ? (
          <Chip tipo={regla.r === 'no_lavar' ? 'ok' : 'inc'} icono={faBroom}>
            {regla.texto}
          </Chip>
        ) : (
          <Chip tipo="neutro">Sin orden siguiente con receta</Chip>
        );
      },
      clase: 'whitespace-nowrap',
    },
  ];

  // Insumos de la orden escalados a su tolva; null si falta la receta o el tamaño
  const insumosDe = (o) => {
    const r = receta[codigoDe(o)];
    return r && o.tolva_kg ? escalar(r, o.tolva_kg) : null;
  };

  // Cola de una línea. La posición y "Siguiente" salen de la prioridad, no del orden en pantalla.
  const columnasCola = (g) => [
    {
      id: 'posicion',
      titulo: '#',
      valor: (o) => g.aprobadas.indexOf(o) + 1,
      clase: 'text-[18px] font-extrabold tabular-nums text-teal-600 dark:text-teal-400',
    },
    {
      id: 'numero',
      titulo: 'N° producción',
      valor: (o) => o.numero,
      celda: (o) => (
        <>
          {o.numero}
          {g.aprobadas[0] === o && (
            <span className="ml-2">
              <Chip tipo="curso" icono={faPlay} mayus>
                Siguiente
              </Chip>
            </span>
          )}
        </>
      ),
      clase: 'codigo whitespace-nowrap font-bold tabular-nums',
    },
    {
      id: 'producto',
      titulo: 'Producto',
      valor: (o) => o.producto,
      texto: (o) => `${o.codigo_barras ?? ''} ${o.lote ?? ''}`,
      celda: (o) => (
        <>
          <span className="block">{o.producto || '—'}</span>
          <span className="codigo block whitespace-nowrap text-[14px] text-gray-600 dark:text-slate-300">
            <FontAwesomeIcon icon={faBarcode} className="mr-1.5" aria-hidden="true" />
            {o.codigo_barras || '—'}
            {o.lote ? ` · Lote ${o.lote}` : ''}
          </span>
        </>
      ),
    },
    { id: 'cantidad', titulo: 'Cantidad', alinear: 'right', valor: (o) => num(o.cantidad), celda: (o) => cantidad(o.cantidad), clase: 'font-bold tabular-nums' },
    {
      id: 'tolva',
      titulo: 'Tolva',
      valor: (o) => o.tolva_kg,
      celda: (o) => (o.tolva_kg ? `${o.tolva_kg} kg` : <Chip tipo="inc">Sin definir</Chip>),
      clase: 'whitespace-nowrap tabular-nums',
    },
    ...INSUMOS.map((i, k) => ({
      id: `insumo-${i.etapa}`,
      titulo: `${i.nombre} (${i.unidad})`,
      encabezado: (
        <>
          {i.nombre} <span className="normal-case">({i.unidad})</span>
        </>
      ),
      alinear: 'right',
      valor: (o) => num(aPantalla(insumosDe(o)?.find((x) => x.etapa === i.etapa)?.sp, i.unidad)),
      // Sin receta o sin tolva, un solo aviso ocupa todas las columnas de insumos
      span: (o) => (insumosDe(o) ? 1 : k === 0 ? INSUMOS.length : 0),
      celda: (o) => {
        const insumos = insumosDe(o);
        if (!insumos) {
          return (
            <Chip tipo="neutro" icono={faFlask}>
              {!receta[codigoDe(o)] ? 'Sin receta en el maestro' : 'Falta definir el tamaño de tolva en Programación'}
            </Chip>
          );
        }
        const ins = insumos.find((x) => x.etapa === i.etapa);
        return (
          <>
            <span className="block font-bold">{cantidad(aPantalla(ins?.sp, i.unidad))}</span>
            {ins?.codigo_mp && <span className="codigo block text-[14px] text-gray-600 dark:text-slate-300">{ins.codigo_mp}</span>}
          </>
        );
      },
      clase: 'tabular-nums',
    })),
    {
      id: 'asignadas',
      titulo: 'Tolvas asignadas',
      valor: (o) => tolvasDe(o.numero).map((t) => t.codigo).join(', '),
      celda: (o) => (
        <span className="flex flex-wrap items-center gap-1.5">
          {tolvasDe(o.numero).map((t) => (
            <Chip key={t.codigo} tipo="curso">
              <span className="codigo">{t.codigo}</span>
            </Chip>
          ))}
          {puedeOperar && (
            <button
              type="button"
              className={`${BOTON.secundario} !min-h-9 !px-3 text-sm`}
              onClick={() => asignar(o)}
              disabled={!receta[codigoDe(o)]}
            >
              <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
              Tolva
            </button>
          )}
        </span>
      ),
    },
  ];

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
          <DataTable
            titulo="Tolvas vacías y regla de lavado"
            columnas={columnasSucias}
            filas={sucias}
            clave={(t) => t.codigo}
            minWidth={720}
            compacta
          />
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
            <DataTable
              titulo={`Órdenes a elaborar de la línea ${g.linea}`}
              columnas={columnasCola(g)}
              filas={g.aprobadas}
              clave={(o) => o.numero}
              minWidth={1240}
              porPagina={25}
              claseFila={(o) => (g.aprobadas[0] === o ? 'bg-teal-500/10 dark:bg-teal-400/10' : '')}
              exportar={`elaborar-linea-${g.linea}.csv`}
            />
          )}
        </Card>
      ))}
    </div>
  );
}
