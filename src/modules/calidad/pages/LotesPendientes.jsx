import { useMemo, useState } from 'react';
import { faListCheck, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import LotesTable from '@/shared/components/LotesTable';
import { Card, CardTitulo, Campo, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import { INPUT } from '@/shared/components/clases';
import { mostrarInfoLote } from '../lib/alertasCalidad';
import { useAprobacionCalidad } from '../lib/useAprobacionCalidad';
import { SIN_REVISAR, useLotesCalidad } from '../lib/useLotesCalidad';
import FiltroPeriodo from '../components/FiltroPeriodo';

/** Bandeja de liberación: lotes producidos que Calidad todavía no revisó. */
export default function LotesPendientes() {
  const { filas, setFilas, cargando, error, periodo, setPeriodo } = useLotesCalidad(6);
  const { puedeAprobar, onAprobar } = useAprobacionCalidad(setFilas);
  const [texto, setTexto] = useState('');
  const [soloCompletas, setSoloCompletas] = useState(false);

  const pendientes = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return filas.filter(
      (l) =>
        SIN_REVISAR.includes(l.estado) &&
        (!soloCompletas || l.estado === 'completa') &&
        (!t || String(l.id).includes(t) || String(l.codigo_barra).includes(t) || l.nombre_producto?.toLowerCase().includes(t)),
    );
  }, [filas, texto, soloCompletas]);

  return (
    <div className="flex flex-col gap-4">
      <Encabezado titulo="Lotes a liberar" descripcion="Al aprobar o rechazar, el lote sale de la bandeja." icono={faListCheck} />

      <FiltroPeriodo periodo={periodo} setPeriodo={setPeriodo}>
        <Campo etiqueta="Buscar">
          <input type="search" className={INPUT} placeholder="Lote, código o producto" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </Campo>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={soloCompletas} onChange={(e) => setSoloCompletas(e.target.checked)} />
          Solo completas
        </label>
      </FiltroPeriodo>

      <Card className="flex flex-col gap-2.5">
        <CardTitulo icono={faMagnifyingGlass} extra={cargando ? 'Buscando…' : `${pendientes.length} lotes`}>
          Pendientes de revisión
        </CardTitulo>
        <EstadoConsulta error={error} vacio={!cargando && !pendientes.length} textoVacio="No hay lotes pendientes en el período." />
        {pendientes.length > 0 && (
          <LotesTable
            filas={pendientes}
            conSala
            minWidth={puedeAprobar ? 880 : 720}
            onAprobar={puedeAprobar ? onAprobar : undefined}
            onInfo={mostrarInfoLote}
            rutaLote={(id) => `/calidad/lotes/${id}`}
          />
        )}
        {!puedeAprobar && <Nota>Tu perfil es de consulta: solo Calidad o el administrador pueden aprobar.</Nota>}
      </Card>
    </div>
  );
}
