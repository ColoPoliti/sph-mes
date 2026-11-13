import { useState } from 'react';
import { faFlaskVial } from '@fortawesome/free-solid-svg-icons';
import { Card, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import { useSesion } from '@/shared/lib/auth';
import { dictaminarRecepcion } from '@/modules/compras/lib/api';
import { useDatosCompras } from '@/modules/compras/lib/useDatosCompras';
import TablaRecepciones from '@/modules/compras/components/TablaRecepciones';
import { ESTADOS_RECEPCION } from '@/modules/compras/lib/estados';
import { confirmarQuitarAprobacion, preguntarDecision, toastCalidad } from '../lib/alertasCalidad';

/**
 * Inspección de materia prima recibida (las recepciones las genera Compras).
 * Al liberar un ingreso, su cantidad pasa a stock disponible.
 */
export default function IngresosMP() {
  const { usuario, puede } = useSesion();
  const puedeAprobar = puede('calidad.aprobar');
  const { recepciones, mp, orden, cargando, error, recargar } = useDatosCompras();
  const [estado, setEstado] = useState('pendiente');

  const filas = recepciones.filter((r) => estado === 'todos' || r.estado === estado);

  const dictaminar = async (r) => {
    // Adapta la recepción a la forma que esperan los modales de calidad
    const fila = {
      id: r.id,
      ref: `ingreso ${r.numero}`,
      nombre_producto: `${mp[r.codigo]?.nombre || r.codigo} · lote ${r.loteProveedor || 's/d'}`,
      estado: r.estado,
      calidad: r.calidad,
    };
    let decision;
    if (r.estado === 'aprobado') {
      if (!(await confirmarQuitarAprobacion(fila))) return;
      decision = { decision: 'quitar' };
    } else {
      decision = await preguntarDecision(fila);
      if (!decision) return;
    }
    await dictaminarRecepcion(r.id, decision, usuario);
    const textos = { aprobado: 'Liberaste', rechazado: 'Rechazaste', quitar: 'Volviste a inspección' };
    toastCalidad(`${textos[decision.decision]} el ingreso ${r.numero}`, decision.decision === 'quitar' ? 'neutro' : decision.decision);
    recargar();
  };

  const cuenta = (k) => recepciones.filter((r) => r.estado === k).length;

  return (
    <div className="flex flex-col gap-4">
      <Encabezado titulo="Ingresos de materia prima" descripcion="Inspección y liberación de lo recibido por Compras." icono={faFlaskVial} />

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {[['pendiente', ESTADOS_RECEPCION.pendiente.texto], ['aprobado', 'Liberados'], ['rechazado', 'Rechazados'], ['todos', 'Todos']].map(([k, t]) => (
            <button
              key={k}
              type="button"
              aria-pressed={estado === k}
              onClick={() => setEstado(k)}
              className={`min-h-9 cursor-pointer rounded-lg px-3 text-sm font-bold transition-colors ${
                estado === k
                  ? 'bg-slate-900 text-white dark:bg-teal-600'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t} <span className="tabular-nums opacity-70">{k === 'todos' ? recepciones.length : cuenta(k)}</span>
            </button>
          ))}
        </div>

        <EstadoConsulta cargando={cargando} error={error} vacio={!filas.length} textoVacio="No hay ingresos en este estado." />
        {filas.length > 0 && (
          <TablaRecepciones filas={filas} mp={mp} orden={orden} onDictaminar={puedeAprobar ? dictaminar : undefined} />
        )}
        <Nota>Liberar un ingreso suma su cantidad al stock de la materia prima; quitar la liberación la descuenta.</Nota>
      </Card>
    </div>
  );
}
