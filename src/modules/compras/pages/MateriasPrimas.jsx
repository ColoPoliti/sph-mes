import { useState } from 'react';
import { Link } from 'react-router-dom';
import { faBoxesStacked, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import { BOTON, TD, TH } from '@/shared/components/clases';
import { Chip } from '@/shared/components/ui';
import { useSesion } from '@/shared/lib/auth';
import { descargarCSV } from '@/shared/lib/csv';
import { bajoMinimo } from '../lib/api';
import { cantidad, pesos } from '../lib/estados';
import { useDatosCompras } from '../lib/useDatosCompras';
import { BarraStock } from '../components/Chips';

export default function MateriasPrimas() {
  const { puede } = useSesion();
  const { materias, recepciones, proveedor, cargando, error } = useDatosCompras();
  const [soloCriticas, setSoloCriticas] = useState(false);

  // Cantidad recibida que todavía está en inspección (no cuenta como stock disponible)
  const enInspeccion = (codigo) =>
    recepciones.filter((r) => r.codigo === codigo && r.estado === 'pendiente').reduce((t, r) => t + r.cantidad, 0);

  const filas = soloCriticas ? materias.filter(bajoMinimo) : materias;

  const exportar = () =>
    descargarCSV('materias-primas.csv', filas, [
      { titulo: 'Código', valor: (m) => m.codigo },
      { titulo: 'Nombre', valor: (m) => m.nombre },
      { titulo: 'Unidad', valor: (m) => m.unidad },
      { titulo: 'Stock', valor: (m) => m.stock },
      { titulo: 'Mínimo', valor: (m) => m.stockMinimo },
      { titulo: 'En inspección', valor: (m) => enInspeccion(m.codigo) },
      { titulo: 'Proveedor habitual', valor: (m) => proveedor[m.proveedorId]?.razonSocial },
    ]);

  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Materias primas"
        descripcion="Stock disponible (liberado por Calidad) y punto de pedido."
        icono={faBoxesStacked}
        acciones={
          <button type="button" className={BOTON.secundario} onClick={exportar} disabled={!filas.length}>
            <FontAwesomeIcon icon={faFileCsv} aria-hidden="true" />
            Exportar
          </button>
        }
      />

      <Card className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-[15px] font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={soloCriticas} onChange={(e) => setSoloCriticas(e.target.checked)} />
          Solo bajo mínimo
        </label>

        <EstadoConsulta cargando={cargando} error={error} vacio={!filas.length} />

        {filas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <caption className="sr-only">Materias primas</caption>
              <thead>
                <tr>
                  <th scope="col" className={`${TH} text-left`}>Código</th>
                  <th scope="col" className={`${TH} text-left`}>Nombre</th>
                  <th scope="col" className={`${TH} text-right`}>Stock</th>
                  <th scope="col" className={`${TH} text-right`}>Mínimo</th>
                  <th scope="col" className={TH}>Nivel</th>
                  <th scope="col" className={`${TH} text-right`}>En inspección</th>
                  <th scope="col" className={`${TH} text-left`}>Proveedor habitual</th>
                  <th scope="col" className={`${TH} text-right`}>Precio ref.</th>
                  <th scope="col" className={TH}><span className="sr-only">Acción</span></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((m) => {
                  const bajo = bajoMinimo(m);
                  const insp = enInspeccion(m.codigo);
                  return (
                    <tr key={m.codigo} className="border-t border-gray-200 dark:border-slate-800">
                      <td className={`${TD} font-bold tabular-nums text-violet-700 dark:text-violet-300`}>{m.codigo}</td>
                      <td className={TD}>{m.nombre}</td>
                      <td className={`${TD} whitespace-nowrap text-right font-bold tabular-nums ${bajo ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {cantidad(m.stock, m.unidad)}
                      </td>
                      <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>{cantidad(m.stockMinimo, m.unidad)}</td>
                      <td className={TD}>
                        <div className="flex items-center gap-2">
                          <BarraStock stock={m.stock} minimo={m.stockMinimo} />
                          {bajo && <Chip tipo="mal">Bajo mínimo</Chip>}
                        </div>
                      </td>
                      <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>{insp ? cantidad(insp, m.unidad) : '—'}</td>
                      <td className={TD}>{proveedor[m.proveedorId]?.razonSocial || '—'}</td>
                      <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>{pesos(m.precioRef)}</td>
                      <td className={`${TD} text-right`}>
                        {puede('compras.editar') && (
                          <Link to={`/compras/ordenes/nueva?mp=${encodeURIComponent(m.codigo)}`} className="font-bold text-violet-700 underline dark:text-violet-300">
                            Pedir
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Nota>
          El stock suma recién cuando Calidad libera la recepción. Lo que está en inspección todavía no se puede usar en producción.
        </Nota>
      </Card>
    </div>
  );
}
