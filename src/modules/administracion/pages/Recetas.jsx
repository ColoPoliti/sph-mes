import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faMagnifyingGlass, faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitulo, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import { BOTON, INPUT, TD, TH } from '@/shared/components/clases';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { confirmar, toast } from '@/shared/lib/alertas';
import { useSesion } from '@/shared/lib/auth';
import { BASE_KG, INSUMOS, TAMANOS_TOLVA, aPantalla, eliminarReceta, escalar, getRecetas, totalKg } from '../lib/api';

const cant = (v) =>
  v === '' || v === null || v === undefined
    ? '—'
    : Number(v).toLocaleString('es-AR', { maximumFractionDigits: 3 });

const BOTON_ICONO =
  'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

export default function Recetas() {
  const { puede } = useSesion();
  const puedeEditar = puede('admin.editar');
  const { datos, cargando, error, recargar } = useConsulta(getRecetas, [], { inicial: [] });
  const [texto, setTexto] = useState('');
  const [kg, setKg] = useState(BASE_KG);

  const filas = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return datos.filter(
      (r) =>
        !t ||
        [r.codigo_barra, r.producto?.nombre, r.producto?.sku, ...(r.insumos || []).map((i) => i.codigo_mp)].some(
          (v) => String(v ?? '').toLowerCase().includes(t),
        ),
    );
  }, [datos, texto]);

  const eliminar = async (r) => {
    const ok = await confirmar({
      titulo: `¿Eliminar la receta ${r.codigo_barra}?`,
      texto: r.producto?.nombre,
      confirmar: 'Eliminar',
      peligro: true,
      icono: 'warning',
    });
    if (!ok) return;
    await eliminarReceta(r.id);
    recargar();
    toast(`Receta ${r.codigo_barra} eliminada`, 'rechazado');
  };

  const insumo = (r, etapa) => escalar(r, kg).find((i) => i.etapa === etapa);

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Maestro de tolvas"
        descripcion="Receta de cada producto a partir de su código"
        icono={faFlask}
        acciones={
          puedeEditar && (
            <Link to="/administracion/tolvas/nueva" className={BOTON.marca}>
              <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
              Nueva receta
            </Link>
          )
        }
      />

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitulo icono={faFlask} extra={`${filas.length} recetas`}>
            Recetas
          </CardTitulo>
          <div className="ml-auto flex items-center gap-1" role="group" aria-label="Tamaño de tolva">
            {TAMANOS_TOLVA.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={kg === t}
                onClick={() => setKg(t)}
                className={`min-h-9 cursor-pointer rounded-lg px-3 text-sm font-bold tabular-nums transition-colors ${
                  kg === t
                    ? 'bg-slate-900 text-white dark:bg-teal-600'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Tolva {t} kg
              </button>
            ))}
          </div>
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Buscar</span>
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Código, producto, SKU o MP…"
              className={`${INPUT} pl-9`}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </label>
        </div>
        <Nota>
          Cada receta se carga para una tolva de {BASE_KG} kg; la de 250 kg se calcula proporcionalmente. Cantidades en kg
          (el colorante en ml), igual que las recibe el PLC.
        </Nota>
        <EstadoConsulta
          cargando={cargando}
          error={error}
          vacio={!filas.length}
          textoVacio={datos.length ? 'Ninguna receta cumple con la búsqueda.' : 'Todavía no hay recetas cargadas.'}
        />

        {filas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px]">
              <caption className="sr-only">Maestro de tolvas</caption>
              <thead>
                <tr>
                  <th scope="col" className={`${TH} text-left`}>Código</th>
                  <th scope="col" className={`${TH} text-left`}>Producto</th>
                  {INSUMOS.map((i) => (
                    <th key={i.etapa} scope="col" className={`${TH} text-right`}>
                      {i.nombre} <span className="normal-case">({i.unidad})</span>
                    </th>
                  ))}
                  <th scope="col" className={`${TH} text-right`}>Total (kg)</th>
                  {puedeEditar && <th scope="col" className={`${TH} text-right`}><span className="sr-only">Acciones</span></th>}
                </tr>
              </thead>
              <tbody>
                {filas.map((r) => (
                  <tr key={r.id} className="border-t border-gray-200 dark:border-slate-800">
                    <td className={`${TD} font-bold tabular-nums`}>{r.codigo_barra}</td>
                    <td className={TD}>
                      <span className="block">{r.producto?.nombre}</span>
                      {r.producto?.sku && (
                        <span className="block text-[13px] text-gray-500 dark:text-slate-400">SKU {r.producto.sku}</span>
                      )}
                    </td>
                    {INSUMOS.map((i) => {
                      const ins = insumo(r, i.etapa);
                      return (
                        <td key={i.etapa} className={`${TD} text-right tabular-nums`}>
                          <span className="block font-bold">{cant(aPantalla(ins?.sp, i.unidad))}</span>
                          {ins?.codigo_mp && (
                            <span className="block text-[13px] text-gray-500 dark:text-slate-400">{ins.codigo_mp}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className={`${TD} text-right font-bold tabular-nums`}>{cant(totalKg(escalar(r, kg)))}</td>
                    {puedeEditar && (
                      <td className={`${TD} whitespace-nowrap text-right`}>
                        <span className="inline-flex gap-1.5">
                          <Link
                            to={`/administracion/tolvas/${r.id}/editar`}
                            className={BOTON_ICONO}
                            aria-label={`Editar la receta ${r.codigo_barra}`}
                          >
                            <FontAwesomeIcon icon={faPen} aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            className={`${BOTON_ICONO} hover:!text-red-600 dark:hover:!text-red-400`}
                            onClick={() => eliminar(r)}
                            aria-label={`Eliminar la receta ${r.codigo_barra}`}
                          >
                            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                          </button>
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
