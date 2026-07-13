# GestionLab — Especificación de Diseño

**Fecha:** 2026-07-13
**Autor:** dbenitez@p1s.pe
**Estado:** Diseño aprobado (Fase de brainstorming completada)

---

## 1. Resumen del producto

**GestionLab** es una aplicación web (PWA mobile-first) para la gestión integral de
**laboratorios dentales/protésicos**. Nace como herramienta interna para el
**Laboratorio Dental MasterLab** (Téc. Marlon Chávez) y está diseñada desde el día 1
como **SaaS multi-inquilino** para comercializarse luego a otros laboratorios.

### Contexto de negocio
- El laboratorio **recibe trabajos de consultorios/clínicas externas**.
- Cada **consultorio** tiene varios **doctores** (odontólogos) que refieren pacientes/trabajos.
- El dinero pertenece al laboratorio (MasterLab); consultorios y doctores son la
  **fuente de referencia** que se mide para saber quién genera más ingresos.
- Problema central a resolver: **mucho trabajo, poco personal** → la UX debe permitir
  registrar y ordenar todo en **pocos toques**, sin estorbar.

### Objetivos de negocio (extendido)
El sistema debe calcular la **utilidad/pérdida real** del laboratorio:
`Ingresos (abonos) − Gastos (insumos consumidos + merma + pagos a trabajadores) = Utilidad`,
y mostrarla en un **panel de inteligencia de negocio (BI) con gráficos claros**.

---

## 2. Alcance y estrategia por fases

### Fase 1 — MVP para MasterLab
Sistema completo y operativo para el laboratorio real, **con arquitectura
multi-inquilino integrada desde el inicio** (cada tabla clave lleva `laboratorio_id`
+ Row Level Security). MasterLab es el **cliente de prueba con licencia gratuita**.

### Fase 2 — Capa comercial (SaaS)
- Registro/onboarding self-service de nuevos laboratorios.
- Suscripciones y cobro (Stripe).
- Landing/marketing.
- Panel de super-administrador.
- MasterLab permanece con **plan de cortesía (gratis)**; los demás pagan.

> YAGNI: la maquinaria de cobro y onboarding NO se construye en Fase 1, pero el modelo
> de datos no se pinta a una esquina (multi-tenant listo).

---

## 3. Arquitectura y stack técnico

| Capa | Tecnología |
|------|------------|
| Frontend + Backend | **Next.js** (React + TypeScript), una sola app, **PWA instalable** |
| Base de datos + Auth + Backups | **Supabase** (PostgreSQL administrado) |
| Aislamiento multi-inquilino | `laboratorio_id` en tablas clave + **Row Level Security (RLS)** |
| Gráficos BI | **Recharts** |
| Hosting | **Vercel** (app) + **Supabase** (datos) — free tier para arrancar |
| Idioma / Moneda | Español / Soles (S/) |

### Decisiones asumidas
- **PWA instalable**, mobile-first, **requiere conexión** para guardar. Sin
  sincronización offline completa en v1 (se puede añadir si el WiFi del taller lo exige).
- Un solo lenguaje (TypeScript), un solo repositorio.

### Modelo de acceso y roles
- **Laboratorio** (tenant) con **plan/licencia** (MasterLab = gratis).
- **Usuarios** pertenecen a un laboratorio, con rol:
  - **Administrador:** acceso total (dinero, reportes, inventario, configuración).
  - **Técnico/Operario:** registra avances de trabajos y etapas; **no ve finanzas ni
    maneja inventario**.

---

## 4. Modelo de datos (entidades)

Todas las tablas de negocio llevan `laboratorio_id` y están protegidas por RLS.

### 4.1 Multi-inquilino y usuarios
- **Laboratorio** — `id`, `nombre`, `plan` (gratis | pagado), `estado`, `creado_en`.
- **Usuario** — `id`, `laboratorio_id`, `nombre`, `email`, `rol` (admin | tecnico).
  Autenticación gestionada por Supabase Auth.

### 4.2 Clientes / fuentes de referencia
- **Consultorio** — `id`, `laboratorio_id`, `nombre`, `contacto`, `notas`.
- **Doctor** — `id`, `consultorio_id`, `nombre`, `contacto`. (Fuente de referencia
  para reportes de ingresos.)

### 4.3 Catálogo y plantillas (configurables por laboratorio)
- **CatalogoTrabajo** (tipo de trabajo) — `id`, `laboratorio_id`, `categoria`
  (Prótesis Fija | Prótesis Total | Prótesis Parcial Removible | Ortodoncia/Ortopedia),
  `nombre`, `precio_base`, y **componente variable** opcional:
  `variable_etiqueta` (ej. "cofia"), `variable_precio_unitario` (ej. 20).
  → Semilla inicial = lista de precios de MasterLab (ver Apéndice A).
