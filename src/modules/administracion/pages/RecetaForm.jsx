import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faFloppyDisk, faListUl } from '@fortawesome/free-solid-svg-icons';
import { Campo, Card, CardTitulo, Encabezado, EstadoConsulta } from '@/shared/components/base';
import { BOTON, INPUT, TD, TH } from '@/shared/components/clases';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { toast } from '@/shared/lib/alertas';
import { useSesion } from '@/shared/lib/auth';
import { BASE_KG, INSUMOS, TAMANOS_TOLVA, aKg, aPantalla, getReceta, guardarReceta } from '../lib/api';
import Tooltip from '@/shared/components/Tooltip';

const cant = (v) => Number(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 3 });
const OTROS = TAMANOS_TOLVA.filter((t) => t !== BASE_KG);

/** Alta (/administracion/tolvas/nueva) y edición (/administracion/tolvas/:id/editar) de una receta */
export default function RecetaForm() {
  const { id } = useParams();
  const { datos, cargando, error } = useConsulta(() => (id ? getReceta(id) : null), [id]);
  if (cargando || error) return <EstadoConsulta cargando={cargando} error={error} />;
  return <Formulario receta={datos} />;
}

// Se monta con la receta ya cargada: así el estado inicial sale de ella
function Formulario({ receta }) {
  const navigate = useNavigate();
  const { usuario } = useSesion();
  const [form, setForm] = useState(() => ({
    codigo_barra: receta?.codigo_barra || '',
    nombre: receta?.producto?.nombre || '',
    sku: receta?.producto?.sku || '',
    insumos: INSUMOS.map((i) => {
      const previo = receta?.insumos?.find((x) => x.etapa === i.etapa);
      return { etapa: i.etapa, codigo_mp: previo?.codigo_mp || '', cantidad: aPantalla(previo?.sp, i.unidad) };
    }),
  }));
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');

  // Total cargado en kg (el colorante se carga en ml)
  const total = INSUMOS.reduce((t, i) => {
    const x = form.insumos.find((y) => y.etapa === i.etapa);
    return t + (x.cantidad === '' ? 0 : aKg(x.cantidad, i.unidad) || 0);
  }, 0);

  const campo = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cambiarInsumo = (etapa, k, v) =>
    setForm((f) => ({ ...f, insumos: f.insumos.map((x) => (x.etapa === etapa ? { ...x, [k]: v } : x)) }));

  const guardar = async (e) => {
    e.preventDefault();
    setAviso('');
    const negativo = form.insumos.some((x) => x.cantidad !== '' && !(Number(x.cantidad) >= 0));
    if (negativo) return setAviso('Las cantidades tienen que ser números mayores o iguales a 0.');
    setGuardando(true);
    try {
      await guardarReceta(
        {
          id: receta?.id,
          codigo_barra: form.codigo_barra,
          producto: { nombre: form.nombre, sku: form.sku },
          insumos: INSUMOS.map((i) => {
            const x = form.insumos.find((y) => y.etapa === i.etapa);
            return {
              etapa: i.etapa,
              nombre: i.nombre,
              codigo_mp: x.codigo_mp.trim(),
              sp: x.cantidad === '' ? 0 : aKg(x.cantidad, i.unidad),
            };
          }),
        },
        usuario,
      );
      toast(`Receta ${form.codigo_barra.trim()} guardada`, 'aprobado');
      navigate('/administracion/tolvas');
    } catch (err) {
      setAviso(err.message);
      setGuardando(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={guardar} noValidate>
      <Encabezado
        titulo={receta ? `Receta ${receta.codigo_barra}` : 'Nueva receta'}
        descripcion="Maestro de tolvas"
        icono={faFlask}
        acciones={
          <Tooltip texto="Volver al listado del maestro de tolvas">
            <Link to="/administracion/tolvas" className={BOTON.secundario}>
              <FontAwesomeIcon icon={faListUl} aria-hidden="true" />
              Volver al listado
            </Link>
          </Tooltip>
        }
      />

      <Card className="flex flex-col gap-4">
        <CardTitulo icono={faFlask}>Producto</CardTitulo>
        <div className="flex flex-wrap gap-4">
          <Campo etiqueta="Código *">
            <input className={`${INPUT} codigo`} value={form.codigo_barra} onChange={campo('codigo_barra')} required inputMode="numeric" />
          </Campo>
          <Campo etiqueta="Producto *">
            <input className={INPUT} value={form.nombre} onChange={campo('nombre')} required />
          </Campo>
          <Campo etiqueta="SKU">
            <input className={INPUT} value={form.sku} onChange={campo('sku')} />
          </Campo>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <CardTitulo icono={faFlask} extra={`Cantidades para una tolva de ${BASE_KG} kg`}>Receta</CardTitulo>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <caption className="sr-only">Insumos de la receta</caption>
            <thead>
              <tr>
                <th scope="col" className={`${TH} text-left`}>Insumo</th>
                <th scope="col" className={`${TH} text-left`}>Código MP</th>
                <th scope="col" className={`${TH} text-left`}>Cantidad ({BASE_KG} kg)</th>
                {OTROS.map((t) => (
                  <th key={t} scope="col" className={`${TH} text-right`}>Tolva {t} kg</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INSUMOS.map((i) => {
                const x = form.insumos.find((y) => y.etapa === i.etapa);
                return (
                  <tr key={i.etapa} className="border-t border-gray-200 dark:border-slate-800">
                    <th scope="row" className={`${TD} text-left font-bold`}>{i.nombre}</th>
                    <td className={TD}>
                      <input
                        className={`${INPUT} codigo`}
                        aria-label={`Código MP de ${i.nombre}`}
                        value={x.codigo_mp}
                        onChange={(e) => cambiarInsumo(i.etapa, 'codigo_mp', e.target.value)}
                      />
                    </td>
                    <td className={TD}>
                      <span className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className={`${INPUT} text-right tabular-nums`}
                          aria-label={`Cantidad de ${i.nombre} en ${i.unidad}`}
                          value={x.cantidad}
                          onChange={(e) => cambiarInsumo(i.etapa, 'cantidad', e.target.value)}
                        />
                        <span className="w-8 text-[15px] font-bold text-gray-600 dark:text-slate-300">{i.unidad}</span>
                      </span>
                    </td>
                    {OTROS.map((t) => (
                      <td key={t} className={`${TD} text-right tabular-nums text-gray-600 dark:text-slate-300`}>
                        {x.cantidad === '' ? '—' : `${cant((Number(x.cantidad) * t) / BASE_KG)} ${i.unidad}`}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 dark:border-slate-700">
                <th scope="row" colSpan={2} className={`${TD} text-left font-bold`}>Total</th>
                <td className={`${TD} font-bold tabular-nums`}>
                  {cant(total)} kg{' '}
                  <span className="font-medium text-gray-600 dark:text-slate-300">de {BASE_KG} kg</span>
                </td>
                {OTROS.map((t) => (
                  <td key={t} className={`${TD} text-right font-bold tabular-nums text-gray-600 dark:text-slate-300`}>
                    {cant((total * t) / BASE_KG)} kg
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {aviso && (
        <p role="alert" className="m-0 text-sm font-medium text-red-600 dark:text-red-400">
          {aviso}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" className={BOTON.marca} disabled={guardando}>
          <FontAwesomeIcon icon={faFloppyDisk} aria-hidden="true" />
          {guardando ? 'Guardando…' : 'Guardar receta'}
        </button>
      </div>
    </form>
  );
}
