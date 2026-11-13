import { useMemo } from 'react';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { getMateriasPrimas, getOrdenes, getProveedores, getRecepciones } from './api';

/**
 * Carga juntas las colecciones de Compras y arma índices para mostrar nombres
 * (proveedor por id, materia prima por código).
 */
export function useDatosCompras() {
  const consulta = useConsulta(
    async () => {
      const [ordenes, proveedores, materias, recepciones] = await Promise.all([
        getOrdenes(),
        getProveedores(),
        getMateriasPrimas(),
        getRecepciones(),
      ]);
      return { ordenes, proveedores, materias, recepciones };
    },
    [],
    { inicial: { ordenes: [], proveedores: [], materias: [], recepciones: [] } },
  );

  const indices = useMemo(() => {
    const d = consulta.datos;
    return {
      proveedor: Object.fromEntries(d.proveedores.map((p) => [p.id, p])),
      mp: Object.fromEntries(d.materias.map((m) => [m.codigo, m])),
      orden: Object.fromEntries(d.ordenes.map((o) => [o.id, o])),
    };
  }, [consulta.datos]);

  return { ...consulta, ...consulta.datos, ...indices };
}
