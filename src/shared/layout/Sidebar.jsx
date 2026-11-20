import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { moduloDeRuta } from '@/app/modulos';
import SalasMenu from '@/modules/monitoreo/components/SalasMenu';
import logoFoot from '@/assets/logo-foot.png';
import logoFootClaro from '@/assets/logo-foot-claro.png';

const esMovil = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;

/**
 * Ítem del menú lateral (mismo diseño que "Historial de elaboraciones" del monitor original):
 * Ícono y título en una línea (el subtítulo va en el tooltip). Íconos sin color, del mismo tono que el texto.
 * Activo = fila slate (clara en modo claro, oscura en modo oscuro) con borde teal.
 */
const TEXTO_ACTIVO = 'text-slate-900 dark:text-white';

function MenuItem({ item, open, onNavegar, separado = false }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavegar}
      title={item.sub ? `${item.label} · ${item.sub}` : item.label}
      aria-label={item.sub ? `${item.label} · ${item.sub}` : item.label}
      className={({ isActive }) =>
        `-mx-2 block px-2 transition-colors ${open ? 'py-1' : 'flex justify-center py-1.5'
        } ${separado ? 'mt-1 border-y border-gray-200 dark:border-white/[.06]' : ''} ${isActive
          ? 'border-l-4 border-l-teal-600 bg-slate-200 pl-1 dark:border-l-teal-600 dark:bg-slate-900'
          : 'hover:bg-gray-100 dark:hover:bg-slate-800/50'
        }`
      }
    >
      {({ isActive }) =>
        open ? (
          // Ícono y título en una sola línea (el subtítulo queda en el tooltip)
          <span className="flex min-h-11 w-full min-w-0 items-center gap-3 py-2 pl-3 pr-2 text-left">
            <FontAwesomeIcon
              icon={item.icono}
              className={`w-4 flex-none text-sm ${isActive ? TEXTO_ACTIVO : 'text-gray-600 dark:text-slate-300'}`}
              aria-hidden="true"
            />
            <span
              className={`min-w-0 truncate text-[14px] font-normal ${isActive ? TEXTO_ACTIVO : 'text-gray-600 dark:text-slate-300'
                }`}
            >
              {item.label}
            </span>
          </span>
        ) : (
          <span className="flex h-11 w-full items-center justify-center px-1">
            <FontAwesomeIcon
              icon={item.icono}
              className={`text-base ${isActive ? TEXTO_ACTIVO : 'text-gray-600 dark:text-slate-300'}`}
              aria-hidden="true"
            />
          </span>
        )
      }
    </NavLink>
  );
}

export default function Sidebar({ open, onClose, onToggle }) {
  const { pathname } = useLocation();
  const modulo = moduloDeRuta(pathname);

  const cerrarSiMovil = () => {
    if (esMovil()) onClose();
  };

  return (
    // Modo claro: sin borde derecho, con sombra hacia la derecha. Modo oscuro: borde derecho y sin sombra.
    // En escritorio es relative + z-[5] para que la sombra quede por encima del contenido.
    <aside
      id="menu-lateral"
      aria-label={`Menú de ${modulo.label}`}
      className={`${open ? 'flex w-[280px] lg:w-64' : 'hidden lg:flex lg:w-[88px]'
        } textura-fondo fixed bottom-0 left-0 top-[72px] z-30 flex-col overflow-hidden bg-white shadow-[4px_0_16px_-4px_rgba(15,23,42,0.18)] dark:border-r dark:border-slate-900 dark:bg-slate-950 dark:shadow-none transition-[width] duration-200 lg:relative lg:bottom-auto lg:top-auto lg:z-[5] lg:h-full lg:flex-none`}
    >
      {/* Encabezado: nombre del módulo y flecha para contraer o expandir el menú */}
      <div
        className={`flex h-14 flex-none items-center border-b border-gray-200 dark:border-white/[.06] ${open ? 'justify-between px-4' : 'justify-center px-2'
          }`}
      >
        {open && (
          <span className="flex min-w-0 items-center gap-2 truncate text-[12px] font-extrabold uppercase tracking-[1.6px] text-gray-600 dark:text-slate-300">
            <FontAwesomeIcon icon={modulo.icono} aria-hidden="true" />
            {modulo.label}
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="menu-lateral"
          aria-label={open ? 'Contraer menú' : 'Expandir menú'}
          className="hidden h-8 w-8 flex-none lg:flex cursor-pointer items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {open ? <polyline points="15 6 9 12 15 18" /> : <polyline points="9 6 15 12 9 18" />}
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3">
        {/* Monitoreo: árbol de áreas y PLC en vivo, y debajo los ítems del módulo (si tiene) */}
        {modulo.menuSalas && <SalasMenu open={open} onNavegar={cerrarSiMovil} />}

        {modulo.menu.map((item) => (
          // En Monitoreo los ítems llevan borde arriba y abajo sutil, para diferenciarlos del árbol de PLC
          <MenuItem key={item.to} item={item} open={open} onNavegar={cerrarSiMovil} separado={modulo.menuSalas} />
        ))}
      </nav>

      {/* Logo al pie, como el sidebar original */}
      <div
        className={`flex flex-none items-center border-t border-gray-200 dark:border-white/[.06] py-4 ${open ? 'justify-start gap-2.5 px-4' : 'justify-center px-2'
          }`}
      >
        {/* Modo claro: el 4 en negro; modo oscuro: el original con el 4 en blanco */}
        <img src={logoFootClaro} alt="industria 4" className="h-7 w-7 flex-shrink-0 object-contain dark:hidden" />
        <img src={logoFoot} alt="industria 4" className="hidden h-7 w-7 flex-shrink-0 object-contain dark:block" />
        {open && (
          <span className="min-w-0 truncate text-sm font-bold tracking-tight text-gray-900 dark:text-white">
            industria 4
          </span>
        )}
      </div>
    </aside>
  );
}
