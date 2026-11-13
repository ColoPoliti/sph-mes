// Modo demostración: simula la telemetría de los PLC sin conectarse al broker MQTT.
// Se activa abriendo la app con ?demo en la URL (ej: http://localhost:5173/?demo).
// Usa los mismos manejadores que los mensajes MQTT reales, así que todo el
// monitor (contadores, barras, receta, gráfico) se comporta igual que en producción.

export const DEMO =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo');

// Receta de ejemplo (misma forma que publica Node-RED en AREA/SALA/receta).
// Etapas: 0 alcohol, 1 colorante (ml), 2 glicerina, 3 agua, 4 esencia, 5 etiqueta y agitado.
function recetaDemo(n) {
  return {
    ts: Date.now(),
    codigo_barra: String(7790000000000 + n),
    tolva: 3,
    producto: { nombre: 'Aromatizante Demo ' + n, sku: 'DEMO-' + String(n).padStart(3, '0') },
    insumos: [
      { etapa: 0, nombre: 'Alcohol', codigo_mp: 'MP-101', sp: 12 },
      { etapa: 1, nombre: 'Colorante', codigo_mp: 'MP-205', sp: 0.08 }, // 80 ml
      { etapa: 2, nombre: 'Glicerina', codigo_mp: 'MP-310', sp: 3.5 },
      { etapa: 3, nombre: 'Agua', codigo_mp: 'MP-001', sp: 18 },
      { etapa: 4, nombre: 'Esencia', codigo_mp: 'MP-412', sp: 1.2 },
    ],
  };
}

const rnd = (a, b) => a + Math.random() * (b - a);

/**
 * Arranca la simulación.
 * @param {(key: string, d: object) => void} producto  manejador de AREA/SALA/producto
 * @param {(key: string, d: object) => void} receta    manejador de AREA/SALA/receta
 * @returns {() => void} función para detenerla
 */
export function iniciarDemo({ producto, receta }) {
  const SALA = 'elaboracion/001'; // sala que dosifica
  const ESPERA = 'aerosoles/001'; // sala conectada pero en espera
  // elaboracion/002 y aerosoles/002 no publican: aparecen "Sin conexión"

  let ciclo = 1;
  let r = recetaDemo(ciclo);
  let etapa = 0;
  let peso = 0;
  let ticksFase = 0;

  receta(SALA, r);

  const tick = () => {
    ticksFase += 1;

    if (etapa <= 4) {
      // Dosificando: el peso sube rápido al principio y lento al acercarse al SP
      const ins = r.insumos[etapa];
      const sp = etapa === 1 ? ins.sp * 1000 : ins.sp;
      const falta = sp - peso;
      peso = Math.min(sp, peso + Math.max(falta * rnd(0.22, 0.32), sp * 0.01));
      const valvula = Math.round(Math.min(100, (falta / sp) * 140 + rnd(-4, 4)));
      producto(SALA, { etapa, estado: Math.max(0, valvula), peso, sp });

      if (sp - peso < sp * 0.004) {
        etapa += 1;
        peso = 0;
        ticksFase = 0;
      }
    } else if (etapa === 5) {
      // Etiqueta y agitado
      producto(SALA, { etapa: 5, estado: 0, peso: 0, sp: 0 });
      if (ticksFase >= 6) {
        etapa = 6;
        ticksFase = 0;
      }
    } else if (etapa === 6) {
      // Fin
      producto(SALA, { etapa: 6, estado: 0, peso: 0, sp: 0 });
      if (ticksFase >= 4) {
        etapa = 7;
        ticksFase = 0;
      }
    } else {
      // En espera y arranca un lote nuevo
      producto(SALA, { etapa: 0, estado: 0, peso: 0, sp: 0 });
      if (ticksFase >= 4) {
        ciclo += 1;
        r = recetaDemo(ciclo);
        receta(SALA, r);
        etapa = 0;
        peso = 0;
        ticksFase = 0;
      }
    }

    producto(ESPERA, { etapa: 0, estado: 0, peso: 0, sp: 0 });
  };

  tick();
  const id = setInterval(tick, 1000); // el PLC real publica cada 1 s
  return () => clearInterval(id);
}

// ---------- Lotes simulados (historial / etiqueta digital) ----------
// En modo demo la API PHP no se consulta: se generan ~60 lotes de la última semana,
// siempre los mismos (generador pseudoaleatorio con semilla fija).

const PRODUCTOS_DEMO = ['Aromatizante Lavanda', 'Aromatizante Citrus', 'Textil Bebé', 'Aerosol Vainilla', 'Difusor Bambú'];
const INSUMOS_DEMO = recetaDemo(0).insumos;

function aleatorio(semilla) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ts = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

let cacheLotes = null;
function lotesDemo() {
  if (cacheLotes) return cacheLotes;
  const r = aleatorio(42);
  const hoy = new Date();
  hoy.setMinutes(0, 0, 0);
  cacheLotes = Array.from({ length: 60 }, (_, i) => {
    const id = 1000 + 60 - i;
    const inicio = new Date(hoy.getTime() - i * 2.7 * 3600e3 - r() * 3600e3);
    const etapas = INSUMOS_DEMO.map((ins, k) => {
      const sp = ins.etapa === 1 ? ins.sp * 1000 : ins.sp;
      const desvio = (r() - 0.5) * (r() < 0.12 ? 8 : 2.2); // algunos fuera de tolerancia
      const cargado = sp * (1 + desvio / 100);
      return {
        orden: k,
        etapa: ins.etapa,
        insumo: ins.nombre,
        codigo_mp: ins.codigo_mp,
        unidad: ins.etapa === 1 ? 'ml' : 'kg',
        sp,
        cargado,
        diferencia: cargado - sp,
        diferencia_pct: desvio,
        duracion_s: Math.round(40 + r() * 160),
      };
    });
    const total = etapas.reduce((a, e) => a + e.duracion_s, 0) + 120;
    const area = r() < 0.7 ? 'elaboracion' : 'aerosoles';
    return {
      lote: {
        id,
        area,
        sala: r() < 0.5 ? '001' : '002',
        codigo_barra: String(7790000000000 + id),
        nombre_producto: PRODUCTOS_DEMO[Math.floor(r() * PRODUCTOS_DEMO.length)],
        tolva: 1 + Math.floor(r() * 4),
        fuente: r() < 0.8 ? 'plc' : 'telemetria',
        inicio: ts(inicio),
        fin: ts(new Date(inicio.getTime() + total * 1000)),
        tiempo_total_s: total,
        estado: r() < 0.85 ? 'completa' : 'incompleta',
      },
      etapas,
    };
  });
  return cacheLotes;
}

/** Misma forma que lotes.php?area&sala&desde&hasta&limit */
export function historialDemo({ area, sala, desde, hasta, limit = 500 } = {}) {
  return lotesDemo()
    .map((d) => ({ ...d.lote }))
    .filter(
      (l) =>
        (!area || l.area === area) &&
        (!sala || l.sala === sala) &&
        (!desde || l.inicio.slice(0, 10) >= desde) &&
        (!hasta || l.inicio.slice(0, 10) <= hasta),
    )
    .slice(0, limit);
}

/** Misma forma que lotes.php?id */
export function loteDemo(id) {
  const d = lotesDemo().find((x) => String(x.lote.id) === String(id));
  if (!d) throw new Error('Lote inexistente');
  return { lote: { ...d.lote }, etapas: d.etapas.map((e) => ({ ...e })) };
}
