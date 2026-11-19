import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faPen, faPlus, faTruckField, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Campo, Card, CardTitulo, Encabezado, EstadoConsulta } from '@/shared/components/base';
import DataTable from '@/shared/components/DataTable';
import { BOTON, INPUT } from '@/shared/components/clases';
import { Chip } from '@/shared/components/ui';
import { toast } from '@/shared/lib/alertas';
import { useSesion } from '@/shared/lib/auth';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { getProveedores, guardarProveedor } from '../lib/api';

const VACIO = { razonSocial: '', cuit: '', contacto: '', email: '', telefono: '', rubro: '', activo: true };
const CUIT_OK = /^\d{2}-\d{8}-\d$/;

export default function Proveedores() {
  const { puede } = useSesion();
  const editable = puede('compras.editar');
  const { datos: proveedores, cargando, error, recargar } = useConsulta(getProveedores, [], { inicial: [] });
  const [form, setForm] = useState(null); // null = formulario cerrado
  const [aviso, setAviso] = useState('');

  const campo = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.razonSocial.trim()) return setAviso('La razón social es obligatoria.');
    if (form.cuit && !CUIT_OK.test(form.cuit)) return setAviso('El CUIT debe tener el formato 30-12345678-9.');
    await guardarProveedor({ ...form, razonSocial: form.razonSocial.trim() });
    toast(form.id ? 'Proveedor actualizado' : 'Proveedor agregado', 'aprobado');
    setForm(null);
    setAviso('');
    recargar();
  };

  const columnas = [
    { id: 'razon', titulo: 'Razón social', valor: (p) => p.razonSocial, clase: 'font-bold' },
    { id: 'cuit', titulo: 'CUIT', valor: (p) => p.cuit, clase: 'tabular-nums' },
    { id: 'rubro', titulo: 'Rubro', valor: (p) => p.rubro },
    {
      id: 'contacto',
      titulo: 'Contacto',
      valor: (p) => p.contacto,
      texto: (p) => p.email,
      celda: (p) => (
        <>
          {p.contacto || '—'}
          {p.email && (
            <>
              <br />
              <a href={`mailto:${p.email}`} className="text-[14px] text-teal-600 underline dark:text-teal-400">{p.email}</a>
            </>
          )}
        </>
      ),
    },
    {
      id: 'estado',
      titulo: 'Estado',
      alinear: 'right',
      valor: (p) => (p.activo ? 'Activo' : 'Inactivo'),
      celda: (p) => <Chip tipo={p.activo ? 'ok' : 'neutro'} mayus>{p.activo ? 'Activo' : 'Inactivo'}</Chip>,
    },
    ...(editable
      ? [
          {
            id: 'editar',
            titulo: 'Editar',
            oculto: true,
            alinear: 'center',
            celda: (p) => (
              <button
                type="button"
                aria-label={`Editar ${p.razonSocial}`}
                onClick={() => setForm({ ...VACIO, ...p })}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-violet-600 transition-colors hover:bg-gray-100 dark:text-violet-400 dark:hover:bg-slate-800"
              >
                <FontAwesomeIcon icon={faPen} aria-hidden="true" />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Proveedores"
        icono={faTruckField}
        acciones={
          editable && !form && (
            <button type="button" className={BOTON.marca} onClick={() => setForm({ ...VACIO })}>
              <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
              Nuevo proveedor
            </button>
          )
        }
      />

      {form && (
        <Card as="form" onSubmit={guardar} className="flex flex-wrap items-end gap-x-[18px] gap-y-3.5">
          <div className="basis-full">
            <CardTitulo icono={form.id ? faPen : faPlus}>{form.id ? 'Editar proveedor' : 'Nuevo proveedor'}</CardTitulo>
          </div>
          <Campo etiqueta="Razón social"><input className={INPUT} value={form.razonSocial} onChange={campo('razonSocial')} required /></Campo>
          <Campo etiqueta="CUIT"><input className={INPUT} value={form.cuit} onChange={campo('cuit')} placeholder="30-12345678-9" /></Campo>
          <Campo etiqueta="Rubro"><input className={INPUT} value={form.rubro} onChange={campo('rubro')} /></Campo>
          <Campo etiqueta="Contacto"><input className={INPUT} value={form.contacto} onChange={campo('contacto')} /></Campo>
          <Campo etiqueta="Email"><input type="email" className={INPUT} value={form.email} onChange={campo('email')} /></Campo>
          <Campo etiqueta="Teléfono"><input className={INPUT} value={form.telefono} onChange={campo('telefono')} /></Campo>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-semibold">
            <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={form.activo} onChange={campo('activo')} />
            Activo
          </label>
          <div className="ml-auto flex gap-2.5">
            <button type="button" className={BOTON.secundario} onClick={() => { setForm(null); setAviso(''); }}>
              <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
              Cancelar
            </button>
            <button type="submit" className={BOTON.primario}>
              <FontAwesomeIcon icon={faFloppyDisk} aria-hidden="true" />
              Guardar
            </button>
          </div>
          {aviso && <p role="alert" className="m-0 basis-full text-sm font-medium text-red-600 dark:text-red-400">{aviso}</p>}
        </Card>
      )}

      <Card className="flex flex-col gap-2.5">
        <EstadoConsulta cargando={cargando} error={error} vacio={!proveedores.length} />
        {proveedores.length > 0 && (
          <DataTable
            titulo="Proveedores"
            columnas={columnas}
            filas={proveedores}
            clave={(p) => p.id}
            minWidth={820}
            claseFila={(p) => (p.activo ? '' : 'opacity-60')}
            exportar="proveedores.csv"
          />
        )}
      </Card>
    </div>
  );
}
