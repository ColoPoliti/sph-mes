// Almacén local (localStorage) con interfaz asíncrona, para módulos que todavía no tienen API.
//
// Cada colección se comporta como un endpoint REST: listar / obtener / guardar / eliminar
// devuelven Promesas. Cuando exista el backend, se reemplaza la implementación de la
// colección (en el api.js del módulo) por llamadas a http.js sin tocar las pantallas.

const PREFIJO = 'sph-mes:';

const leer = (clave) => {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
};

const escribir = (clave, datos) => {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(datos));
  } catch {
    /* sin storage: los cambios duran lo que la página */
  }
};

// Copia profunda simple: las pantallas nunca reciben referencias al almacén
const copia = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

/**
 * @param {string} nombre      nombre de la colección (clave en localStorage)
 * @param {() => object[]} semilla  datos iniciales si la colección está vacía
 * @param {{ version?: number }} opciones  subir la versión vuelve a sembrar los datos
 */
export function crearColeccion(nombre, semilla = () => [], { version = 1 } = {}) {
  const clave = `${nombre}@v${version}`;
  let memoria = null;

  const todos = () => {
    if (!memoria) memoria = leer(clave) ?? semilla();
    return memoria;
  };
  const persistir = (lista) => {
    memoria = lista;
    escribir(clave, lista);
  };

  const sigId = () => todos().reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;

  return {
    async listar(filtro) {
      const lista = todos();
      return copia(filtro ? lista.filter(filtro) : lista);
    },
    async obtener(id) {
      const r = todos().find((x) => String(x.id) === String(id));
      if (!r) throw new Error(`No existe el registro ${id} en ${nombre}`);
      return copia(r);
    },
    // Alta si no tiene id; modificación si ya existe
    async guardar(registro) {
      const lista = todos();
      if (registro.id == null) {
        const nuevo = { ...registro, id: sigId() };
        persistir([...lista, nuevo]);
        return copia(nuevo);
      }
      const previo = lista.find((r) => String(r.id) === String(registro.id));
      if (!previo) throw new Error(`No existe el registro ${registro.id} en ${nombre}`);
      const actualizado = { ...previo, ...registro };
      persistir(lista.map((r) => (r === previo ? actualizado : r)));
      return copia(actualizado);
    },
    async eliminar(id) {
      persistir(todos().filter((r) => String(r.id) !== String(id)));
    },
    // Vuelve a los datos de ejemplo (útil en desarrollo)
    async reiniciar() {
      persistir(semilla());
    },
  };
}

// Número correlativo con prefijo: 'OC', 7 -> 'OC-0007'
export const numerar = (prefijo, n) => `${prefijo}-${String(n).padStart(4, '0')}`;

export const ahoraISO = () => new Date().toISOString();