- **PlantillaEtapa** — `id`, `catalogo_trabajo_id`, `nombre`, `orden`.
- **Receta** (lista de insumos) — `id`, `catalogo_trabajo_id`, `producto_id`,
  `cantidad_estandar`. Usada para el cálculo automático de consumo.

### 4.4 Trabajos (entidad central)
- **Trabajo** — `id`, `laboratorio_id`, `doctor_id`, `catalogo_trabajo_id`,
  `paciente_nombre` (opcional), `fecha_ingreso`, `fecha_entrega_estimada`,
  `estado` (en_curso | cerrado | entregado), `precio_acordado` (copiado del catálogo,
  **editable con override manual**), `variable_cantidad` (ej. nº de cofias), `notas`.
- **TrabajoEtapa** — `id`, `trabajo_id`, `nombre`, `orden`,
  `estado` (pendiente | en_progreso | completada | **excluida**),
  `motivo_exclusion` (ej. "la hace proveedor externo"), `fecha_cierre`, `responsable_id`.
  → Se copian de la plantilla al crear el trabajo y son **editables por trabajo**
    (agregar/quitar/reordenar/excluir). El trabajo puede **cerrarse aunque haya
    etapas excluidas**.

### 4.5 Pagos del cliente
- **Abono** — `id`, `trabajo_id`, `monto`, `fecha`, `metodo`, `nota`.
  El **adelanto = primer abono** del mismo trabajo (no hay saldo a favor flotante).

### 4.6 Inventario
- **Producto** — `id`, `laboratorio_id`, `nombre`, `unidad` (g | ml | unidad),
  `stock_actual`, `stock_minimo`, `costo_unitario`.
- **MovimientoInventario** — `id`, `producto_id`, `tipo` (ingreso | salida |
  ajuste | merma), `cantidad`, `motivo`, `trabajo_id` (si la salida es por consumo de
  un trabajo), `fecha`, `usuario_id`.
- **Liquidacion** — `id`, `laboratorio_id`, `periodo` (dia | semana | mes),
  `fecha`, `usuario_id`; con detalle de conteo físico vs. teórico y **merma** calculada.

### 4.7 Pagos a trabajadores
- **PagoTrabajador** — `id`, `laboratorio_id`, `trabajador_id`, `monto`, `fecha`,
  `nota`, `catalogo_trabajo_ref` (opcional, cuando el monto proviene de un preset).
- **MontoEstandar** — `id`, `laboratorio_id`, `trabajador_id`, `catalogo_trabajo_id`,
  `monto`. Preset reutilizable ("destajo ligero"): se puede **seleccionar** en un pago
  futuro cuando aplique.

---

## 5. Módulos y experiencia de usuario

Prioridad rectora: **mobile-first, pocos toques, registro instantáneo**.

1. **Hoy** (dashboard operativo) — trabajos del día, avanzar/cerrar etapas al toque.
2. **Trabajos** — crear en pocos toques (doctor → tipo de trabajo → listo);
   detalle con etapas (marcar completada / excluir con motivo) y abonos.
3. **Consultorios / Doctores** — gestión (CRUD) + su historial y ranking de ingresos.
4. **Inventario** — productos, ingreso/salida, recetas, liquidación periódica.
5. **Finanzas / BI** (solo Admin) — panel con gráficos.
6. **Configuración** (solo Admin) — catálogo de trabajos, plantillas de etapas,
   recetas, usuarios.

---

## 6. Reglas de negocio clave

### 6.1 Precio del trabajo
- Al crear un trabajo se copia `precio_base` del catálogo.
- Si el trabajo tiene componente variable, `precio = precio_base +
  variable_cantidad × variable_precio_unitario`.
- **Override manual:** un check permite ingresar un monto distinto (ej. cuando solo se
  hicieron algunas etapas y se cobra "hasta donde se realizó").

### 6.2 Etapas
- Plantilla editable por trabajo. Una etapa puede quedar **excluida** con motivo
  (típicamente porque la realiza un proveedor externo).
- El trabajo se cierra aunque existan etapas excluidas o no completadas.

### 6.3 Consumo de inventario y merma (modelo C)
- Al cerrar/entregar un trabajo, el sistema **descuenta automáticamente** del stock
  las cantidades de la **receta** (movimiento tipo `salida`, ligado al trabajo).
