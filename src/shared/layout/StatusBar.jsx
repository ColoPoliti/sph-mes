import { CONFIG } from '@/modules/monitoreo/config';
import { useMonitor } from '@/modules/monitoreo/context/MonitorContext';
import { DEMO } from '@/modules/monitoreo/lib/demo';
import { enEspera, enLinea } from '@/modules/monitoreo/lib/rooms';

export default function StatusBar() {
  const { mqttOk, selectedRoom, now } = useMonitor();
  const plcOn = enLinea(selectedRoom, now);
  const plcEspera = plcOn && enEspera(selectedRoom);

  return (
    <footer className="flex flex-none flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md dark:shadow-none px-4 py-2 text-sm font-medium">
      <span className="flex items-center gap-2">
        <span
          className={`inline-block h-3.5 w-3.5 ${mqttOk ? 'bg-emerald-500' : 'bg-red-500'}`}
          aria-hidden="true"
        />
        <span>
          {DEMO ? 'Modo demo (datos simulados)' : `Broker: ${CONFIG.BROKER_ETIQUETA}`}
          {mqttOk ? '' : ' (sin conexión)'}
        </span>
      </span>

      <span className="flex-1" />

      <span className="flex items-center gap-2">
        <span
          className={`inline-block h-3.5 w-3.5 ${!plcOn ? 'bg-red-500' : plcEspera ? 'bg-amber-400' : 'bg-emerald-500'}`}
          aria-hidden="true"
        />
        <span>
          {/* Se muestra en todos los módulos: aclara de qué PLC se habla */}
          PLC {selectedRoom?.key}: {!plcOn ? 'sin conexión' : plcEspera ? 'en espera' : 'en línea'}
        </span>
      </span>
    </footer>
  );
}
