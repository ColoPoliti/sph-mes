import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { MODULOS } from '@/app/modulos';
import { useMonitor } from '@/modules/monitoreo/context/MonitorContext';
import { enEspera, enLinea } from '@/modules/monitoreo/lib/rooms';
import Tooltip, { FLECHA_ARRIBA } from '@/shared/components/Tooltip';
import { useSesion } from '@/shared/lib/auth';
import EstadoPlanta from './inicio/EstadoPlanta';
import TarjetaModulo from './inicio/TarjetaModulo';
import { ejecutandoEnElaboracion, resumirMonitoreo, useResumenModulos } from './inicio/useResumenModulos';

// Las cards se pueden reordenar arrastrándolas, pero la ESTRUCTURA de la grilla queda fija:
// hay lugares, y al soltar una card sobre otra intercambian de lugar.
//   - LUGAR_ALTO: ocupa dos filas (desde tablet). Por defecto, Monitoreo.
//   - LUGARES_APILADOS: dos cards compactas, una encima de la otra, en una misma celda.
// El orden de cada usuario se guarda en este navegador.
const ESTADO = 'estado'; // card de estado de planta (MES, broker, produciendo, PLC)
const ORDEN_DEFECTO = [ESTADO, 'programacion', 'calidad', 'monitoreo', 'produccion', 'elaboracion', 'auditoria', 'administracion'];
const LUGAR_ALTO = 3;
const LUGARES_APILADOS = [5, 6];
const CLAVE_ORDEN = 'sph-inicio-orden';
// Ícono de agarre (seis puntos), el mismo en las cards y en la ayuda de arriba
const ICONO_ARRASTRE = faGripVertical;

// Solo las cards que existen (un módulo comentado en MODULOS, como Compras, no aparece)
const DISPONIBLES = [ESTADO, ...MODULOS.map((m) => m.key)];
const ordenBase = () => [
  ...ORDEN_DEFECTO.filter((k) => DISPONIBLES.includes(k)),
  ...DISPONIBLES.filter((k) => !ORDEN_DEFECTO.includes(k)),
];

/** Orden guardado, si sigue siendo válido (mismas cards); si no, el de defecto. */
function leerOrden() {
  const base = ordenBase();
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_ORDEN) || 'null');
    const valido =
      Array.isArray(guardado) && guardado.length === base.length && base.every((k) => guardado.includes(k));
    return valido ? guardado : base;
  } catch {
    return base;
  }
}

function guardarOrden(orden) {
  try {
    localStorage.setItem(CLAVE_ORDEN, JSON.stringify(orden));
  } catch {
    /* sin storage: el orden dura lo que la página */
  }
}

const esPorDefecto = (orden) => orden.join() === ordenBase().join();