- En el **cierre de periodo** (día/semana/mes) se hace una **liquidación**: se compara
  el stock teórico contra el **conteo físico real** y se registra la **merma**
  (ajuste de stock tipo `merma`).
- Justificación: cada paciente requiere tamaños/cantidades distintos (unos gramos de
  variación que, a la larga, se notan). La receta es el estimado; la liquidación captura
  la deriva real.

### 6.4 Finanzas
- **Ingresos** = suma de abonos recibidos.
- **Gastos** = costo de insumos consumidos (según movimientos) + merma valorizada +
  pagos a trabajadores.
- **Utilidad** = Ingresos − Gastos.

---

## 7. Inteligencia de negocio (BI) — gráficos

- **Utilidad / pérdida** por periodo (día/semana/mes).
- **Ranking de consultorios y doctores** por ingreso y por cantidad de trabajos.
- **Consumo por producto** y **merma** por periodo.
- **Tipos de trabajo** más frecuentes / de mayor ingreso.
- Estado de trabajos (en curso / cerrados / entregados).

---

## 8. Requisitos no funcionales

- **Mobile-first / responsive**; PWA instalable en teléfono, tablet y laptop.
- **Seguridad:** aislamiento por RLS, validación de entrada en todos los bordes,
  sin secretos hardcodeados (variables de entorno), manejo explícito de errores.
- **Backups** automáticos (Supabase).
- **Español**, moneda **Soles (S/)**.
- Patrones inmutables y archivos pequeños/cohesivos (según estándares del equipo).

---

## 9. Dirección visual (UI/UX)

Objetivo declarado: interfaz **espectacular pero sencilla — minimalista, limpia y
profesional**, que agilice el trabajo en vez de estorbarlo.

- **Estilo:** minimalismo profesional con jerarquía por escala tipográfica y espacio
  (no densidad de controles). Nada de "plantilla genérica" (anti-template).
- **Sistema de diseño:** design tokens (color, tipografía, espaciado, radios, sombras)
  como variables; consistencia en toda la app.
- **Mobile-first real:** objetivos táctiles grandes, acciones primarias al alcance del
  pulgar, flujos de "pocos toques" para crear trabajos y avanzar etapas.
- **Estados designados:** hover/focus/active/carga/vacío/error cuidados, no por defecto.
- **BI legible:** las gráficas forman parte del sistema de diseño (paleta accesible,
  consistente en claro/oscuro), no un añadido.
- **Accesibilidad:** contraste, navegación por teclado, `prefers-reduced-motion`.
- **Implementación:** se usará la skill **frontend-design** para la dirección estética
  y las reglas de **design-quality** del equipo; los gráficos siguen la skill **dataviz**.

---

## Apéndice A — Catálogo semilla de MasterLab (precios en S/)

### Prótesis Fija
| Trabajo | Precio |
|---|---|
| Perno colado – directo o indirecto | 20.00 |
| Corona porcelana sobre metal (cerámico) | 90.00 |
| Corona porcelana veneer | 80.00 |
| Corona porcelana libre de metal (jacket) | 120.00 |
| Corona disilicato de litio | 150.00 |
| Corona porcelana sobre zirconio | 200.00 |
| Carilla porcelana feldespática | 100.00 |
| Carilla disilicato de litio | 150.00 |
| Incrustación de resina | 50.00 |
| Incrustación porcelana | 100.00 |
| Incrustación disilicato de litio | 150.00 |
| Provisionales acrílico | 20.00 |

### Prótesis Total
| Trabajo | Precio |
|---|---|
| Totales acrílico | 120.00 |
| Totales acrílico con malla | 130.00 |
| Provisional de totales | 50.00 |
| Prótesis telescópicas | 120.00 + 20 × cofia |
| Rebasados termocurado | 50.00 |

### Prótesis Parcial Removible
| Trabajo | Precio |
|---|---|
| Base metálica terminada | 200.00 |
| Prótesis flexibles | 200.00 |
| Prótesis combinada flex | 320.00 |
| Parcial acrílico + wipla | 120.00 |
| Parcial acrílico + ganchos colados | 150.00 |

### Aparato Ortodoncia – Ortopedia
| Trabajo | Precio |
|---|---|
| Placa de contención (el juego) | 120.00 |
| Placa de contención acetato rígido | 30.00 |
| Placa con tornillo de expansión | 80.00 |
| Hyrax | 120.00 |
| Placa miorelajante acrílico | 50.00 |
| Placa miorelajante acetato | 30.00 |
| ATP o ALP | 60.00 |
