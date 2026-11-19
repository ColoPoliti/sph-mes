import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate,
  faCircleCheck,
  faClipboardCheck,
  faHourglassHalf,
  faMagnifyingGlass,
  faUserCheck,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitulo, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import DataTable from '@/shared/components/DataTable';
import { BOTON, INPUT } from '@/shared/components/clases';
import { Chip } from '@/shared/components/ui';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { alerta, confirmar, esc, toast } from '@/shared/lib/alertas';
import { useSesion } from '@/shared/lib/auth';
import { hoyISO } from '@/shared/lib/format';
import { ESTADOS_TOLVA, ciclosDe, getTolvas, loteDeTolva } from '@/shared/lib/tolvas';
import { getHistorial } from '@/modules/monitoreo/lib/api';
import { getAuditorias, quitarControl, registrarControl } from '../lib/api';
import Tooltip from '@/shared/components/Tooltip';

const FILTROS = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'controlada', label: 'Controladas' },
  { key: 'todas', label: 'Todas' },
];

const fechaHora = (iso) => (iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

/**
 * Auditoría: tolvas aprobadas por Calidad que salieron a Producción. Auditoría revisa la
 * documentación de cada una (orden, lavado, lote del PLC, aprobación de Calidad) y la marca
 * como controlada. No bloquea el uso de la tolva.
 */
export default function TolvasControlar() {
  const { usuario, puede } = useSesion();
  const puedeRegistrar = puede('auditoria.registrar');

  const { datos, cargando, error, recargar } = useConsulta(
    async () => {
      const [tolvas, lotes, auditorias] = await Promise.all([
        getTolvas(),
        getHistorial({ sector: 'todos', desde: hoyISO(-30), hasta: hoyISO(0) }).catch(() => []),
        getAuditorias(),
      ]);
      return { tolvas, lotes, auditorias };
    },
    [],
    { inicial: { tolvas: [], lotes: [], auditorias: {} } },
  );

  // Ciclos de tolva cuyo lote aprobó Calidad, con su control de Auditoría
  const filas = useMemo(
    () =>
      ciclosDe(datos.tolvas)
        .map((c) => ({ ...c, lote: loteDeTolva(c, datos.lotes), control: datos.auditorias[c.id] || null }))
        .filter((c) => c.lote?.estado === 'aprobado')
        .sort((a, b) => String(b.asignada).localeCompare(String(a.asignada))),
    [datos],
  );

  const [params, setParams] = useSearchParams();
  const filtro = params.get('estado') || 'pendiente';
  const [texto, setTexto] = useState('');

  const visibles = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return filas.filter(
      (c) =>
        (filtro === 'todas' || (filtro === 'controlada') === Boolean(c.control)) &&
        (!t || [c.codigo, c.orden, c.producto, c.lote?.id].some((v) => String(v ?? '').toLowerCase().includes(t))),
    );
  }, [filas, filtro, texto]);

  const cuenta = (k) => (k === 'todas' ? filas.length : filas.filter((c) => (k === 'controlada') === Boolean(c.control)).length);

  const controlar = async (c) => {
    const filasHtml = [
      ['Tolva', c.codigo],
      ['Orden', c.orden],
      ['Producto', c.producto],
      ['Línea', c.linea],
      ['Capacidad', c.kg ? `${c.kg} kg` : '—'],
      ['Lavada antes de usar', c.lavada ? 'Sí' : 'No'],
      ['Lote del PLC', `#${c.lote.id}`],
      ['Aprobó Calidad', `${c.lote.calidad?.usuario || '—'} · ${fechaHora(c.lote.calidad?.fecha)}`],
    ]
      .map(
        ([k, v]) => `<tr class="border-t border-gray-200 dark:border-slate-800">
          <th class="py-1.5 pr-3 text-left text-[14px] font-bold uppercase tracking-[0.6px] text-gray-600 dark:text-slate-300">${esc(k)}</th>
          <td class="py-1.5 text-left font-semibold text-gray-900 dark:text-white">${esc(v)}</td>
        </tr>`,
      )
      .join('');

    const r = await alerta.fire({
      title: `Controlar tolva ${esc(c.codigo)}`,
      html: `<table class="w-full text-[15px]"><tbody>${filasHtml}</tbody></table>`,
      input: 'textarea',
      inputLabel: 'Observaciones (opcional)',
      inputPlaceholder: 'Observaciones del control…',
      showCancelButton: true,
      confirmButtonText: 'Marcar controlada',
      cancelButtonText: 'Cancelar',
      width: 560,
    });
    if (!r.isConfirmed) return;
    await registrarControl(c.id, r.value, usuario);
    toast(`Tolva ${c.codigo} controlada`, 'aprobado');
    recargar();
  };

  const quitar = async (c) => {
    const ok = await confirmar({ titulo: `¿Quitar el control de la tolva ${c.codigo}?`, confirmar: 'Quitar control' });
    if (!ok) return;
    await quitarControl(c.id);
    toast(`Quitaste el control de la tolva ${c.codigo}`, 'neutro');
    recargar();
  };

  const boton = ({ key, label }) => (
    <button
      key={key}
      type="button"
      aria-pressed={filtro === key}
      onClick={() => setParams(key === 'pendiente' ? {} : { estado: key })}
      className={`min-h-9 cursor-pointer rounded-lg px-3 text-sm font-bold transition-colors ${
        filtro === key
          ? 'bg-slate-900 text-white dark:bg-teal-600'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {label} <span className="tabular-nums opacity-70">{cuenta(key)}</span>
    </button>
  );

  const columnas = [
    { id: 'tolva', titulo: 'Tolva', valor: (c) => c.codigo, clase: 'codigo font-bold tabular-nums' },
    { id: 'orden', titulo: 'Orden', valor: (c) => c.orden, clase: 'codigo tabular-nums' },
    {
      id: 'producto',
      titulo: 'Producto',
      valor: (c) => c.producto,
      celda: (c) => (
        <>
          <span className="block">{c.producto || '—'}</span>
          {c.kg && <span className="block text-[14px] text-gray-600 dark:text-slate-300">{c.kg} kg</span>}
        </>
      ),
    },
    { id: 'linea', titulo: 'Línea', valor: (c) => c.linea, clase: 'tabular-nums' },
    { id: 'lavada', titulo: 'Lavada', valor: (c) => (c.lavada ? 'Sí' : 'No') },
    {
      id: 'lote',
      titulo: 'Lote PLC',
      valor: (c) => c.lote.id,
      celda: (c) => (
        <Tooltip texto={`Ver la etiqueta digital del lote ${c.lote.id}`}><Link
          to={`/monitoreo/lotes/${c.lote.id}`}
          className="inline-flex min-h-9 items-center font-bold text-teal-600 underline dark:text-teal-400"
          aria-label={`Ver la etiqueta digital del lote ${c.lote.id}`}
        >
          #{c.lote.id}
        </Link></Tooltip>
      ),
    },
    {
      id: 'calidad',
      titulo: 'Aprobó Calidad',
      valor: (c) => c.lote.calidad?.usuario,
      celda: (c) => (
        <>
          <span className="block">{c.lote.calidad?.usuario || '—'}</span>
          <span className="block text-[14px] text-gray-600 dark:text-slate-300">{fechaHora(c.lote.calidad?.fecha)}</span>
        </>
      ),
      clase: 'text-[14px]',
    },
    {
      id: 'estado',
      titulo: 'Estado',
      valor: (c) => ESTADOS_TOLVA[c.estado]?.texto,
      celda: (c) => {
        const est = ESTADOS_TOLVA[c.estado];
        return est ? <Chip tipo={est.tipo}>{est.texto}</Chip> : '—';
      },
      clase: 'whitespace-nowrap',
    },
    {
      id: 'auditoria',
      titulo: 'Auditoría',
      valor: (c) => (c.control ? 'Controlada' : 'Pendiente'),
      celda: (c) =>
        c.control ? (
          <span className="flex flex-col items-start gap-1">
            <Chip tipo="calidad" icono={faCircleCheck} mayus>
              Controlada
            </Chip>
            <span className="text-[14px] text-gray-600 dark:text-slate-300">
              {c.control.usuario} · {fechaHora(c.control.fecha)}
            </span>
            {c.control.observaciones && (
              <span className="max-w-[260px] whitespace-pre-wrap text-[14px] font-medium">{c.control.observaciones}</span>
            )}
          </span>
        ) : (
          <Chip tipo="inc" icono={faHourglassHalf} mayus>
            Pendiente
          </Chip>
        ),
    },
    ...(puedeRegistrar
      ? [
          {
            id: 'accion',
            titulo: 'Acción',
            oculto: true,
            alinear: 'right',
            celda: (c) =>
              c.control ? (
                <button type="button" className={BOTON.secundario} onClick={() => quitar(c)}>
                  Quitar control
                </button>
              ) : (
                <button type="button" className={BOTON.exito} onClick={() => controlar(c)}>
                  <FontAwesomeIcon icon={faUserCheck} aria-hidden="true" />
                  Controlar
                </button>
              ),
            clase: 'whitespace-nowrap',
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Tolvas a controlar"
        descripcion="Control documental de cada tolva aprobada por Calidad que salió a Producción"
        icono={faUserCheck}
        acciones={
          <button type="button" className={BOTON.secundario} onClick={recargar} disabled={cargando}>
            <FontAwesomeIcon icon={faArrowsRotate} aria-hidden="true" />
            Actualizar
          </button>
        }
      />

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map(boton)}
          <label className="relative ml-auto w-full sm:w-72">
            <span className="sr-only">Buscar</span>
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Tolva, orden, producto o lote…"
              className={`${INPUT} pl-9`}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </label>
        </div>

        <CardTitulo icono={faClipboardCheck} extra={cargando ? 'Buscando…' : `${visibles.length} tolvas`}>
          {FILTROS.find((f) => f.key === filtro)?.label}
        </CardTitulo>
        <EstadoConsulta
          cargando={cargando && !filas.length}
          error={error}
          vacio={!visibles.length}
          textoVacio={filas.length ? 'Ninguna tolva cumple con el filtro.' : 'No hay tolvas aprobadas por Calidad para controlar.'}
        />

        {visibles.length > 0 && (
          <DataTable
            titulo="Tolvas a controlar por Auditoría"
            columnas={columnas}
            filas={visibles}
            clave={(c) => c.id}
            minWidth={1080}
            buscador={false}
            exportar="tolvas-a-controlar.csv"
          />
        )}
        <Nota>
          El control de Auditoría es documental y no bloquea el uso de la tolva. El lote del PLC abre la etiqueta digital con
          lo dosificado contra la receta. Se muestran los lotes de los últimos 30 días.
        </Nota>
        {!puedeRegistrar && <Nota>Tu perfil es de consulta: solo Auditoría o el administrador pueden registrar controles.</Nota>}
      </Card>
    </div>
  );
}
