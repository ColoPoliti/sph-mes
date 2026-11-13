import { Link } from 'react-router-dom';
import {
  faCircleCheck,
  faCircleXmark,
  faClipboardCheck,
  faFlaskVial,
  faListCheck,
  faPercent,
} from '@fortawesome/free-solid-svg-icons';
import LotesTable from '@/shared/components/LotesTable';
import { Card, CardTitulo, Encabezado, EstadoConsulta, GrillaKpi, Kpi } from '@/shared/components/base';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { getRecepciones } from '@/modules/compras/lib/api';
import { mostrarInfoLote } from '../lib/alertasCalidad';
import { useAprobacionCalidad } from '../lib/useAprobacionCalidad';
import { SIN_REVISAR, useLotesCalidad } from '../lib/useLotesCalidad';

export default function PanelCalidad() {
  const { filas, setFilas, cargando, error } = useLotesCalidad(6);
  const { puedeAprobar, onAprobar } = useAprobacionCalidad(setFilas);
  const { datos: ingresos } = useConsulta(() => getRecepciones((r) => r.estado === 'pendiente'), [], { inicial: [] });

  const pendientes = filas.filter((l) => SIN_REVISAR.includes(l.estado));
  const aprobados = filas.filter((l) => l.estado === 'aprobado').length;
  const rechazados = filas.filter((l) => l.estado === 'rechazado').length;
  const revisados = aprobados + rechazados;
  // Los más viejos primero: son los que más urge liberar
  const masAntiguos = [...pendientes].sort((a, b) => String(a.inicio).localeCompare(String(b.inicio))).slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <Encabezado titulo="Panel de calidad" descripcion="Últimos 7 días de producción." icono={faClipboardCheck} />

      <GrillaKpi>
        <Kpi titulo="Lotes a liberar" valor={pendientes.length} icono={faListCheck} tono="ambar" to="/calidad/pendientes" />
        <Kpi titulo="Aprobados" valor={aprobados} icono={faCircleCheck} tono="cielo" to="/calidad/decisiones" />
        <Kpi titulo="Rechazados" valor={rechazados} icono={faCircleXmark} tono="rojo" to="/calidad/decisiones" />
        <Kpi
          titulo="Tasa de aprobación"
          valor={revisados ? (aprobados / revisados) * 100 : 0}
          decimales={1}
          sufijo="%"
          detalle={`${revisados} de ${filas.length} lotes revisados`}
          icono={faPercent}
          tono="teal"
        />
      </GrillaKpi>

      {ingresos.length > 0 && (
        <Link
          to="/calidad/ingresos"
          className="flex items-center gap-3 rounded-[14px] border border-amber-500/50 bg-amber-500/15 px-4 py-3 text-[15px] font-semibold text-amber-800 transition-colors hover:bg-amber-500/25 dark:text-amber-200"
        >
          <span className="text-xl" aria-hidden="true">⚑</span>
          {ingresos.length} {ingresos.length === 1 ? 'ingreso de materia prima espera' : 'ingresos de materia prima esperan'} inspección.
          <span className="ml-auto underline">Inspeccionar</span>
        </Link>
      )}

      <Card className="flex flex-col gap-2.5">
        <CardTitulo
          icono={faFlaskVial}
          extra="Los más antiguos primero"
          acciones={<Link to="/calidad/pendientes" className="text-sm font-bold text-violet-700 underline dark:text-violet-300">Ver bandeja completa</Link>}
        >
          Pendientes de liberación
        </CardTitulo>
        <EstadoConsulta cargando={cargando && !filas.length} error={error} vacio={!cargando && !masAntiguos.length} textoVacio="No hay lotes pendientes de revisión. ¡Al día!" />
        {masAntiguos.length > 0 && (
          <LotesTable
            filas={masAntiguos}
            conSala
            minWidth={puedeAprobar ? 880 : 720}
            onAprobar={puedeAprobar ? onAprobar : undefined}
            onInfo={mostrarInfoLote}
            rutaLote={(id) => `/calidad/lotes/${id}`}
          />
        )}
      </Card>
    </div>
  );
}
