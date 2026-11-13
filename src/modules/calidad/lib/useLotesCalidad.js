import { useState } from 'react';
import { getHistorial } from '@/modules/monitoreo/lib/api';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { hoyISO } from '@/shared/lib/format';

export const SIN_REVISAR = ['completa', 'incompleta'];
export const REVISADOS = ['aprobado', 'rechazado'];

/**
 * Lotes de producción de un período, con la decisión de Calidad aplicada.
 * Devuelve también el período (editable) y setFilas para useAprobacionCalidad.
 */
export function useLotesCalidad(diasAtras = 6) {
  const [periodo, setPeriodo] = useState(() => ({ desde: hoyISO(-diasAtras), hasta: hoyISO(0), sector: 'todos' }));
  const consulta = useConsulta(
    () => getHistorial({ sector: periodo.sector, desde: periodo.desde, hasta: periodo.hasta }),
    [periodo.desde, periodo.hasta, periodo.sector],
    { inicial: [], intervaloMs: 60000 },
  );
  return { ...consulta, filas: consulta.datos || [], setFilas: consulta.setDatos, periodo, setPeriodo };
}
