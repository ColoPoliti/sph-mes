import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';

/** Indicador de carga de una pantalla (fallback de Suspense) */
export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-gray-500 dark:text-slate-400">
      <FontAwesomeIcon icon={faGear} className="animate-[spin_3s_linear_infinite] text-xl motion-reduce:animate-none" aria-hidden="true" />
      <span className="text-[15px] font-semibold">{texto}</span>
    </div>
  );
}
