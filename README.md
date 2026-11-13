# MES · SPH

Manufacturing Execution System de planta, armado sobre el monitor de salas
(`sph-monitoreo`): mismos estilos, mismo stack (**React 19 + Vite + Tailwind CSS 3**),
organizado en módulos independientes.

| Módulo | Ruta | Qué hace | Acceso |
| --- | --- | --- | --- |
| **Monitoreo** | `/monitoreo` | Salas/PLC en vivo por MQTT, receta en curso, gráfico de peso, historial y etiqueta digital (todo lo del monitor original) | Libre |
| **Calidad** | `/calidad` | Panel con indicadores, bandeja de lotes a liberar (aprobar/rechazar), inspección de materia prima recibida y registro de decisiones exportable | `calidad.ver` |
| **Compras** | `/compras` | Órdenes de compra (borrador → aprobación → recepción), proveedores, stock de materias primas con punto de pedido y recepciones | `compras.ver` |

Los módulos están conectados como en planta:
**Compras recibe una OC → se genera una recepción “en inspección” → Calidad la libera → recién ahí suma stock.**
Y los lotes que produce Monitoreo son los que Calidad libera.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev -- --open "/?demo"   # modo demo: PLC y lotes simulados, sin broker ni API
npm run lint
npm run build
```

Copiar `.env.example` como `.env.local` para cambiar broker, API o credenciales.

### Perfiles (provisorio)

Hasta tener login real, las credenciales se validan en el navegador (`src/shared/lib/auth.js`).
Por defecto usuario = contraseña:

| Usuario | Perfil | Puede |
| --- | --- | --- |
| `admin` | Administrador | Todo, incluida la aprobación de órdenes de compra |
| `calidad` | Calidad | Aprobar/rechazar lotes e ingresos de MP |
| `compras` | Compras | Crear/editar OC, proveedores, registrar recepciones |
| `usuario` | Consulta | Ver Calidad y Compras sin modificar |

Los permisos se definen en un solo lugar (`PERMISOS` en `auth.js`) y las pantallas preguntan
por permiso (`puede('compras.editar')`), nunca por rol.

> ⚠️ La protección es de interfaz. Cuando exista el backend, **la API debe validar cada permiso**.

## Estructura

```
src/
  app/
    App.jsx              RouterProvider
    router.jsx           Árbol de rutas (data router), protección por permiso, redirecciones viejas
    modulos.js           Registro de módulos: pestañas, menú lateral e inicio se arman desde acá
    config.js            Config general (API_BASE)
  shared/                Todo lo que usan 2+ módulos
    layout/              Layout, TopBar, ModuloNav (pestañas), Sidebar genérico, StatusBar
    components/          base.jsx (Card, Kpi, Encabezado, Campo, EstadoConsulta…), clases.js,
                         ui.jsx (Chip, Switch…), LotesTable, LoginModal, RequierePermiso…
    hooks/               useConsulta (carga async con error/recarga/polling), useTituloVista
    lib/                 auth (sesión + permisos), http (cliente fetch), almacen (repositorio
                         localStorage provisorio), alertas (SweetAlert + toasts), csv, format, estados
  modules/
    monitoreo/           config.js (salas/PLC), MonitorContext (MQTT), lib/ (api, demo, rooms, pdf),
                         components/ (SalasMenu, PesoChart), pages/ (Dashboard, Historial, EtiquetaDigital)
    calidad/             lib/ (aprobaciones, modales, hooks), pages/ (Panel, LotesPendientes,
                         IngresosMP, Decisiones)
    compras/             data/semilla.js, lib/ (api, estados), components/, pages/ (Panel, Ordenes,
                         OrdenForm, OrdenDetalle, MateriasPrimas, Proveedores, Recepciones)
  pages/                 Inicio, ErrorRuta
```

Imports con alias: `@/` = `src/` (configurado en `vite.config.js` y `jsconfig.json`).

### Convenciones

- **Cada módulo exporta su `routes.jsx`** con páginas `lazy()`: el código de un módulo se descarga solo al entrarle.
- **El título de cada vista** va en el `handle` de su ruta (`{ titulo, sub }`); el TopBar lo toma solo.
- **Las pantallas no hablan con `fetch` ni `localStorage`**: llaman al `api.js` de su módulo, que devuelve Promesas.
- **Estilos**: reutilizar `Card`, `Kpi`, `BOTON.*`, `INPUT`, `TH`/`TD` y `Chip` antes de escribir clases nuevas.

### Agregar un módulo (ej.: Mantenimiento)

1. Crear `src/modules/mantenimiento/` con `pages/` y `routes.jsx`.
2. Sumarlo a `MODULOS` en `src/app/modulos.js` (label, ícono, permiso, ítems del menú).
3. Colgar sus rutas en `src/app/router.jsx` y, si hace falta, agregar permisos en `auth.js`.

## Qué es provisorio (y dónde cambiarlo)

| Qué | Hoy | Dónde reemplazar |
| --- | --- | --- |
| Login | Credenciales en el navegador | `validarCredenciales` en `shared/lib/auth.js` |
| Decisiones de Calidad sobre lotes | `localStorage` | `modules/calidad/lib/aprobaciones.js` |
| Compras (OC, proveedores, MP, recepciones) | `localStorage` con datos de ejemplo | cuerpo de cada función de `modules/compras/lib/api.js` → `http.get/post/put` |

Para volver a los datos de ejemplo de Compras: borrar las claves `sph-mes:*` del localStorage.

## Vercel (demo pública)

Vercel no llega a la red de planta (broker MQTT y API en `10.200.1.243`), así que ahí la app
corre **siempre en modo demo**:

- Variable de entorno en Vercel: `VITE_DEMO=true` (no cargar `VITE_MQTT_PASS`: quedaría expuesta).
- `vercel.json` ya hace el fallback de rutas a `index.html`.
- Rama de producción: `main`. Cada push a `desarrollo` genera una URL de vista previa.

## Producción

Igual que el monitor original: subir `dist/` y configurar en el servidor

1. **Fallback de rutas** a `index.html` (para que `/calidad/pendientes` funcione al recargar).
2. **Proxy de `/api`** hacia la API PHP (no envía CORS).

Las rutas del monitor viejo (`/historial`, `/lotes/:id`) redirigen solas a las nuevas.
