import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faPaperPlane, faPlus, faTrash, faCartPlus, faListUl } from '@fortawesome/free-solid-svg-icons';
import { Campo, Card, CardTitulo, Encabezado, EstadoConsulta } from '@/shared/components/base';
import { BOTON, INPUT, TD, TH } from '@/shared/components/clases';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { toast } from '@/shared/lib/alertas';
import { useSesion } from '@/shared/lib/auth';
import { getMateriasPrimas, getOrden, getProveedores, guardarOrden, totalOrden } from '../lib/api';
import { pesos } from '../lib/estados';

const enDias = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const itemVacio = () => ({ codigo: '', cantidad: '', precio: '' });

/** Alta (/compras/ordenes/nueva[?mp=MP-205]) y edición en borrador (/compras/ordenes/:id/editar) */
export default function OrdenForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useSesion();

  const { datos, cargando, error } = useConsulta(async () => {
    const [proveedores, materias, orden] = await Promise.all([
      getProveedores(),
      getMateriasPrimas(),
      id ? getOrden(id) : null,
    ]);
    return { proveedores, materias, orden };
  }, [id]);

  if (cargando || error) return <EstadoConsulta cargando={cargando} error={error} />;
  if (datos.orden && datos.orden.estado !== 'borrador') {
    return <EstadoConsulta vacio textoVacio="Solo se pueden editar órdenes en borrador." />;
  }
  return <Formulario {...datos} mpInicial={params.get('mp')} usuario={usuario} navigate={navigate} />;
}

