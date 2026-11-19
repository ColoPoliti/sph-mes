import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Globo de ayuda al pasar el mouse o al enfocar con el teclado (mismo estilo que "Arrastrá la tarjeta").
 * Envuelve al elemento: <Tooltip texto="…"><Link …/></Tooltip>.
 * `posicion`: 'arriba' (por defecto) o 'abajo'. Si arriba no hay lugar en la pantalla, se muestra abajo.
 * `ancho`: 'auto' (una línea) o 'ancho' (texto largo, hasta 260 px).
 * `as`: etiqueta del envoltorio ('span' por defecto; 'div' si envuelve bloques).
 * `className="contents"`: el envoltorio no ocupa lugar (no cambia el layout); el globo se ubica según el hijo.
 *
 * El globo se dibuja en el <body> con posición fija, así no lo recorta ningún contenedor con scroll
 * (tablas con overflow, barras de solapas, menú lateral). Lleva una flechita que apunta al elemento.
 */
export const FLECHA_ARRIBA =
  'after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-slate-950 dark:after:border-t-slate-700';
export const FLECHA_ABAJO =
  'after:absolute after:left-1/2 after:bottom-full after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-b-slate-950 dark:after:border-b-slate-700';

const SEPARACION = 8; // px entre el elemento y el globo
const LUGAR_MINIMO = 44; // px libres arriba para mostrarlo arriba

export default function Tooltip({ texto, posicion = 'arriba', ancho = 'auto', as: Envoltorio = 'span', className = '', children }) {
  const ref = useRef(null);
  const [globo, setGlobo] = useState(null); // { x, y, abajo }

  const mostrar = useCallback(() => {
    // Con un envoltorio sin caja (display: contents) se mide el elemento envuelto
    const el = ref.current;
    const caja = el?.getBoundingClientRect();
    const r = caja && !caja.width && !caja.height && el.firstElementChild ? el.firstElementChild.getBoundingClientRect() : caja;
    if (!r) return;
    const abajo = posicion === 'abajo' || r.top < LUGAR_MINIMO;
    setGlobo({ x: r.left + r.width / 2, y: abajo ? r.bottom + SEPARACION : r.top - SEPARACION, abajo });
  }, [posicion]);
  const ocultar = useCallback(() => setGlobo(null), []);

  // Con el globo visible, al desplazar la página o un contenedor se oculta (quedaría corrido)
  useEffect(() => {
    if (!globo) return undefined;
    window.addEventListener('scroll', ocultar, true);
    window.addEventListener('resize', ocultar);
    return () => {
      window.removeEventListener('scroll', ocultar, true);
      window.removeEventListener('resize', ocultar);
    };
  }, [globo, ocultar]);

  if (!texto) return children;

  const tamano = ancho === 'ancho' ? 'w-max max-w-[260px] whitespace-normal text-center' : 'whitespace-nowrap';
  return (
    <Envoltorio
      ref={ref}
      className={className}
      onMouseEnter={mostrar}
      onMouseLeave={ocultar}
      onFocus={mostrar}
      onBlur={ocultar}
      onMouseDown={ocultar}
    >
      {children}
      {globo &&
        createPortal(
          <span
            role="tooltip"
            style={{
              left: globo.x,
              top: globo.y,
              transform: `translate(-50%, ${globo.abajo ? '0' : '-100%'})`,
            }}
            className={`pointer-events-none fixed z-[100] rounded bg-slate-950 px-2 py-1 text-[13px] font-semibold normal-case leading-snug tracking-normal text-white shadow-md dark:bg-slate-700 ${tamano} ${
              globo.abajo ? FLECHA_ABAJO : FLECHA_ARRIBA
            }`}
          >
            {texto}
          </span>,
          document.body,
        )}
    </Envoltorio>
  );
}
