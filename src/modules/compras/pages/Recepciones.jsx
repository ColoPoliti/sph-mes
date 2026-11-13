import { faTruckRampBox } from '@fortawesome/free-solid-svg-icons';
import { Card, Encabezado, EstadoConsulta, Nota } from '@/shared/components/base';
import { useDatosCompras } from '../lib/useDatosCompras';
import TablaRecepciones from '../components/TablaRecepciones';

export default function Recepciones() {
  const { recepciones, mp, orden, cargando, error } = useDatosCompras();
  return (
    <div className="flex flex-col gap-4">
      <Encabezado titulo="Recepciones" descripcion="Ingresos de materia prima y su dictamen de Calidad." icono={faTruckRampBox} />
      <Card className="flex flex-col gap-3">
        <EstadoConsulta cargando={cargando} error={error} vacio={!recepciones.length} textoVacio="Todavía no se recibió ninguna orden." />
        {recepciones.length > 0 && <TablaRecepciones filas={recepciones} mp={mp} orden={orden} />}
        <Nota>Las recepciones se generan al registrar la recepción de una orden aprobada. Calidad las libera desde su módulo.</Nota>
      </Card>
    </div>
  );
}
