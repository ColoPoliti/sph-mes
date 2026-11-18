// Indicadores de las tarjetas de la pantalla de inicio.
// Usa las mismas APIs y reglas que las pantallas de cada módulo, así los números coinciden.
// Solo consulta lo que el perfil puede ver. Si una fuente falla, su tarjeta queda "sin datos"
// (nunca se muestra un 0 que no es real) y el resto sigue funcionando.
import { useMemo } from 'react';
import { getRecetas } from '@/modules/administracion/lib/api';
import { getAuditorias } from '@/modules/auditoria/lib/api';
import { getOrdenes } from '@/modules/compras/lib/api';
import { getHistorial } from '@/modules/monitoreo/lib/api';
import { enEspera, enLinea, nombreEtapa, subSala } from '@/modules/monitoreo/lib/rooms';
import { getOrdenesBejerman, porLinea } from '@/modules/programacion/lib/api';
import { estadoRevision } from '@/modules/programacion/lib/revision';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { clamp, hoyISO } from '@/shared/lib/format';
import { ciclosDe, esenciaDe, getTolvas, loteDeTolva } from '@/shared/lib/tolvas';

const REFRESCO_MS = 60000;
const DIAS_PANEL = 6; // Hoy y los 6 días anteriores, igual que el panel de Calidad
const DIAS_AUDITORIA = 30;

const contar = (lista, fn) => lista.filter(fn).length;
const diaDe = (lote) => String(lote.inicio ?? '').slice(0, 10);
const enEjecucion = (s, now) => enLinea(s, now) && !enEspera(s) && s.etapa < 6;

/** Estado en vivo de los PLC. No depende de ninguna consulta: llega por MQTT. */
export function resumirMonitoreo(salas, now) {
  // Solo se listan los PLC en ejecución: el resto se resume en las cantidades del pie
  const plcs = salas
    .filter((s) => enEjecucion(s, now))
    .map((s) => {
      const avance = s.sp > 0 ? clamp(s.peso / s.sp, 0, 1) : null;
      const etapa = nombreEtapa(s, s.etapa);
      return {
        clave: s.key,
        nombre: `${s.area.label} ${s.plc}`,
        // Alcanza con la etapa y su avance: el texto completo queda en el tooltip
        texto: avance === null ? etapa : `${etapa} · ${Math.round(avance * 100)}%`,
        detalle: subSala(s, now),
        estado: 'ok',
        avance,
      };
    });
  const enLineaN = contar(salas, (s) => enLinea(s, now));
  const ejecutando = plcs.length;

  return {
    valor: enLineaN,
    unidad: `de ${salas.length} PLC en línea`,
    grafico: { tipo: 'plcs', plcs },
    datos: [
      // Las tres cantidades suman el total de PLC; el círculo va siempre, aunque el valor sea 0
      { etiqueta: 'En ejecución', valor: ejecutando, aviso: 'ok' },
      { etiqueta: 'En espera', valor: enLineaN - ejecutando, aviso: 'alerta' },
      { etiqueta: 'Sin conexión', valor: salas.length - enLineaN, aviso: 'mal' },
    ],
  };
}

const columnasPorLinea = (grupos, cantidad) =>
  grupos.map((g) => ({
    clave: g.linea,
    etiqueta: `L${g.linea}`,
    valor: cantidad(g),
    detalle: `Línea ${g.linea}: ${cantidad(g)} ${cantidad(g) === 1 ? 'orden' : 'órdenes'}`,
  }));

function resumirProgramacion({ ordenes }) {
  if (!ordenes) return null;
  const grupos = porLinea(ordenes);
  const todas = grupos.flatMap((g) => g.ordenes);
  const sinTolva = contar(todas, (o) => o.tolva_kg === null);
  const pendientes = contar(todas, (o) => estadoRevision(o) === 'pendiente');
  return {
    valor: todas.length,
    unidad: 'órdenes',
    grafico: {
      tipo: 'columnas',
      columnas: columnasPorLinea(grupos, (g) => g.ordenes.length),
      rotulos: 'todos',
      vacio: 'No hay órdenes cargadas.',
    },
    datos: [
      { etiqueta: 'Pend. Calidad', valor: pendientes, aviso: pendientes > 0 ? 'alerta' : null },
      { etiqueta: 'Aprobadas', valor: contar(todas, (o) => estadoRevision(o) === 'aprobado') },
      { etiqueta: 'Sin tolva', valor: sinTolva, aviso: sinTolva > 0 ? 'alerta' : null },
    ],
  };
}

