import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faFileCsv, faFileInvoiceDollar, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitulo, Encabezado, EstadoConsulta } from '@/shared/components/base';
import DataTable from '@/shared/components/DataTable';
import { BOTON, INPUT } from '@/shared/components/clases';
import { useSesion } from '@/shared/lib/auth';
import { descargarCSV } from '@/shared/lib/csv';
import { totalOrden } from '../lib/api';
import { ESTADOS_OC, fechaAR, pesos } from '../lib/estados';
import { useDatosCompras } from '../lib/useDatosCompras';
import { ChipOC } from '../components/Chips';

export default function Ordenes() {
  const { puede } = useSesion();
  const { ordenes, proveedor, cargando, error } = useDatosCompras();
  // El filtro de estado vive en la URL (?estado=pendiente): se puede compartir y sobrevive al recargar
  const [params, setParams] = useSearchParams();
  const estado = params.get('estado') || 'todas';
  const [texto, setTexto] = useState('');

  const filas = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return ordenes.filter(
      (o) =>
        (estado === 'todas' || o.estado === estado) &&
        (!t ||
          o.numero.toLowerCase().includes(t) ||
          (proveedor[o.proveedorId]?.razonSocial || '').toLowerCase().includes(t) ||
          o.items.some((i) => i.codigo.toLowerCase().includes(t))),
    );
  }, [ordenes, estado, texto, proveedor]);

  const cuenta = (e) => ordenes.filter((o) => o.estado === e).length;

  const exportar = () =>
    descargarCSV('ordenes-de-compra.csv', filas, [
      { titulo: 'Número', valor: (o) => o.numero },
      { titulo: 'Proveedor', valor: (o) => proveedor[o.proveedorId]?.razonSocial },
      { titulo: 'Fecha', valor: (o) => o.fecha },
      { titulo: 'Entrega', valor: (o) => o.fechaEntrega },
      { titulo: 'Estado', valor: (o) => ESTADOS_OC[o.estado]?.texto },
      { titulo: 'Total', valor: (o) => totalOrden(o) },
    ]);

  const filtro = (key, label, n) => (
    <button
      key={key}
      type="button"
      aria-pressed={estado === key}
      onClick={() => setParams(key === 'todas' ? {} : { estado: key })}
      className={`min-h-9 cursor-pointer rounded-lg px-3 text-sm font-bold transition-colors ${
        estado === key
          ? 'bg-slate-900 text-white dark:bg-teal-600'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {label} <span className="tabular-nums opacity-70">{n}</span>
    </button>
  );

  const columnas = [
    {
      id: 'numero',
      titulo: 'Número',
      valor: (o) => o.numero,
      celda: (o) => (
        <Link to={`/compras/ordenes/${o.id}`} className="inline-flex min-h-9 items-center font-bold text-teal-600 underline dark:text-teal-400">
          {o.numero}
        </Link>
      ),
    },
    { id: 'proveedor', titulo: 'Proveedor', valor: (o) => proveedor[o.proveedorId]?.razonSocial },
    { id: 'fecha', titulo: 'Fecha', valor: (o) => o.fecha, celda: (o) => fechaAR(o.fecha), clase: 'tabular-nums' },
    { id: 'entrega', titulo: 'Entrega', valor: (o) => o.fechaEntrega, celda: (o) => fechaAR(o.fechaEntrega), clase: 'tabular-nums' },
    { id: 'items', titulo: 'Ítems', alinear: 'right', valor: (o) => o.items.length, clase: 'tabular-nums' },
    { id: 'total', titulo: 'Total', alinear: 'right', valor: (o) => totalOrden(o), celda: (o) => pesos(totalOrden(o)), clase: 'font-bold tabular-nums' },
    {
      id: 'estado',
      titulo: 'Estado',
      alinear: 'right',
      valor: (o) => ESTADOS_OC[o.estado]?.texto || o.estado,
      celda: (o) => <ChipOC estado={o.estado} />,
      clase: 'whitespace-nowrap',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Órdenes de compra"
        icono={faFileInvoiceDollar}
        acciones={
          <>
            <button type="button" className={BOTON.secundario} onClick={exportar} disabled={!filas.length}>
              <FontAwesomeIcon icon={faFileCsv} aria-hidden="true" />
              Exportar
            </button>
            {puede('compras.editar') && (
              <Link to="/compras/ordenes/nueva" className={BOTON.marca}>
                <FontAwesomeIcon icon={faCartPlus} aria-hidden="true" />
                Nueva orden
              </Link>
            )}
          </>
        }
      />

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filtro('todas', 'Todas', ordenes.length)}
          {Object.entries(ESTADOS_OC).map(([k, e]) => filtro(k, e.texto, cuenta(k)))}
          <label className="relative ml-auto w-full sm:w-64">
            <span className="sr-only">Buscar</span>
            <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Número, proveedor o MP…"
              className={`${INPUT} pl-9`}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </label>
        </div>

        <CardTitulo icono={faMagnifyingGlass} extra={`${filas.length} órdenes`}>Resultados</CardTitulo>
        <EstadoConsulta cargando={cargando} error={error} vacio={!filas.length} textoVacio="Ninguna orden cumple con el filtro." />

        {filas.length > 0 && (
          <DataTable
            titulo="Órdenes de compra"
            columnas={columnas}
            filas={filas}
            clave={(o) => o.id}
            minWidth={760}
            buscador={false}
          />
        )}
      </Card>
    </div>
  );
}
