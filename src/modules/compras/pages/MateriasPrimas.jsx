import { useState } from 'react';
import { Link } from 'react-router-dom';
import { faBoxesStacked, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import DataTable from '@/shared/components/DataTable';
import { BOTON } from '@/shared/components/clases';
import { Chip } from '@/shared/components/ui';
import { useSesion } from '@/shared/lib/auth';
import { descargarCSV } from '@/shared/lib/csv';
import { bajoMinimo } from '../lib/api';
import { cantidad, pesos } from '../lib/estados';
import { useDatosCompras } from '../lib/useDatosCompras';
import { BarraStock } from '../components/Chips';
import Tooltip from '@/shared/components/Tooltip';

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

  const columnas = [
    { id: 'codigo', titulo: 'Código', valor: (m) => m.codigo, clase: 'codigo font-bold tabular-nums text-violet-700 dark:text-violet-300' },
    { id: 'nombre', titulo: 'Nombre', valor: (m) => m.nombre },
    {
      id: 'stock',
      titulo: 'Stock',
      alinear: 'right',
      valor: (m) => Number(m.stock),
      celda: (m) => <span className={bajoMinimo(m) ? 'text-red-600 dark:text-red-400' : ''}>{cantidad(m.stock, m.unidad)}</span>,
      clase: 'whitespace-nowrap font-bold tabular-nums',
    },
    {
      id: 'minimo',
      titulo: 'Mínimo',
      alinear: 'right',
      valor: (m) => Number(m.stockMinimo),
      celda: (m) => cantidad(m.stockMinimo, m.unidad),
      clase: 'whitespace-nowrap tabular-nums',
    },
    {
      id: 'nivel',
      titulo: 'Nivel',
      // Ordena por qué tan cerca está del mínimo
      valor: (m) => (Number(m.stockMinimo) ? Number(m.stock) / Number(m.stockMinimo) : null),
      celda: (m) => (
        <div className="flex items-center gap-2">
          <BarraStock stock={m.stock} minimo={m.stockMinimo} />
          {bajoMinimo(m) && <Chip tipo="mal">Bajo mínimo</Chip>}
        </div>
      ),
    },
    {
      id: 'inspeccion',
      titulo: 'En inspección',
      alinear: 'right',
      valor: (m) => enInspeccion(m.codigo),
      celda: (m) => (enInspeccion(m.codigo) ? cantidad(enInspeccion(m.codigo), m.unidad) : '—'),
      clase: 'whitespace-nowrap tabular-nums',
    },
    { id: 'proveedor', titulo: 'Proveedor habitual', valor: (m) => proveedor[m.proveedorId]?.razonSocial },
    {
      id: 'precio',
      titulo: 'Precio ref.',
      alinear: 'right',
      valor: (m) => Number(m.precioRef),
      celda: (m) => pesos(m.precioRef),
      clase: 'whitespace-nowrap tabular-nums',
    },
    {
      id: 'accion',
      titulo: 'Acción',
      oculto: true,
      alinear: 'right',
      celda: (m) =>
        puede('compras.editar') && (
          <Tooltip texto={`Crear una orden de compra para ${m.nombre || m.codigo}`}><Link to={`/compras/ordenes/nueva?mp=${encodeURIComponent(m.codigo)}`} className="font-bold text-violet-700 underline dark:text-violet-300">
            Pedir
          </Link></Tooltip>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
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
          <DataTable titulo="Materias primas" columnas={columnas} filas={filas} clave={(m) => m.codigo} minWidth={860} />
        )}
        <Nota>
          El stock suma recién cuando Calidad libera la recepción. Lo que está en inspección todavía no se puede usar en producción.
        </Nota>
      </Card>
    </div>
  );
}
