import { Chip } from '@/shared/components/ui';
import { ESTADOS_REVISION, estadoRevision } from '../lib/revision';

/** Estado de la revisión de cantidades de una orden; si fue rechazada, muestra el motivo debajo. */
export default function ChipRevision({ orden, conMotivo = true }) {
  const { tipo, texto, icono } = ESTADOS_REVISION[estadoRevision(orden)];
  const motivo = orden.revision?.decision === 'rechazado' && orden.revision.comentario;
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Chip tipo={tipo} icono={icono} mayus>
        {texto}
      </Chip>
      {conMotivo && motivo && (
        <span className="max-w-[240px] whitespace-normal text-[14px] font-medium text-red-700 dark:text-red-300">
          {motivo}
        </span>
      )}
    </span>
  );
}
