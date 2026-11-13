import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleNodes, faLock, faPlugCircleXmark, faGears } from '@fortawesome/free-solid-svg-icons';
import { MODULOS } from '@/app/modulos';
import { GrillaKpi, Kpi } from '@/shared/components/base';
import { CARD } from '@/shared/components/clases';
import { labelClass, subClass } from '@/shared/components/ui';
import { useMonitor } from '@/modules/monitoreo/context/MonitorContext';
import { enEspera, enLinea } from '@/modules/monitoreo/lib/rooms';
import { ROLES, useSesion } from '@/shared/lib/auth';

/** Pantalla de inicio: estado de planta en vivo y acceso a cada módulo. */
export default function Inicio() {
  const { rooms, now, mqttOk } = useMonitor();
  const { usuario, rol, puede } = useSesion();

  const salas = Object.values(rooms);
  const enLineaN = salas.filter((s) => enLinea(s, now)).length;
  const produciendo = salas.filter((s) => enLinea(s, now) && !enEspera(s)).length;

  return (
    <div className="flex flex-col gap-4">
      <div className={`${CARD} flex flex-col gap-1`}>
        <h1 className="m-0 text-2xl font-extrabold">
          Manufacturing Execution System
        </h1>
        <p className={`m-0 ${subClass}`}>
          {usuario
            ? `Sesión iniciada como ${usuario} (${ROLES[rol] || rol}).`
            : 'Monitoreo es de libre consulta. Para Calidad y Compras iniciá sesión.'}
        </p>
      </div>

      <GrillaKpi>
        <Kpi titulo="Broker MQTT" valor={mqttOk ? 'Conectado' : 'Sin conexión'} tono={mqttOk ? 'verde' : 'rojo'} icono={faCircleNodes} />
        <Kpi titulo="PLC en línea" valor={enLineaN} sufijo={`/ ${salas.length}`} tono="teal" icono={faCircleNodes} to="/monitoreo" />
        <Kpi titulo="Produciendo" valor={produciendo} sufijo="salas" tono="violeta" icono={faGears} to="/monitoreo" />
        <Kpi titulo="Sin conexión" valor={salas.length - enLineaN} sufijo="PLC" tono={salas.length - enLineaN ? 'rojo' : 'verde'} icono={faPlugCircleXmark} />
      </GrillaKpi>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {MODULOS.map((m) => {
          const bloqueado = m.permiso && !puede(m.permiso);
          return (
            <Link
              key={m.key}
              to={'/' + m.key}
              className={`${CARD} group flex flex-col gap-4 transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-violet-600 text-xl text-white shadow-sm">
                  <FontAwesomeIcon icon={m.icono} aria-hidden="true" />
                </span>
                <h2 className="m-0 flex-1 text-xl font-extrabold">{m.label}</h2>
                {bloqueado && <FontAwesomeIcon icon={faLock} className="text-gray-400" aria-label="Requiere iniciar sesión" />}
              </div>
              <p className={`m-0 flex-1 ${subClass}`}>{m.descripcion}</p>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {m.menu.map((i) => (
                  <li key={i.to} className="flex items-center gap-2 text-[14px] font-semibold text-gray-600 dark:text-slate-300">
                    <FontAwesomeIcon icon={i.icono} className="w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                    {i.label}
                  </li>
                ))}
              </ul>
              <span className={`${labelClass} flex items-center gap-2 text-violet-700 dark:text-violet-300`}>
                Entrar
                <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
