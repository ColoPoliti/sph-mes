import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxesStacked,
  faCartPlus,
  faFileInvoiceDollar,
  faHourglassHalf,
  faSackDollar,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitulo, Encabezado, EstadoConsulta, GrillaKpi, Kpi } from '@/shared/components/base';
import { BOTON, TD, TH } from '@/shared/components/clases';
import { useSesion } from '@/shared/lib/auth';
import { bajoMinimo, totalOrden } from '../lib/api';
import { cantidad, fechaAR, pesos } from '../lib/estados';
import { useDatosCompras } from '../lib/useDatosCompras';
import { BarraStock, ChipOC } from '../components/Chips';

export default function PanelCompras() {
  const { puede } = useSesion();
  const { ordenes, materias, proveedor, cargando, error } = useDatosCompras();

  const abiertas = ordenes.filter((o) => ['borrador', 'pendiente', 'aprobada'].includes(o.estado));
  const pendientes = ordenes.filter((o) => o.estado === 'pendiente');
  const comprometido = ordenes.filter((o) => o.estado === 'aprobada').reduce((t, o) => t + totalOrden(o), 0);
  const criticas = materias.filter(bajoMinimo);

  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Panel de compras"
        descripcion="Órdenes en curso y materias primas bajo punto de pedido."
        icono={faFileInvoiceDollar}
        acciones={
          puede('compras.editar') && (
            <Link to="/compras/ordenes/nueva" className={BOTON.marca}>
              <FontAwesomeIcon icon={faCartPlus} aria-hidden="true" />
              Nueva orden
            </Link>
          )
        }
      />

      <GrillaKpi>
        <Kpi titulo="Órdenes abiertas" valor={abiertas.length} icono={faFileInvoiceDollar} tono="violeta" to="/compras/ordenes" />
        <Kpi titulo="Pend. aprobación" valor={pendientes.length} icono={faHourglassHalf} tono="ambar" to="/compras/ordenes?estado=pendiente" />
        <Kpi titulo="Comprometido" valor={pesos(comprometido)} detalle="Órdenes aprobadas sin recibir" icono={faSackDollar} tono="teal" />
        <Kpi
          titulo="MP bajo mínimo"
          valor={criticas.length}
          sufijo={`de ${materias.length}`}
          icono={faTriangleExclamation}
          tono={criticas.length ? 'rojo' : 'verde'}
          to="/compras/materias-primas"
        />
      </GrillaKpi>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <Card className="flex flex-col gap-2.5">
          <CardTitulo icono={faBoxesStacked}>Bajo punto de pedido</CardTitulo>
          <EstadoConsulta cargando={cargando} error={error} vacio={!criticas.length} textoVacio="Todas las materias primas están sobre el mínimo." />
          {criticas.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr>
                    <th scope="col" className={`${TH} text-left`}>Materia prima</th>
                    <th scope="col" className={`${TH} text-right`}>Stock</th>
                    <th scope="col" className={`${TH} text-right`}>Mínimo</th>
                    <th scope="col" className={TH}><span className="sr-only">Nivel</span></th>
                    <th scope="col" className={TH}><span className="sr-only">Acción</span></th>
                  </tr>
                </thead>
                <tbody>
                  {criticas.map((m) => (
                    <tr key={m.codigo} className="border-t border-gray-200 dark:border-slate-800">
                      <td className={TD}>
                        {m.nombre}
                        <br />
                        <span className="text-[13px] text-gray-500 dark:text-slate-400">{m.codigo}</span>
                      </td>
                      <td className={`${TD} text-right font-bold tabular-nums text-red-600 dark:text-red-400`}>{cantidad(m.stock, m.unidad)}</td>
                      <td className={`${TD} text-right tabular-nums`}>{cantidad(m.stockMinimo, m.unidad)}</td>
                      <td className={TD}><BarraStock stock={m.stock} minimo={m.stockMinimo} /></td>
                      <td className={`${TD} text-right`}>
                        {puede('compras.editar') && (
                          <Link to={`/compras/ordenes/nueva?mp=${encodeURIComponent(m.codigo)}`} className="font-bold text-violet-700 underline dark:text-violet-300">
                            Pedir
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-2.5">
          <CardTitulo icono={faFileInvoiceDollar} acciones={<Link to="/compras/ordenes" className="text-sm font-bold text-violet-700 underline dark:text-violet-300">Ver todas</Link>}>
            Últimas órdenes
          </CardTitulo>
          <EstadoConsulta cargando={cargando} error={error} vacio={!ordenes.length} textoVacio="Todavía no hay órdenes de compra." />
          <ul className="m-0 flex list-none flex-col p-0">
            {ordenes.slice(0, 6).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-200 py-2.5 dark:border-slate-800">
                <Link to={`/compras/ordenes/${o.id}`} className="font-bold text-teal-600 underline dark:text-teal-400">{o.numero}</Link>
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{proveedor[o.proveedorId]?.razonSocial || '—'}</span>
                <span className="text-[13px] text-gray-500 dark:text-slate-400">Entrega {fechaAR(o.fechaEntrega)}</span>
                <span className="font-bold tabular-nums">{pesos(totalOrden(o))}</span>
                <ChipOC estado={o.estado} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
