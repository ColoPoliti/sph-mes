import { Link, useRouteError } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { BOTON, CARD } from '@/shared/components/clases';
import { subClass } from '@/shared/components/ui';

/**
 * Error de una pantalla (excepción al renderizar) o ruta inexistente.
 * Al ser el errorElement del router, una pantalla rota no deja la app en blanco.
 */
export default function ErrorRuta({ noEncontrada = false }) {
  const error = useRouteError();
  const titulo = noEncontrada ? 'Página no encontrada' : 'Algo salió mal';
  const detalle = noEncontrada
    ? 'La dirección no corresponde a ninguna pantalla del MES.'
    : error?.message || error?.statusText || 'Error inesperado.';

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className={`${CARD} flex w-full max-w-md flex-col items-center gap-4 text-center`}>
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-4xl text-amber-500" aria-hidden="true" />
        <h1 className="m-0 text-xl font-extrabold">{titulo}</h1>
        <p className={`m-0 break-words ${subClass}`}>{detalle}</p>
        <Link to="/" className={BOTON.primario}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