function resumirCalidad({ lotes }) {
  if (!lotes) return null;
  const desde = hoyISO(-DIAS_PANEL);
  const semana = lotes.filter((l) => diaDe(l) >= desde);
  const aprobados = contar(semana, (l) => l.estado === 'aprobado');
  const rechazados = contar(semana, (l) => l.estado === 'rechazado');
  const pendientes = semana.length - aprobados - rechazados;
  return {
    // Sin número principal: los lotes a liberar van en el centro de la dona
    grafico: {
      tipo: 'dona',
      centro: { valor: pendientes, etiqueta: 'a liberar' },
      segmentos: [
        { clave: 'aprobados', etiqueta: 'Aprobados', valor: aprobados, color: 'ok' },
        { clave: 'pendientes', etiqueta: 'A liberar', valor: pendientes, color: 'alerta' },
        { clave: 'rechazados', etiqueta: 'Rechazados', valor: rechazados, color: 'mal' },
      ],
      vacio: 'Sin lotes en los últimos 7 días.',
    },
  };
}

function resumirElaboracion({ ordenes, tolvas }, ejecutando) {
  if (!ordenes) return null;
  const grupos = porLinea(ordenes).map((g) => ({
    linea: g.linea,
    aprobadas: contar(g.ordenes, (o) => estadoRevision(o) === 'aprobado'),
  }));
  const sucias = tolvas ? contar(tolvas, (t) => t.estado === 'sucia') : null;
  return {
    valor: grupos.reduce((n, g) => n + g.aprobadas, 0),
    unidad: 'órdenes en cola',
    grafico: {
      tipo: 'columnas',
      columnas: columnasPorLinea(grupos, (g) => g.aprobadas),
      rotulos: 'todos',
      vacio: 'No hay órdenes aprobadas para elaborar.',
    },
    datos: [
      { etiqueta: 'En ejecución', valor: ejecutando },
      { etiqueta: 'Tolvas asignadas', valor: tolvas ? contar(tolvas, (t) => t.estado === 'elaboracion') : '—' },
      { etiqueta: 'Tolvas vacías', valor: sucias ?? '—', aviso: sucias > 0 ? 'alerta' : null },
    ],
  };
}

function resumirProduccion({ tolvas, lotes }) {
  if (!tolvas) return null;
  const dias = Array.from({ length: DIAS_PANEL + 1 }, (_, i) => hoyISO(i - DIAS_PANEL));
  const columnas = lotes
    ? dias.map((iso) => {
        const fecha = new Date(`${iso}T00:00:00`);
        const valor = contar(lotes, (l) => diaDe(l) === iso);
        const dia = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' });
        return {
          clave: iso,
          etiqueta: fecha.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', ''),
          valor,
          detalle: `${dia}: ${valor} ${valor === 1 ? 'lote' : 'lotes'}`,
        };
      })
    : [];
  const vacias = contar(tolvas, (t) => t.estado === 'sucia');
  return {
    valor: contar(tolvas, (t) => t.estado === 'linea'),
    unidad: 'tolvas en uso',
    grafico: {
      tipo: 'columnas',
      columnas,
      rotulos: 'ultimo',
      color: 'violeta',
      vacio: 'Sin lotes para mostrar.',
    },
    datos: [
      { etiqueta: 'Lotes hoy', valor: lotes ? columnas[columnas.length - 1].valor : '—' },
      { etiqueta: 'En espera', valor: contar(tolvas, (t) => t.estado === 'elaboracion') },
      { etiqueta: 'Vacías', valor: vacias, aviso: vacias > 0 ? 'alerta' : null },
    ],
  };
}

function resumirAuditoria({ tolvas, lotes, auditorias }) {
  if (!tolvas || !lotes || !auditorias) return null;
  const ciclos = ciclosDe(tolvas).filter((c) => loteDeTolva(c, lotes)?.estado === 'aprobado');
  const controladas = contar(ciclos, (c) => auditorias[c.id]);
  const pendientes = ciclos.length - controladas;
  return {
    valor: pendientes,
    unidad: 'tolvas a controlar',
    grafico: {
      tipo: 'medidor',
      titulo: 'Tolvas controladas',
      valor: controladas,
      total: ciclos.length,
      vacio: 'Sin tolvas aprobadas para controlar.',
    },
    datos: [
      { etiqueta: 'Revisadas', valor: controladas },
      { etiqueta: 'Pendientes', valor: pendientes, aviso: pendientes > 0 ? 'alerta' : null },
      { etiqueta: 'Total 30 días', valor: ciclos.length },
    ],
  };
}

