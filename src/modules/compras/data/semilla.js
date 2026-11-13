// Datos de ejemplo del módulo Compras (se cargan la primera vez en localStorage).
// Los códigos de MP coinciden con los de las recetas del PLC (MP-101 alcohol, MP-205 colorante...).

const dias = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

export const proveedoresSemilla = () => [
  { id: 1, razonSocial: 'Alcoholes del Litoral S.A.', cuit: '30-71234567-8', contacto: 'Laura Gómez', email: 'ventas@alcoholeslitoral.com.ar', telefono: '0342 455-1200', rubro: 'Solventes', activo: true },
  { id: 2, razonSocial: 'Química Pampeana S.R.L.', cuit: '30-70987654-3', contacto: 'Diego Ruiz', email: 'comercial@quimicapampeana.com.ar', telefono: '011 4777-3300', rubro: 'Colorantes y aditivos', activo: true },
  { id: 3, razonSocial: 'Esencias Andinas S.A.', cuit: '30-69876543-1', contacto: 'Carla Méndez', email: 'pedidos@esenciasandinas.com', telefono: '0261 420-8800', rubro: 'Fragancias', activo: true },
  { id: 4, razonSocial: 'Envases Rosario S.A.', cuit: '30-65432198-7', contacto: 'Martín Paz', email: 'ventas@envasesrosario.com.ar', telefono: '0341 430-2211', rubro: 'Envases y tapas', activo: true },
  { id: 5, razonSocial: 'Gráfica Norte', cuit: '20-28765432-9', contacto: 'Sofía Luna', email: 'info@graficanorte.com.ar', telefono: '0381 422-5566', rubro: 'Etiquetas', activo: false },
];

export const materiasPrimasSemilla = () => [
  { id: 1, codigo: 'MP-101', nombre: 'Alcohol etílico 96°', unidad: 'kg', stock: 820, stockMinimo: 500, proveedorId: 1, precioRef: 1450 },
  { id: 2, codigo: 'MP-205', nombre: 'Colorante azul', unidad: 'kg', stock: 4.2, stockMinimo: 5, proveedorId: 2, precioRef: 18900 },
  { id: 3, codigo: 'MP-310', nombre: 'Glicerina USP', unidad: 'kg', stock: 140, stockMinimo: 200, proveedorId: 2, precioRef: 2100 },
  { id: 4, codigo: 'MP-001', nombre: 'Agua desmineralizada', unidad: 'kg', stock: 3000, stockMinimo: 1000, proveedorId: null, precioRef: 12 },
  { id: 5, codigo: 'MP-412', nombre: 'Esencia lavanda', unidad: 'kg', stock: 18, stockMinimo: 25, proveedorId: 3, precioRef: 46500 },
  { id: 6, codigo: 'MP-413', nombre: 'Esencia citrus', unidad: 'kg', stock: 32, stockMinimo: 25, proveedorId: 3, precioRef: 41200 },
  { id: 7, codigo: 'MP-520', nombre: 'Propelente butano/propano', unidad: 'kg', stock: 610, stockMinimo: 400, proveedorId: 1, precioRef: 980 },
  { id: 8, codigo: 'EN-010', nombre: 'Envase aerosol 400 ml', unidad: 'u', stock: 5200, stockMinimo: 8000, proveedorId: 4, precioRef: 310 },
];

export const ordenesSemilla = () => [
  {
    id: 1, numero: 'OC-0001', proveedorId: 1, fecha: dias(-20), fechaEntrega: dias(-12), estado: 'recibida',
    items: [{ codigo: 'MP-101', cantidad: 600, precio: 1420 }],
    observaciones: '', creadoPor: 'compras',
    historial: [
      { fecha: dias(-20), usuario: 'compras', accion: 'Creada' },
      { fecha: dias(-19), usuario: 'admin', accion: 'Aprobada' },
      { fecha: dias(-12), usuario: 'compras', accion: 'Recibida' },
    ],
  },
  {
    id: 2, numero: 'OC-0002', proveedorId: 3, fecha: dias(-6), fechaEntrega: dias(3), estado: 'aprobada',
    items: [{ codigo: 'MP-412', cantidad: 40, precio: 46000 }, { codigo: 'MP-413', cantidad: 20, precio: 41000 }],
    observaciones: 'Entregar con certificado de análisis.', creadoPor: 'compras',
    historial: [
      { fecha: dias(-6), usuario: 'compras', accion: 'Creada' },
      { fecha: dias(-5), usuario: 'admin', accion: 'Aprobada' },
    ],
  },
  {
    id: 3, numero: 'OC-0003', proveedorId: 2, fecha: dias(-2), fechaEntrega: dias(7), estado: 'pendiente',
    items: [{ codigo: 'MP-310', cantidad: 300, precio: 2080 }, { codigo: 'MP-205', cantidad: 10, precio: 18500 }],
    observaciones: '', creadoPor: 'compras',
    historial: [{ fecha: dias(-2), usuario: 'compras', accion: 'Creada y enviada a aprobación' }],
  },
  {
    id: 4, numero: 'OC-0004', proveedorId: 4, fecha: dias(0), fechaEntrega: dias(15), estado: 'borrador',
    items: [{ codigo: 'EN-010', cantidad: 10000, precio: 300 }],
    observaciones: '', creadoPor: 'compras',
    historial: [{ fecha: dias(0), usuario: 'compras', accion: 'Creada' }],
  },
];

export const recepcionesSemilla = () => [
  {
    id: 1, numero: 'REC-0001', ordenId: 1, codigo: 'MP-101', cantidad: 600, loteProveedor: 'AL-2611-07',
    fecha: dias(-12), recibidoPor: 'compras', estado: 'aprobado',
    calidad: { usuario: 'calidad', fecha: new Date(Date.now() - 11 * 864e5).toISOString(), comentario: '' },
  },
];
