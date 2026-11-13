import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { MODULOS } from '@/app/modulos';
import { useSesion } from '@/shared/lib/auth';

/**
 * Selector de módulos (Monitoreo / Calidad / Compras).
 * vertical: versión para el menú lateral en mobile.
 * Los módulos sin permiso se muestran con candado: al entrar, la ruta ofrece iniciar sesión.
 */
export default function ModuloNav({ className = '', vertical = false, onNavegar }) {
  const { puede } = useSesion();

  return (
    <nav
      aria-label="Módulos"
      className={`${className} ${
        vertical
          ? 'flex-col gap-1'
          : 'flex-none items-center gap-1 rounded-[10px] border border-gray-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-800'
      }`}
    >
      {MODULOS.map((m) => {
        const bloqueado = m.permiso && !puede(m.permiso);
        return (
          <NavLink
            key={m.key}
            to={'/' + m.key}
            onClick={onNavegar}
            title={bloqueado ? `${m.label} · requiere permiso` : m.label}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg text-sm font-bold transition-colors ${
                vertical ? 'min-h-11 px-3' : 'h-8 px-3'
              } ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-teal-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
              }`
            }
          >
            <FontAwesomeIcon icon={m.icono} className="w-4" aria-hidden="true" />
            <span>{m.label}</span>
            {bloqueado && (
              <FontAwesomeIcon icon={faLock} className="text-[10px] opacity-60" aria-label="(requiere permiso)" />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
