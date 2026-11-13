import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { moduloDeRuta } from '@/app/modulos';
import SalasMenu from '@/modules/monitoreo/components/SalasMenu';
import logoFoot from '@/assets/logo-foot.png';
import ModuloNav from './ModuloNav';

const esMovil = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;

/**
 * Ítem del menú lateral (mismo diseño que "Historial de elaboraciones" del monitor original):
 * título arriba y, abajo, el ícono con un subtítulo. Activo = fila slate oscura con borde teal.
 */
function MenuItem({ item, open, onNavegar }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavegar}
      title={item.label}
      aria-label={item.sub ? `${item.label} · ${item.sub}` : item.label}
      className={({ isActive }) =>
        `-mx-2 block border-b border-slate-400 px-2 transition-colors dark:border-black ${
          open ? 'py-1' : 'flex justify-center py-1.5'
        } ${
          isActive
            ? 'border-l-4 border-l-teal-600 bg-slate-900 pl-1 dark:border-l-teal-600 dark:bg-slate-900'
            : 'bg-slate-100 hover:bg-gray-200/70 dark:bg-slate-900/50 dark:hover:bg-slate-800/60'
        }`
      }
    >
      {({ isActive }) =>
        open ? (
          <span className="flex min-h-11 w-full flex-col justify-center rounded-lg py-2 pl-4 pr-2 text-left">
            <span
              className={`block w-full truncate text-[14px] font-extrabold ${
                isActive ? 'text-white' : 'text-gray-600 dark:text-slate-300'
              }`}
            >
              {item.label}
            </span>
            {item.sub && (
              <span className="flex w-full min-w-0 items-center gap-2">
                <FontAwesomeIcon
                  icon={item.icono}
                  className="w-3 flex-none text-[10px] text-teal-600 dark:text-teal-400"
                  aria-hidden="true"
                />
                <span
                  className={`truncate text-[12px] font-medium ${
                    isActive ? 'text-white/85' : 'text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {item.sub}
                </span>
              </span>
            )}
          </span>
        ) : (
          <span className="flex h-11 w-full items-center justify-center px-1">
            <FontAwesomeIcon
              icon={item.icono}
              className={`text-base ${isActive ? 'text-teal-400' : 'text-teal-600 dark:text-teal-400'}`}
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
    <aside
      id="menu-lateral"
      aria-label={`Menú de ${modulo.label}`}
      className={`${
        open ? 'flex w-[280px] lg:w-64' : 'hidden lg:flex lg:w-[88px]'
      } fixed bottom-0 left-0 top-[72px] z-30 flex-col overflow-hidden border-r border-slate-400 bg-white shadow-md dark:border-slate-900 dark:bg-slate-950 dark:shadow-none transition-[width] duration-200 lg:static lg:bottom-auto lg:top-auto lg:z-auto lg:h-full lg:flex-none`}
    >
      {/* Encabezado: nombre del módulo y flecha para contraer o expandir el menú */}
      <div
        className={`flex h-14 flex-none items-center border-b border-slate-400 dark:border-black ${
          open ? 'justify-between px-4' : 'justify-center px-2'
        }`}
      >
        {open && (
          <span className="flex min-w-0 items-center gap-2 truncate text-[11px] font-extrabold uppercase tracking-[1.6px] text-gray-500 dark:text-slate-400">
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
          className="hidden h-8 w-8 flex-none lg:flex cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
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
        {/* Mobile / tablet: cambio de módulo (en escritorio están las pestañas del TopBar) */}
        {open && (
          <div className="-mx-2 border-b border-slate-400 px-3 py-3 dark:border-black xl:hidden">
            <ModuloNav vertical className="flex" onNavegar={cerrarSiMovil} />
          </div>
        )}

        {modulo.menu.map((item) => (
          <MenuItem key={item.to} item={item} open={open} onNavegar={cerrarSiMovil} />
        ))}

        {modulo.menuSalas && <SalasMenu open={open} onNavegar={cerrarSiMovil} />}
      </nav>

      {/* Logo al pie, como el sidebar original */}
      <div
        className={`flex flex-none items-center border-t border-slate-400 dark:border-black py-4 ${
          open ? 'justify-start gap-2.5 px-4' : 'justify-center px-2'
        }`}
      >
        <img src={logoFoot} alt="industria 4" className="h-7 w-7 flex-shrink-0 object-contain" />
        {open && (
          <span className="min-w-0 truncate font-montserrat text-sm font-bold tracking-tight text-gray-900 dark:text-white">
            industria 4
          </span>
        )}
      </div>
    </aside>
  );
}
