# MES · SPH

Manufacturing Execution System de planta, armado sobre el monitor de salas
(`sph-monitoreo`): mismos estilos, mismo stack (**React 19 + Vite + Tailwind CSS 3**),
organizado en módulos independientes.

| Módulo | Ruta | Qué hace | Acceso |
| --- | --- | --- | --- |
| **Programación** | `/programacion` | Órdenes de producción leídas de Bejerman, agrupadas por línea; Producción/admin cambian la prioridad o reasignan la línea | `programacion.ver` |
| **Monitoreo** | `/monitoreo` | Salas/PLC en vivo por MQTT: producto, etapa, peso, válvula, receta en curso y gráfico de peso | Libre |
| **Administración** | `/administracion` | Maestro de tolvas: receta (alcohol, colorante, glicerina, agua, esencia) de cada producto a partir de su código | `admin.ver` |
| **Calidad** | `/calidad` | Panel con indicadores, revisión de cantidades de las órdenes de producción (antes de Elaboración), bandeja de lotes a liberar (aprobar/rechazar), inspección de materia prima recibida y registro de decisiones exportable | `calidad.ver` |
| **Elaboración** | `/elaboracion` | Elaboraciones de los PLC: una card por PLC (Elaboración y Aerosoles) con su estado en vivo, últimas elaboraciones de todos o de uno (`/elaboracion/:area/:plc`), historial con filtros (`/elaboracion/historial`) y etiqueta digital de cada lote (`/elaboracion/lotes/:id`) | `elaboracion.ver` |
| **Producción** | `/produccion` | Tolvas de cada línea: en uso, en espera por prioridad (con estado de Calidad) y cambio de tolva escaneando el código, validando que sea la que sigue | `produccion.ver` |
| **Auditoría** | `/auditoria` | Control documental de cada tolva aprobada por Calidad (orden, lavado, lote del PLC, aprobación); no bloquea el uso | `auditoria.ver` |
| **Compras** | `/compras` | Órdenes de compra (borrador → aprobación → recepción), proveedores, stock de materias primas con punto de pedido y recepciones | `compras.ver` |

Los módulos están conectados como en planta:
**Compras recibe una OC → se genera una recepción “en inspección” → Calidad la libera → recién ahí suma stock.**
Y los lotes que registran los PLC (se ven en Elaboración) son los que Calidad libera.

> La vista anterior de Elaboración, "Órdenes a elaborar" (cola por línea con receta escalada a la tolva y asignación de tolvas),
> se quitó el 2026-11-19. Está intacta en el commit `4474790`:
> `git show 4474790:src/modules/elaboracion/pages/OrdenesElaborar.jsx`

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
| `produccion` | Producción | Cambiar la prioridad de las órdenes de producción y reasignarlas de línea |
| `elaborador` | Elaborador | Ver las elaboraciones de cada PLC, el historial y la etiqueta digital de los lotes |
| `linea` | Línea | Cambio de tolva en su línea y marcar tolvas vacías |
| `auditoria` | Auditoría | Registrar el control documental de cada tolva |
| `calidad` | Calidad | Aprobar/rechazar lotes e ingresos de MP |
| `compras` | Compras | Crear/editar OC, proveedores, registrar recepciones |
| `usuario` | Consulta | Ver Programación, Calidad y Compras sin modificar |

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
    programacion/        lib/api.js (órdenes de Bejerman + prioridad/línea), pages/Ordenes
    administracion/      lib/api.js (maestro de tolvas), pages/ (Recetas, RecetaForm)
    elaboracion/         pages/ (Elaboraciones: cards por PLC + últimas elaboraciones, Historial,
                         EtiquetaDigital; Calidad y Auditoría reusan la etiqueta en sus rutas)
    produccion/          pages/TolvasLinea (tolvas por línea, cambio de tolva)
    auditoria/           lib/api.js (controles), pages/TolvasControlar
    monitoreo/           config.js (salas/PLC), MonitorContext (MQTT), lib/ (api, demo, rooms, pdf),
                         components/ (SalasMenu, PesoChart), pages/Dashboard (vista en vivo)
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
| Órdenes de producción | Endpoint `/ordenes_produccion.php` (consulta a la base de Bejerman) **pendiente** | `modules/programacion/lib/api.js` |
| Prioridad y línea de las órdenes | `localStorage` | `leer`/`guardar` en `modules/programacion/lib/api.js` |
| Revisión de cantidades de las órdenes (Calidad) | `localStorage` | `modules/programacion/lib/revision.js` |
| Estado de las tolvas físicas (asignación, en línea, vacía) | `localStorage` | `shared/lib/tolvas.js` |
| Controles de Auditoría | `localStorage` | `modules/auditoria/lib/api.js` |
| Maestro de tolvas (recetas) | `localStorage`, sin datos de ejemplo | cuerpo de cada función de `modules/administracion/lib/api.js` |
| Login | Credenciales en el navegador | `validarCredenciales` en `shared/lib/auth.js` |
| Decisiones de Calidad sobre lotes | `localStorage` | `modules/calidad/lib/aprobaciones.js` |
| Compras (OC, proveedores, MP, recepciones) | `localStorage` con datos de ejemplo | cuerpo de cada función de `modules/compras/lib/api.js` → `http.get/post/put` |

Para volver a los datos de ejemplo de Compras: borrar las claves `sph-mes:*` del localStorage.

## Producción

1. `npm ci && npm run build` y subir el contenido de `dist/` a la raíz del sitio.
2. Editar **`config.env`** en la raíz del sitio (viene de `public/config.env`): broker MQTT, API y
   usuarios por perfil. Se aplica al recargar la página, **sin recompilar**.
   Prioridad de cada valor: `config.env` › `VITE_*` grabada al compilar › valor de fábrica
   (ver `src/app/entorno.js`). Todo lo que va ahí queda visible en el navegador
   (por eso el usuario MQTT es de solo lectura).
3. Configurar en el servidor web (Nginx o Apache):
   - **Fallback de rutas** a `index.html` (para que `/calidad/pendientes` funcione al recargar).
   - **Proxy de `/api`** hacia la API PHP (`http://10.200.1.243:8080`; no envía CORS).
   - **Proxy de `/mqtt`** hacia el WebSocket del broker (`:9001`) si el sitio va por HTTPS,
     compilando con `VITE_MQTT_URL=wss://<dominio>/mqtt`.
4. Probar primero con `/?demo` (sin API ni broker) y después sin demo.

El detalle de cada variable, ejemplos de configuración de Nginx/Apache y un checklist de
problemas comunes están en el documento *SPH MES: configuración (.env) y despliegue en servidor*.

Rutas viejas que redirigen solas: `/historial` y `/monitoreo/historial` → `/elaboracion/historial`;
`/lotes/:id` y `/monitoreo/lotes/:id` → `/elaboracion/lotes/:id`.
