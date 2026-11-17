import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Cargando from '@/shared/components/Cargando';
import { useTituloVista } from '@/shared/hooks/useTituloVista';
import { ModuloSelector, ModuloTabs } from './ModuloNav';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import TopBar from './TopBar';

export default function Layout() {
  const { titulo } = useTituloVista();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 1024,
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Clic fuera del menú lateral: lo cierra (en escritorio queda contraído a íconos).
  // Se ignoran los clics en el propio menú y en los botones que lo abren/cierran (aria-controls).
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (e) => {
      const menu = document.getElementById('menu-lateral');
      if (menu?.contains(e.target)) return;
      if (e.target.closest?.('[aria-controls="menu-lateral"]')) return;
      setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  // Título de la pestaña del navegador
  useEffect(() => {
    document.title = `${titulo} · MES SPH`;
  }, [titulo]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-slate-950 text-gray-900 dark:text-white">
      <TopBar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} />

      <div className="relative flex min-h-0 flex-1">
        {menuOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 top-[72px] z-20 cursor-default bg-black/40 lg:hidden"
          />
        )}

        <Sidebar
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onToggle={() => setMenuOpen((v) => !v)}
        />

        {/* Columna de contenido: solapas (escritorio) + página. Al estar al lado del menú
            lateral, las solapas se corren cuando el menú se expande o se contrae. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ModuloTabs className="hidden lg:block" />

          <main className="textura-fondo min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-200 p-4 sm:p-6 dark:bg-slate-950">
            {/* Celular / tablet: selector de módulo y, en celular, el nombre de la vista
              (en el TopBar se oculta para centrar el logo) */}
            <div className="mb-3 flex min-w-0 items-center gap-2 lg:hidden">
              <ModuloSelector className="flex" />
              <span className="inline-flex min-w-0 items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 shadow-md dark:border-white dark:shadow-none sm:hidden">
                <span className="truncate text-[13px] font-extrabold leading-tight">{titulo}</span>
              </span>
            </div>
            {/* Las páginas de cada módulo se cargan bajo demanda (React.lazy) */}
            <Suspense key={pathname.split('/')[1]} fallback={<Cargando />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
