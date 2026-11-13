import { useCallback, useEffect, useState } from 'react';

/**
 * Carga asíncrona con estado de carga, error y recarga.
 *
 *   const { datos, cargando, error, recargar, setDatos } = useConsulta(() => getOrdenes(f), [f]);
 *
 * - Ignora respuestas viejas si las dependencias cambian antes de que termine.
 * - intervaloMs (opcional): vuelve a consultar cada tanto (ej.: 60000).
 */
export function useConsulta(fn, deps = [], { inicial = null, intervaloMs } = {}) {
  const [estado, setEstado] = useState({ datos: inicial, cargando: true, error: null });
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelado = false;
    const correr = () => {
      setEstado((e) => ({ ...e, cargando: true }));
      Promise.resolve()
        .then(fn)
        .then((datos) => !cancelado && setEstado({ datos, cargando: false, error: null }))
        .catch((error) => !cancelado && setEstado((e) => ({ ...e, cargando: false, error })));
    };
    correr();
    const id = intervaloMs ? setInterval(correr, intervaloMs) : null;
    return () => {
      cancelado = true;
      if (id) clearInterval(id);
    };
    // fn cambia en cada render: las dependencias las define quien llama
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version, intervaloMs]);

  const setDatos = useCallback(
    (fnOValor) =>
      setEstado((e) => ({
        ...e,
        datos: typeof fnOValor === 'function' ? fnOValor(e.datos) : fnOValor,
      })),
    [],
  );

  return { ...estado, recargar, setDatos };
}
