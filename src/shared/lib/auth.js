// Sesión y permisos del MES.
//
// Perfiles:
//   admin    -> todo
//   calidad  -> aprueba/rechaza lotes de producción e ingresos de materia prima
//   compras  -> gestiona proveedores, materias primas y órdenes de compra
//   usuario  -> solo consulta
//
// PROVISORIO: las credenciales se validan acá, en el navegador. Cuando exista el
// login real (ej.: login.php contra la base), reemplazar SOLO el cuerpo de
// validarCredenciales por esa consulta (debe devolver el perfil o null).
// Mientras tanto se toman de .env.local y, si no están definidas, usuario = clave:
//   admin / admin · calidad / calidad · compras / compras · usuario / usuario

import { useSyncExternalStore } from 'react';

const CLAVE_SESION = 'sph-mes-sesion';

export const ROLES = {
  admin: 'Administrador',
  calidad: 'Calidad',
  compras: 'Compras',
  usuario: 'Consulta',
};

// Permiso -> perfiles que lo tienen. Los módulos y las acciones preguntan por permiso, nunca por rol.
export const PERMISOS = {
  'calidad.ver': ['admin', 'calidad', 'usuario'],
  'calidad.aprobar': ['admin', 'calidad'],
  'compras.ver': ['admin', 'compras', 'usuario'],
  'compras.editar': ['admin', 'compras'],
  'compras.aprobar': ['admin'],
};

export const puede = (rol, permiso) => Boolean(rol) && (PERMISOS[permiso] || []).includes(rol);

export async function validarCredenciales(usuario, clave) {
  const u = usuario.trim();
  const env = import.meta.env;
  const cuentas = Object.keys(ROLES).map((rol) => {
    const k = rol.toUpperCase();
    return { usuario: env[`VITE_${k}_USER`] || rol, clave: env[`VITE_${k}_PASS`] || rol, rol };
  });
  return cuentas.find((c) => c.usuario === u && c.clave === clave)?.rol || null;
}

export async function iniciarSesion(usuario, clave) {
  const rol = await validarCredenciales(usuario, clave);
  if (rol) {
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario: usuario.trim(), rol }));
    } catch {
      /* sin storage: la sesión dura lo que la página */
    }
    avisarCambio();
  }
  return Boolean(rol);
}

// ---- Aviso de cambios de sesión, para que la pantalla se actualice sin refrescar ----
const EVENTO = 'sph-sesion';
const avisarCambio = () => window.dispatchEvent(new Event(EVENTO));

const suscribir = (cb) => {
  window.addEventListener(EVENTO, cb);
  return () => window.removeEventListener(EVENTO, cb);
};

const leerCruda = () => {
  try {
    return sessionStorage.getItem(CLAVE_SESION);
  } catch {
    return null;
  }
};

const sesion = () => {
  try {
    return JSON.parse(leerCruda() || 'null');
  } catch {
    return null;
  }
};

export const usuarioActual = () => sesion()?.usuario || null;
export const rolActual = () => sesion()?.rol || null;

/**
 * Sesión actual reactiva: el componente se vuelve a dibujar al iniciar o cerrar sesión.
 * Devuelve { usuario, rol, puede(permiso) }.
 */
export function useSesion() {
  useSyncExternalStore(suscribir, leerCruda);
  const rol = rolActual();
  return { usuario: usuarioActual(), rol, puede: (permiso) => puede(rol, permiso) };
}

export function cerrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    /* nada */
  }
  avisarCambio();
}