function resumirCompras({ comprasOrdenes }) {
  if (!comprasOrdenes) return null;
  const porEstado = (estado) => comprasOrdenes.filter((o) => o.estado === estado);
  const [borrador, pendiente, aprobada] = ['borrador', 'pendiente', 'aprobada'].map(porEstado);
  return {
    valor: borrador.length + pendiente.length + aprobada.length,
    unidad: 'órdenes abiertas',
    grafico: {
      tipo: 'segmentos',
      segmentos: [
        { clave: 'aprobada', etiqueta: 'Aprobadas', valor: aprobada.length, color: 'ok' },
        { clave: 'pendiente', etiqueta: 'Pendientes', valor: pendiente.length, color: 'alerta' },
        { clave: 'borrador', etiqueta: 'Borrador', valor: borrador.length, color: 'neutro' },
      ],
      vacio: 'No hay órdenes abiertas.',
    },
  };
}

function resumirAdministracion({ recetas, tolvas }) {
  if (!recetas) return null;
  const conEsencia = contar(recetas, (r) => esenciaDe(r));
  const sinEsencia = recetas.length - conEsencia;
  return {
    valor: recetas.length,
    unidad: 'recetas',
    grafico: {
      tipo: 'medidor',
      titulo: 'Con esencia identificada',
      valor: conEsencia,
      total: recetas.length,
      vacio: 'Todavía no hay recetas cargadas.',
    },
    datos: [
      { etiqueta: 'Con esencia', valor: conEsencia },
      { etiqueta: 'Sin esencia', valor: sinEsencia, aviso: sinEsencia > 0 ? 'alerta' : null },
      { etiqueta: 'Tolvas', valor: tolvas ? tolvas.length : '—' },
    ],
  };
}

const PENDIENTE = Symbol('pendiente');

/**
 * Consulta una fuente solo si el perfil la puede ver; si falla devuelve null.
 * Cada fuente va por separado: una API lenta no demora las tarjetas que no dependen de ella.
 */
function useFuente(activa, fn) {
  const { datos } = useConsulta(
    () => (activa ? Promise.resolve().then(fn).catch(() => null) : null),
    [activa],
    { inicial: PENDIENTE, intervaloMs: REFRESCO_MS },
  );
  return datos;
}

const historialReciente = () => getHistorial({ sector: 'todos', desde: hoyISO(-DIAS_AUDITORIA), hasta: hoyISO(0) });

/**
 * Indicadores por módulo: { programacion, calidad, ... }.
 * Cada uno es el resumen de su tarjeta, o null si todavía no llegó o no se pudo consultar.
 * `cargando` es true hasta que todas las fuentes respondieron por primera vez.
 */
export function useResumenModulos(puede, ejecutandoElaboracion) {
  const ver = {
    programacion: puede('programacion.ver'),
    calidad: puede('calidad.ver'),
    elaboracion: puede('elaboracion.ver'),
    produccion: puede('produccion.ver'),
    auditoria: puede('auditoria.ver'),
    compras: puede('compras.ver'),
    admin: puede('admin.ver'),
  };

  const ordenes = useFuente(ver.programacion || ver.elaboracion, getOrdenesBejerman);
  const lotes = useFuente(ver.calidad || ver.produccion || ver.auditoria, historialReciente);
  const tolvas = useFuente(ver.elaboracion || ver.produccion || ver.auditoria || ver.admin, getTolvas);
  const auditorias = useFuente(ver.auditoria, getAuditorias);
  const recetas = useFuente(ver.admin, getRecetas);
  const comprasOrdenes = useFuente(ver.compras, getOrdenes);

  const resumen = useMemo(() => {
    // Lo que todavía no llegó cuenta como "sin datos" para los resúmenes
    const valor = (d) => (d === PENDIENTE ? null : d);
    const datos = {
      ordenes: valor(ordenes),
      lotes: valor(lotes),
      tolvas: valor(tolvas),
      auditorias: valor(auditorias),
      recetas: valor(recetas),
      comprasOrdenes: valor(comprasOrdenes),
    };
    return {
      programacion: resumirProgramacion(datos),
      calidad: resumirCalidad(datos),
      elaboracion: resumirElaboracion(datos, ejecutandoElaboracion),
      produccion: resumirProduccion(datos),
      auditoria: resumirAuditoria(datos),
      compras: resumirCompras(datos),
      administracion: resumirAdministracion(datos),
    };
  }, [ordenes, lotes, tolvas, auditorias, recetas, comprasOrdenes, ejecutandoElaboracion]);

  const cargando = [ordenes, lotes, tolvas, auditorias, recetas, comprasOrdenes].includes(PENDIENTE);

  return { resumen, cargando };
}

/** PLC de Elaboración que están dosificando ahora. */
export const ejecutandoEnElaboracion = (salas, now) =>
  contar(salas, (s) => s.area.key === 'elaboracion' && enEjecucion(s, now));
