// Controles de Auditoría sobre cada tolva (cada ciclo de uso de una tolva).
//
// Según el dueño: luego de aprobada por Calidad, la tolva sale a Producción y Auditoría
// controla cada tolva revisando papeles (no mide líquidos). No bloquea el uso (confirmado).
//
// SUPUESTO: el resultado del control es "controlada", con observaciones opcionales.
//
// PROVISORIO: se guarda en este navegador (localStorage), por id de ciclo (código@asignación).
// Cuando exista el endpoint, reemplazar leer/guardar por llamadas a la API.

const CLAVE = 'sph-auditorias';

const leer = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || '{}');
  } catch {
    return {};
  }
};

const guardar = (datos) => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    /* sin storage */
  }
};

export const getAuditorias = async () => leer();

export async function registrarControl(idCiclo, observaciones, usuario) {
  const datos = leer();
  datos[idCiclo] = { observaciones: String(observaciones || '').trim(), usuario, fecha: new Date().toISOString() };
  guardar(datos);
}

export async function quitarControl(idCiclo) {
  const datos = leer();
  delete datos[idCiclo];
  guardar(datos);
}