// El formulario se monta con los datos ya cargados: así el estado inicial sale de ellos
function Formulario({ proveedores, materias, orden, mpInicial, usuario, navigate }) {
  const mp = (codigo) => materias.find((m) => m.codigo === codigo);
  const inicialMp = mpInicial && mp(mpInicial);

  const [form, setForm] = useState(() =>
    orden
      ? { ...orden }
      : {
          proveedorId: inicialMp?.proveedorId ?? '',
          fechaEntrega: enDias(7),
          observaciones: '',
          items: inicialMp
            ? [{ codigo: inicialMp.codigo, cantidad: Math.max(inicialMp.stockMinimo * 2 - inicialMp.stock, 1), precio: inicialMp.precioRef }]
            : [itemVacio()],
        },
  );
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');

  const campo = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cambiarItem = (i, k, v) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, j) => {
        if (j !== i) return it;
        const nuevo = { ...it, [k]: v };
        // Al elegir la MP se propone su precio de referencia
        if (k === 'codigo' && !it.precio) nuevo.precio = mp(v)?.precioRef ?? '';
        return nuevo;
      }),
    }));

  const proveedoresActivos = proveedores.filter((p) => p.activo || String(p.id) === String(form.proveedorId));

  const guardar = async (enviar) => {
    setAviso('');
    const items = form.items.filter((i) => i.codigo && Number(i.cantidad) > 0);
    if (!form.proveedorId) return setAviso('Elegí un proveedor.');
    if (!items.length) return setAviso('Agregá al menos un ítem con cantidad.');
    setGuardando(true);
    try {
      const oc = await guardarOrden(
        {
          ...form,
          proveedorId: Number(form.proveedorId),
          items: items.map((i) => ({ codigo: i.codigo, cantidad: Number(i.cantidad), precio: Number(i.precio) || 0 })),
        },
        usuario,
        { enviar },
      );
      toast(`${oc.numero} ${enviar ? 'enviada a aprobación' : 'guardada como borrador'}`, 'aprobado');
      navigate(`/compras/ordenes/${oc.id}`, { replace: true });
    } catch (e) {
      setAviso(e.message);
      setGuardando(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <Encabezado
        titulo={orden ? `Editar ${orden.numero}` : 'Nueva orden de compra'}
        descripcion="La orden queda en borrador hasta enviarla a aprobación."
        icono={faCartPlus}
      />

      <Card as="div" className="flex flex-wrap items-end gap-x-[18px] gap-y-3.5">
        <Campo etiqueta="Proveedor">
          <select className={INPUT} value={form.proveedorId} onChange={campo('proveedorId')} required>
            <option value="">Elegir…</option>
            {proveedoresActivos.map((p) => (
              <option key={p.id} value={p.id}>{p.razonSocial}</option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Fecha de entrega">
          <input type="date" className={INPUT} value={form.fechaEntrega} onChange={campo('fechaEntrega')} />
        </Campo>
        <Campo etiqueta="Observaciones" className="flex min-w-[240px] flex-[2] basis-[300px] flex-col gap-1.5">
          <input type="text" className={INPUT} value={form.observaciones} onChange={campo('observaciones')} placeholder="Ej.: entregar con certificado de análisis" />
        </Campo>
      </Card>

      <Card as="div" className="flex flex-col gap-2.5">
        <CardTitulo icono={faListUl} acciones={
          <button type="button" className={BOTON.secundario} onClick={() => setForm((f) => ({ ...f, items: [...f.items, itemVacio()] }))}>
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            Agregar ítem
          </button>
        }>
          Ítems
        </CardTitulo>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr>
                <th scope="col" className={`${TH} text-left`}>Materia prima</th>
                <th scope="col" className={`${TH} w-36 text-right`}>Cantidad</th>
                <th scope="col" className={`${TH} w-40 text-right`}>Precio unit.</th>
                <th scope="col" className={`${TH} w-36 text-right`}>Subtotal</th>
                <th scope="col" className={`${TH} w-12`}><span className="sr-only">Quitar</span></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, i) => (
                <tr key={i} className="border-t border-gray-200 dark:border-slate-800">
                  <td className={TD}>
                    <select aria-label={`Materia prima del ítem ${i + 1}`} className={INPUT} value={it.codigo} onChange={(e) => cambiarItem(i, 'codigo', e.target.value)}>
                      <option value="">Elegir…</option>
                      {materias.map((m) => (
                        <option key={m.codigo} value={m.codigo}>{m.codigo} · {m.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className={TD}>
                    <input aria-label={`Cantidad del ítem ${i + 1}`} type="number" min="0" step="any" className={`${INPUT} text-right`} value={it.cantidad} onChange={(e) => cambiarItem(i, 'cantidad', e.target.value)} />
                  </td>
                  <td className={TD}>
                    <input aria-label={`Precio del ítem ${i + 1}`} type="number" min="0" step="any" className={`${INPUT} text-right`} value={it.precio} onChange={(e) => cambiarItem(i, 'precio', e.target.value)} />
                  </td>
                  <td className={`${TD} text-right font-bold tabular-nums`}>
                    {pesos(Number(it.cantidad || 0) * Number(it.precio || 0))}
                  </td>
                  <td className={`${TD} text-center`}>
                    <button
                      type="button"
                      aria-label={`Quitar ítem ${i + 1}`}
                      disabled={form.items.length === 1}
                      onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-red-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-red-400 dark:hover:bg-slate-800"
                    >
                      <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 dark:border-slate-700">
                <td colSpan={3} className={`${TD} text-right font-bold uppercase`}>Total</td>
                <td className={`${TD} text-right text-lg font-extrabold tabular-nums`}>{pesos(totalOrden(form))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {aviso && <p role="alert" className="m-0 mr-auto text-sm font-medium text-red-600 dark:text-red-400">{aviso}</p>}
        <button type="button" className={BOTON.secundario} onClick={() => navigate(-1)} disabled={guardando}>
          Cancelar
        </button>
        <button type="button" className={BOTON.primario} onClick={() => guardar(false)} disabled={guardando}>
          <FontAwesomeIcon icon={faFloppyDisk} aria-hidden="true" />
          Guardar borrador
        </button>
        <button type="button" className={BOTON.marca} onClick={() => guardar(true)} disabled={guardando}>
          <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
          Enviar a aprobación
        </button>
      </div>
    </form>
  );
}