/** Pantalla de inicio: estado de planta en vivo y acceso a cada módulo. */
export default function Inicio() {
  const { rooms, now, mqttOk } = useMonitor();
  const { usuario, rol, puede } = useSesion();
  const [orden, setOrden] = useState(leerOrden);
  const [arrastrada, setArrastrada] = useState(null);
  const [destino, setDestino] = useState(null);

  const salas = Object.values(rooms);
  const enLineaN = salas.filter((s) => enLinea(s, now)).length;
  const produciendo = salas.filter((s) => enLinea(s, now) && !enEspera(s)).length;
  const monitoreo = resumirMonitoreo(salas, now);
  const { resumen, cargando } = useResumenModulos(puede, ejecutandoEnElaboracion(salas, now));

  const cambiarOrden = (nuevo) => {
    setOrden(nuevo);
    guardarOrden(nuevo);
  };

  /** Intercambia de lugar dos cards. */
  const intercambiar = (a, b) => {
    if (!a || !b || a === b) return;
    const nuevo = [...orden];
    const ia = nuevo.indexOf(a);
    const ib = nuevo.indexOf(b);
    [nuevo[ia], nuevo[ib]] = [nuevo[ib], nuevo[ia]];
    cambiarOrden(nuevo);
  };

  const terminarArrastre = () => {
    setArrastrada(null);
    setDestino(null);
  };

  /** Contenido de una card. `alto`: está en el lugar de dos filas; `compacta`: en un lugar apilado. */
  const contenido = (key, { alto, compacta }) => {
    if (key === ESTADO) {
      return (
        <EstadoPlanta
          usuario={usuario}
          rol={rol}
          mqttOk={mqttOk}
          produciendo={produciendo}
          enLinea={enLineaN}
          fueraDeLinea={salas.length - enLineaN}
          className="flex-1"
        />
      );
    }
    const m = MODULOS.find((x) => x.key === key);
    // Monitoreo: en el lugar alto, versión completa (PLC entre líneas con barras, datos al pie);
    // en cualquier otro lugar, versión chica (por PLC solo título, estado y tiempo)
    const res =
      key === 'monitoreo'
        ? { ...monitoreo, separado: alto, grafico: { ...monitoreo.grafico, resumido: !alto } }
        : resumen[key];
    return (
      <TarjetaModulo
        modulo={m}
        resumen={res}
        cargando={cargando}
        bloqueado={Boolean(m.permiso) && !puede(m.permiso)}
        conSesion={Boolean(usuario)}
        compacta={compacta}
        className={compacta ? '' : 'flex-1'}
      />
    );
  };

  /** Celda arrastrable: se arrastra desde cualquier parte de la card y se suelta sobre otra. */
  const celda = (key, { alto = false, compacta = false } = {}) => (
    <div
      key={key}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', key);
        setArrastrada(key);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        if (arrastrada && arrastrada !== key) setDestino(key);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        intercambiar(arrastrada || e.dataTransfer.getData('text/plain'), key);
        terminarArrastre();
      }}
      onDragEnd={terminarArrastre}
      className={`group/celda relative flex min-w-0 flex-col rounded-md transition ${alto ? 'sm:row-span-2' : ''} ${compacta ? 'sm:flex-1' : ''} ${
        arrastrada === key ? 'opacity-40' : ''
      } ${destino === key ? 'outline-dashed outline-2 outline-offset-4 outline-violet-500 dark:outline-violet-400' : ''} ${
        arrastrada ? 'cursor-grabbing' : 'sm:cursor-grab'
      }`}
    >
      {contenido(key, { alto, compacta })}
      {/* Agarradera: pestaña centrada sobre el borde de arriba con el ícono de agarre de seis puntos
          (el usual para "arrastrar"). Va al centro para no tapar el ícono ni el candado del encabezado.
          Al pasar el mouse por la pestaña aparece el globo "Arrastrá la tarjeta" (desde tablet) */}
      <span className="group/agarre absolute -top-2.5 left-1/2 z-10 hidden -translate-x-1/2 cursor-grab sm:block" aria-hidden="true">
        <span className="flex h-5 w-10 items-center justify-center rounded-full bg-white text-[12px] text-gray-400 shadow transition-colors group-hover/celda:text-violet-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover/celda:text-violet-400">
          <FontAwesomeIcon icon={ICONO_ARRASTRE} rotation={90} />
        </span>
        <span className={`pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-[13px] font-semibold text-white shadow-md group-hover/agarre:block dark:bg-slate-700 ${FLECHA_ARRIBA}`}>
          Arrastrá la tarjeta
        </span>
      </span>
    </div>
  );

  // Arma la grilla recorriendo los lugares; los dos apilados van juntos en una misma celda
  const celdas = [];
  orden.forEach((key, i) => {
    if (LUGARES_APILADOS.includes(i)) {
      if (i !== LUGARES_APILADOS[0]) return;
      celdas.push(
        <div key="apilados" className="contents sm:flex sm:flex-col sm:gap-6">
          {LUGARES_APILADOS.filter((l) => orden[l]).map((l) => celda(orden[l], { compacta: true }))}
        </div>,
      );
      return;
    }
    celdas.push(celda(key, { alto: i === LUGAR_ALTO }));
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Ayuda del arrastre (desde tablet: en celular no hay arrastre) */}
      <div className="hidden items-center justify-end gap-4 text-[13px] font-medium text-gray-600 dark:text-slate-300 sm:flex">
        <span className="flex items-center gap-2">
          <FontAwesomeIcon icon={ICONO_ARRASTRE} rotation={90} aria-hidden="true" />
          Arrastrá una tarjeta sobre otra para intercambiarlas
        </span>
        {!esPorDefecto(orden) && (
          <Tooltip texto="Vuelve a poner las tarjetas en su orden original" posicion="abajo">
          <button
            type="button"
            onClick={() => cambiarOrden(ordenBase())}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1 font-bold text-gray-900 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" />
            Restablecer orden
          </button>
          </Tooltip>
        )}
      </div>

      {/* Grilla de inicio. En celular (una columna) todas las cards tienen el mismo alto
          y las apiladas pasan a ser cards sueltas */}
      <div className="grid grid-cols-1 gap-6 max-sm:auto-rows-fr sm:grid-cols-2 xl:grid-cols-3 min-[1500px]:grid-cols-4">
        {celdas}
      </div>
    </div>
  );
}
