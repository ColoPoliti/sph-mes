import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { ROLES, PERMISOS, useSesion } from '@/shared/lib/auth';
import { Card } from './base';
import { BOTON } from './clases';
import { subClass } from './ui';
import LoginModal from './LoginModal';

/**
 * Protege un grupo de rutas (o un bloque, si se le pasan children). Sin sesión ofrece
 * iniciar sesión; con sesión sin permiso explica qué perfiles pueden entrar.
 * Es reactivo: al loguearse muestra el contenido sin recargar.
 *
 * OJO: es una protección de interfaz. La API debe validar los permisos por su cuenta.
 */
export default function RequierePermiso({ permiso, children }) {
  const { usuario, rol, puede } = useSesion();
  const [login, setLogin] = useState(false);

  if (puede(permiso)) return children ?? <Outlet />;

  const perfiles = (PERMISOS[permiso] || []).map((r) => ROLES[r]).join(', ');
  return (
    <div className="flex justify-center pt-10">
      <Card className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-500/10 text-2xl text-gray-500 dark:bg-slate-400/15 dark:text-slate-300">
          <FontAwesomeIcon icon={faLock} aria-hidden="true" />
        </span>
        <h1 className="m-0 text-xl font-extrabold">
          {usuario ? 'No tenés acceso a esta sección' : 'Esta sección requiere iniciar sesión'}
        </h1>
        <p className={`m-0 ${subClass}`}>
          {usuario
            ? `Tu perfil (${ROLES[rol] || rol}) no tiene permiso. Pueden entrar: ${perfiles}.`
            : `Pueden entrar los perfiles: ${perfiles}.`}
        </p>
        <button type="button" className={BOTON.marca} onClick={() => setLogin(true)}>
          <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
          {usuario ? 'Ingresar con otras credenciales' : 'Iniciar sesión'}
        </button>
        <LoginModal abierto={login} onCerrar={() => setLogin(false)} />
      </Card>
    </div>
  );
}
