# Capturas de pantalla — base para el rediseño

Imágenes de **todas** las pantallas del sistema, tomadas con sesión de
administrador sobre datos reales de MasterLab.

- **Tamaño:** 390 × 844 px (móvil, el uso real) a 2x de densidad.
- **Modo:** claro. La app también tiene modo oscuro (ver `01-login.png`).
- **Página completa:** cada imagen incluye todo el alto de la pantalla, no
  solo lo visible. Por eso el menú inferior —que es fijo— aparece flotando a
  media imagen en las pantallas largas: no es un defecto del diseño.

## Cómo regenerarlas

Con el servidor corriendo (`npx next dev -p 3111`):

```bash
CAP_EMAIL=<correo> CAP_PASS=<clave> \
CAP_ID_TRABAJO=<uuid> CAP_ID_CONSULTORIO=<uuid> CAP_ID_DOCTOR=<uuid> \
CAP_ID_CATALOGO=<uuid> CAP_ID_TRABAJADOR=<uuid> \
node scripts/capturar-pantallas.mjs

CAP_EMAIL=<correo> CAP_PASS=<clave> node scripts/capturar-extras.mjs
```

El segundo script cubre las pantallas que necesitan datos y los estados
interactivos; crea un insumo de prueba y lo elimina al terminar.

## Índice

### Acceso
| Archivo | Pantalla |
|---|---|
| `01-login.png` | Inicio de sesión (modo oscuro) |

### Día a día
| Archivo | Pantalla |
|---|---|
| `02-hoy.png` | Hoy — entregas del día |
| `03-trabajos-lista.png` | Trabajos — lista con filtros y buscador |
| `04-trabajos-nuevo.png` | Nuevo trabajo (cuenta con una línea) |
| `05-trabajo-detalle.png` | Detalle del trabajo: líneas, etapas, pagos |
| `06-trabajo-editar.png` | Editar trabajo |
| `07-trabajo-recibo.png` | Recibo de venta (ticket 80 mm) |

### Clientes
| Archivo | Pantalla |
|---|---|
| `08-consultorios-lista.png` | Consultorios |
| `09-consultorios-nuevo.png` | Nuevo consultorio |
| `10-consultorio-detalle.png` | Detalle del consultorio y sus doctores |
| `11-consultorio-editar.png` | Editar consultorio |
| `12-consultorios-cuentas.png` | Estado de cuenta: deuda por consultorio y doctor |
| `13-doctor-detalle.png` | Detalle del doctor y sus trabajos |

### Inventario
| Archivo | Pantalla |
|---|---|
| `14-inventario-lista.png` | Inventario vacío (estado real actual) |
| `14b-inventario-con-datos.png` | Inventario con un insumo |
| `15-inventario-nuevo.png` | Nuevo insumo |
| `16-inventario-detalle.png` | Detalle del insumo: stock, movimientos, historial |
| `17-inventario-editar.png` | Editar insumo |
| `18-inventario-liquidacion.png` | Liquidación sin insumos |
| `18b-liquidacion-con-datos.png` | Liquidación con un insumo |

### Dinero
| Archivo | Pantalla |
|---|---|
| `19-finanzas.png` | Finanzas: KPIs y gráficos |
| `20-reportes.png` | Reportes con filtros y agrupación |
| `21-reportes-ticket.png` | Reporte en ticket 80 mm |

### Configuración
| Archivo | Pantalla |
|---|---|
| `22-configuracion.png` | Menú de configuración |
| `23-catalogo-lista.png` | Catálogo de trabajos (con reordenar) |
| `24-catalogo-nuevo.png` | Nuevo tipo de trabajo |
| `25-catalogo-detalle.png` | Detalle: etapas y receta de insumos |
| `26-catalogo-editar.png` | Editar tipo de trabajo |
| `27-trabajadores-lista.png` | Trabajadores |
| `28-trabajadores-nuevo.png` | Nuevo trabajador |
| `29-trabajador-detalle.png` | Detalle del trabajador y sus pagos |
| `30-usuarios.png` | Usuarios |
| `30b-usuarios-permisos.png` | Usuarios con el editor de permisos |
| `31-auditoria.png` | Auditoría |

### Estados interactivos
Lo que una captura estática de la ruta no muestra:

| Archivo | Estado |
|---|---|
| `32-estado-dialogo-eliminar.png` | Diálogo de confirmación de borrado |
| `33-estado-buscador-de-tipo-abierto.png` | Buscador de tipo de trabajo desplegado |
| `34-estado-cuenta-con-tres-lineas.png` | Cuenta con tres líneas de trabajo |

## No incluido

Las rutas `/trabajos/[id]/recibo/pdf` y `/reportes/pdf` no son pantallas:
devuelven un archivo PDF descargable. Su diseño se ve abriendo el PDF.
