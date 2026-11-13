import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { Campo, Card, CardTitulo } from '@/shared/components/base';
import { CAMPO, INPUT } from '@/shared/components/clases';
import { CONFIG } from '@/modules/monitoreo/config';

/** Filtro de período y sector, común a las pantallas de Calidad */
export default function FiltroPeriodo({ periodo, setPeriodo, children }) {
  const cambiar = (k) => (e) => setPeriodo((p) => ({ ...p, [k]: e.target.value }));
  return (
    <Card as="div" className="flex flex-wrap items-end gap-x-[18px] gap-y-3.5 !rounded-none">
      <div className="basis-full">
        <CardTitulo icono={faFilter}>Filtros</CardTitulo>
      </div>
      <Campo etiqueta="Sector" className={CAMPO}>
        <select className={INPUT} value={periodo.sector} onChange={cambiar('sector')}>
          <option value="todos">Todos</option>
          {CONFIG.AREAS.map((a) => (
            <option key={a.key} value={a.key}>{a.label}</option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Día desde">
        <input type="date" className={INPUT} value={periodo.desde} onChange={cambiar('desde')} />
      </Campo>
      <Campo etiqueta="Día hasta">
        <input type="date" className={INPUT} value={periodo.hasta} onChange={cambiar('hasta')} />
      </Campo>
      {children}
    </Card>
  );
}
