import { MODULOS } from '@/app/modulos';
import { useMonitor } from '@/modules/monitoreo/context/MonitorContext';
import { enEspera, enLinea } from '@/modules/monitoreo/lib/rooms';
import { useSesion } from '@/shared/lib/auth';
import EstadoPlanta from './inicio/EstadoPlanta';
import TarjetaModulo from './inicio/TarjetaModulo';
import { ejecutandoEnElaboracion, resumirMonitoreo, useResumenModulos } from './inicio/useResumenModulos';

/** Pantalla de inicio: estado de planta en vivo y acceso a cada módulo. */
export default function Inicio() {
  const { rooms, now, mqttOk } = useMonitor();
  const { usuario, rol, puede } = useSesion();

  const salas = Object.values(rooms);
  const enLineaN = salas.filter((s) => enLinea(s, now)).length;
  const produciendo = salas.filter((s) => enLinea(s, now) && !enEspera(s)).length;
  const monitoreo = resumirMonitoreo(salas, now);
  const { resumen, cargando } = useResumenModulos(puede, ejecutandoEnElaboracion(salas, now));

  return (
    <div className="flex flex-col gap-6">
      <EstadoPlanta
        usuario={usuario}
        rol={rol}
        mqttOk={mqttOk}
        produciendo={produciendo}
        enLinea={enLineaN}
        fueraDeLinea={salas.length - enLineaN}
      />

      {/* Cards de módulos: separadas del estado de planta con más aire (24 px del gap + 64 px de margen) */}
      {/* Cuatro columnas solo desde 1500 px: con menos ancho no entran los indicadores de cada tarjeta */}
      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 min-[1500px]:grid-cols-4">
        {MODULOS.map((m) => (
          <TarjetaModulo
            key={m.key}
            modulo={m}
            resumen={m.key === 'monitoreo' ? monitoreo : resumen[m.key]}
            cargando={cargando}
            bloqueado={Boolean(m.permiso) && !puede(m.permiso)}
            conSesion={Boolean(usuario)}
          />
        ))}
      </div>
    </div>
  );
}
