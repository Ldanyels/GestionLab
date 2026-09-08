# Handoff: Rediseño GestionLab (móvil + escritorio)

Repo destino: `Ldanyels/GestionLab` (Next.js App Router, rama `main`).
Fecha: 8 de setiembre de 2026.

## 1. Resumen

Rediseño completo de la interfaz de GestionLab (gestión de laboratorio dental: trabajos, consultorios, cobranza, inventario, finanzas y configuración). **No se agregó ni se quitó ninguna funcionalidad**: es el mismo sistema con otra jerarquía visual, otra navegación y otras densidades. Objetivos: menos toques para las tareas frecuentes, cero texto cortado, importes siempre legibles, y una versión de escritorio real además del móvil.

## 2. Sobre los archivos de este paquete

`GestionLab Rediseño.dc.html` + `support.js` son una **referencia de diseño hecha en HTML**: un prototipo navegable que muestra el aspecto y el comportamiento buscados. **No es código de producción y no debe copiarse al repo.** La tarea es **recrear estas pantallas dentro del entorno existente** de GestionLab (Next.js + React + los componentes de `components/`), respetando sus patrones actuales (server/client components, rutas del App Router, helpers de `lib/`).

Cómo abrirlo: los dos archivos deben quedar en la misma carpeta; abre el `.dc.html` en un navegador. La navegación es real (todos los botones llevan a alguna pantalla), los datos son simulados y las acciones destructivas o de guardado muestran un aviso en lugar de persistir.

## 3. Fidelidad

**Alta fidelidad (hi-fi).** Colores, tipografías, tamaños, radios y espaciados son finales y están listados en la sección 9. Recrear pixel-perfect usando los componentes existentes del repo. Los textos de la interfaz que aparecen en el prototipo son los definitivos (español, tuteo, sin emoji).

## 4. Cambios estructurales respecto a la versión actual

1. **Navegación**: barra inferior de 5 destinos en móvil (Hoy · Consultorios · Trabajos · Inventario · Finanzas) y **barra lateral fija de 236 px en escritorio** (≥ 980 px) con los mismos 5 destinos + Configuración, Tema y Salir al pie. Configuración sale de la barra inferior y pasa al header móvil.
2. **Pantalla "Hoy"**: nueva pantalla de entrada. Reemplaza el aterrizaje directo en la lista de trabajos. Se entregan **dos direcciones** (A y B) — hay que elegir una antes de implementar; ver sección 5.1.
3. **Alta de trabajo**: el tipo de trabajo se elige en una **hoja inferior con buscador** agrupada por categoría, en vez de un `<select>` largo. Cantidad con stepper − / +. El total y el CTA viven en una barra pegada al fondo.
4. **Ficha de trabajo**: una sola pantalla con tarjeta de cabecera (precio, saldo, ingreso, entrega), acciones primarias, costeo, etapas con barra de progreso y pagos. Antes estaba repartido en secciones apiladas sin jerarquía.
5. **Estado de cuenta**: total por cobrar como cifra grande, seguido de la lista por consultorio ordenada de mayor a menor deuda.
6. **Catálogo**: cada tipo de trabajo conserva sus **flechas ↑ / ↓ para reordenar dentro de su categoría** (comportamiento existente que debe mantenerse; ver 6.4).
7. **Modo oscuro** completo, persistido.

## 5. Pantallas

Todas comparten: fondo `--bg`, contenido en columna con `gap: 16px`, ancho máximo 880 px centrado, `padding: 18px 16px 110px` (el 110 inferior deja sitio a la barra de navegación). Toda pantalla de detalle o formulario empieza con una fila de retorno: botón cuadrado de 40 px (borde `--border`, radio 12, chevron izquierdo de 18 px) + título `h1` de 24 px/700/-0.02em, o la miga de pan en 13.5 px `--muted`.

### 5.1 Hoy — dos direcciones (elegir una)

Ambas comparten el encabezado: sobretítulo con la fecha en 13 px/600, mayúsculas, `letter-spacing: .06em`, color `--muted`; `h1` "Hoy" de 30 px/700/-0.03em. El conmutador A/B del prototipo es **solo para la revisión** y no va a producción.

**Dirección A — agenda del día (recomendada para el técnico).**
- Fila de 3 KPI (`grid`, `auto-fit`, `minmax(150px,1fr)`, gap 10): Entregas de hoy, En curso, Por cobrar. Tarjeta: `--surface`, borde 1 px, radio 16, padding 14/16, sombra `--shadow`. Etiqueta 12.5 px/600 `--muted`; cifra 26 px/700 en Geist Mono, `-0.02em`. La de "Por cobrar" en `--danger`.
- CTA "Nuevo trabajo": ancho completo, alto 56, radio 16, fondo `--accent`, texto `--accentOn` 16.5 px/600, icono "+" de 20 px, sombra `0 6px 18px var(--accentGlow)`, `transform: scale(.99)` al presionar.
- "Agenda de entregas": título 17 px/700 + enlace "Ver todos →" 13.5 px/600 en `--accent`. Cada fila es una tarjeta con **borde izquierdo de 4 px del color del consultorio**, radio 14, padding 13/14: título 15.5 px/600 (`text-wrap: balance`), subtítulo 13 px `--muted` (`Consultorio · Doctor`), y a la derecha un chip "Hoy"/"Mañana" (11.5 px/700, radio 999, `--dangerSoft`/`--danger` para hoy, `--accentSoft`/`--accent` para mañana) sobre el precio en 14 px/600 mono. Hover: `translateY(-1px)`.
- "A quién cobrar": lista de los 4 consultorios con más deuda dentro de una sola tarjeta con filas separadas por `border-bottom`; punto de color de 8 px, nombre 15 px/600, detalle 12.5 px `--muted` (`doctores · N trabajos`), monto 15 px/700 mono en `--danger`. Enlace "Estado de cuenta →".

**Dirección B — tablero de cobranza (recomendada para el dueño).**
- Tarjeta principal (radio 20, padding 20): "Por cobrar acumulado" 13 px/600 `--muted`, cifra 38 px/700 mono `-0.03em` en `--danger`, línea de contexto 13 px `--muted`, botón "Cobrar" secundario arriba a la derecha; debajo dos botones en fila que envuelven: "+ Nuevo trabajo" (primario) y "Emitir reporte" (secundario), alto 48, radio 14.
- Tres tarjetas de estado (En curso / Entregados / Facturado mes) con etiqueta en mayúsculas 12.5 px/700 `.05em` coloreada (`--warn`, `--success`, `--accent`), cifra 30 px/700 mono y pie 13 px `--muted`.
- "Próximas entregas": filas con cuadro de 44 px a la izquierda que contiene "Hoy"/"Mañana" en 11.5 px/700 sobre el fondo suave correspondiente.

### 5.2 Login
Centrado, dos columnas que envuelven (`wrap-reverse`), gap 48, máximo 1000 px. Tarjeta de formulario: máx. 400 px, radio 20, padding 28. Logotipo (diente, trazo 1.7, `--accent`) + "GestionLab" 20 px/700. `h1` 26 px/700/-0.02em "Entrar al laboratorio", bajada 14 px `--muted`. Campos: etiqueta 13 px/600 `--muted`, input alto 48, radio 12, fondo `--surface2`, borde `--border`, texto 15 px; el de contraseña lleva botón de ojo de 36 px dentro, a la derecha. Botón "Ingresar" alto 50, radio 12, `--accent`. Pie: enlace "¿Olvidaste tu contraseña?" y conmutador de tema. Columna derecha: sobretítulo, `h2` 34 px/700/-0.03em y párrafo 15 px/1.55 `--muted` — es copy de presentación, opcional en producción.

### 5.3 Trabajos (lista)
`h1` 28 px/700/-0.03em + botón "+ Nuevo". Buscador de alto 48, radio 14, con lupa de 18 px a 14 px del borde izquierdo (padding-left 42), placeholder "Buscar por paciente, doctor o tipo…"; filtra por título, paciente, doctor y consultorio. Fila de filtros con scroll horizontal: pastillas de 36 px de alto, radio 999, con el conteo en mono al lado del rótulo; activa = fondo `--accent`, texto `--accentOn`. Filtros: Todos / En curso / Cerrados / Entregados.

Tarjeta de trabajo (radio 14, padding 14, borde izquierdo 4 px del color del consultorio, sombra `--shadow`, hover `translateY(-1px)`), en tres filas:
1. Título 16 px/600 (`n × Tipo` si la cantidad es mayor que 1) + chip de estado a la derecha: punto de 6 px + rótulo 11.5 px/700, `nowrap`, radio 999. En curso `--warnSoft`/`--warn`; Cerrado `--accentSoft`/`--accent`; Entregado `--successSoft`/`--success`.
2. `Consultorio · Doctor · Paciente` en 13 px `--muted`.
3. Píldora de deuda ("Debe S/ x" en `--dangerSoft`/`--danger`, o "Pagado" en `--successSoft`/`--success`, mono 11.5 px/700, radio 8) + "Entrega MM/DD" 12 px `--muted`; a la derecha el precio en 16 px/700 mono.

Vacío: caja de borde punteado, "Sin resultados" 15 px/600 + "Cambia el filtro o limpia la búsqueda." 13.5 px `--muted`.

### 5.4 Nuevo trabajo / Editar trabajo
Misma pantalla; cambian título ("Nuevo trabajo" / "Editar trabajo"), CTA ("Crear trabajo" / "Guardar cambios") y el retorno. En edición se muestra la nota: "Al cambiar las líneas, las etapas ya creadas no se recalculan."

1. **Consultorio y doctor**: `select` de 48 px en tarjeta propia, opciones `Consultorio — Doctor`.
2. **Trabajos de la cuenta**: título 16 px/700 + contador "N línea(s)". Cada línea es una tarjeta (radio 16, padding 14, gap 12):
   - Selector de tipo: botón de ancho completo, mín. 48 px de alto, fondo `--surface2`, radio 12, con el nombre a la izquierda (o "Elegir tipo de trabajo…" si está vacío) y el precio en mono 13.5 px + chevron a la derecha; hover `border-color: --accent`. Abre la hoja de selección (6.1). A su lado, si hay más de una línea, botón de quitar de 48 px con "×" en `--danger`.
   - Fila de cantidad: rótulo "Cantidad" 13 px/600 `--muted`; stepper (grupo con borde, radio 12) − 46×44 / valor 52 px centrado en mono 16 px/600 / + 46×44; mínimo 1. Junto a él, input "Pieza / diente (11, 21)" que crece (`flex: 1 1 150px`).
   - Pie con `border-top`: "Subtotal" 13 px `--muted` + monto 16 px/700 mono, que es `precio del tipo × cantidad`.
   - Botón "+ Agregar otro trabajo": alto 48, borde punteado 1.5 px, texto `--accent`; hover con fondo `--accentSoft`.
3. **Datos opcionales**: Paciente, Fecha de entrega (`input[type=date]`), Notas (`textarea` de 3 filas). Cada etiqueta marca "(opcional)" en peso 400.
4. **Barra de total** (`position: sticky; bottom: 76px`, radio 18, sombra `--pop`): "Total de la cuenta" 14 px/600 `--muted` + suma en 26 px/700 mono; checkbox de 20 px "Ingresar un monto manual (ej. cobrar solo hasta donde se hizo)" que al activarse revela un input de monto; CTA de alto 52.

### 5.5 Detalle de trabajo
- **Cabecera** (radio 18, padding 18, borde izquierdo 4 px del consultorio): `h1` 24 px/700, línea `Consultorio · Doctor · Paciente · Pza`, chip de estado a la derecha. Rejilla de 4 datos (`minmax(120px,1fr)`, fondo `--surface2`, radio 12): Precio acordado, Saldo (verde si 0, `--danger` si hay deuda), Ingreso, Entrega. Dos botones de acción: "Cerrar trabajo" (primario) y "Marcar entregado" (secundario, hover verde). Fila de enlaces: Recibo · Editar · "+ Otro trabajo para este doctor" · **Eliminar** (en `--danger`, empujado a la derecha).
- **Trabajos de la cuenta**: líneas nombre / importe.
- **Costeo del trabajo**: tres columnas centradas (Precio, Insumos, Margen en `--success`) + nota "El costo de insumos se calcula al cerrar el trabajo, según su receta."
- **Etapas**: título + "N% completado" en mono; barra de progreso de 8 px (fondo `--surface2`, relleno `--accent`, `transition: width .3s`); cada etapa en fila con borde: nombre, chip de estado (Pendiente `--surface2`/`--muted`, En progreso `--accentSoft`/`--accent`, Completada `--successSoft`/`--success`, Excluida), botón "Avanzar" y botón de texto "Excluir". El progreso ignora las excluidas.
- **Pagos**: tres cifras (Precio / Pagado / Saldo); lista de abonos (monto en `--success` mono + `fecha · método · nota`) o "Sin abonos aún. El primero se registra como adelanto."; formulario de alta: monto, método (Efectivo / Yape-Plin / Transferencia), nota y botón "Registrar abono" de ancho completo. Validación: monto obligatorio y mayor que 0 → aviso "Ingresa un monto".

### 5.6 Recibo de venta (80 mm)
Botones "Imprimir 80 mm" (primario) y "Exportar PDF". Cuerpo: 360 px máx., centrado, todo en Geist Mono 13 px / interlineado 1.7, separadores `1px dashed --border`. Orden: MasterLab / "Recibo de venta" / fecha y hora / Doctor / Paciente / líneas / Total / Pagado / **Saldo en 600** / "¡Gracias por su preferencia!".

### 5.7 Consultorios
`h1` + "Estado de cuenta" (secundario) + "+ Nuevo". Buscador. Enlace subrayado "Ver archivados" 13.5 px `--muted`. Rejilla `auto-fill minmax(260px,1fr)`: tarjeta con borde izquierdo del color, avatar de 38 px (radio 12, fondo del color al 12 % — `#RRGGBB1f` — y letra del mismo color, 16 px/700), nombre 15.5 px/600, detalle "N doctores · teléfono" 12.5 px `--muted`, y la deuda a la derecha en mono 14 px/700 `--danger` (o "—" en `--muted` si no debe).

### 5.8 Nuevo / Editar consultorio
Máx. 560 px. Campos: Nombre (obligatorio), Contacto (opcional), Notas (`textarea`). Botón "Guardar" de 50 px.

### 5.9 Detalle de consultorio
Cabecera con avatar de 52 px (radio 16), `h1` 24 px, línea "teléfono · N trabajos"; dos cajas: "Deuda vigente" (19 px/700 mono `--danger`) y "Notas". Enlaces: Editar · Archivar · **Eliminar definitivo** (a la derecha, `--danger`; confirmación con el texto de 6.2).
**Doctores**: cada uno en fila con avatar de 36 px, nombre 15.5 px/600, contacto 12.5 px `--muted`, botón "+ Trabajo" (`--accentSoft`/`--accent`, 38 px) que abre el alta con ese doctor preseleccionado, y botón "Ver". Al final, caja punteada para agregar doctor: Nombre + Contacto + botón de ancho completo. Vacío: "Este consultorio aún no tiene doctores."

### 5.10 Detalle de doctor
Punto de color de 12 px + nombre 26 px/700; línea "N trabajos · S/ x por cobrar"; CTA "+ Nuevo trabajo para {doctor}" de 52 px; lista de sus trabajos en formato compacto (título, `consultorio · doctor`, precio).

### 5.11 Estado de cuenta
Cabecera con retorno, título 24 px, bajada "Deuda por consultorio y doctor" y botón "CSV". Tarjeta de total: "Total por cobrar" + cifra 34 px/700 mono `--danger` + "S/ x cobrado de S/ y facturado". Enlaces: "Ver todos los consultorios" y "Reportes por fecha →". Lista de consultorios con deuda **ordenada de mayor a menor**: nombre, `doctores · N trabajos`, monto 16 px/700 `--danger`.

### 5.12 Inventario
`h1` + "Liquidar stock" (secundario) + "+ Nuevo". Buscador + "Ver archivados". Rejilla `minmax(260px,1fr)`: nombre 15.5 px/600 + chip "Stock bajo" (`--dangerSoft`) o "En rango" (`--successSoft`) según `stock < mínimo`; abajo, costo por unidad 12.5 px mono `--muted` y stock 18 px/700 mono. Vacío: "Aún no hay insumos / Toca «+ Nuevo» para registrar el primero."

### 5.13 Nuevo / Editar insumo
Nombre; rejilla `minmax(140px,1fr)` con Unidad (`select`: unidad / g / ml / caja), Stock mínimo, Costo unitario (S/) y — solo al crear — Stock inicial. "Guardar".

### 5.14 Detalle de insumo
Cabecera con nombre 24 px y "costo / unidad · mínimo X". Bloque central de stock: fondo `--surface2`, radio 14, centrado, etiqueta 12.5 px + cifra **34 px/700 mono**. Enlaces Editar · Archivar · Eliminar definitivo.
**Registrar movimiento**: rejilla `minmax(150px,1fr)` con Tipo (Ingreso + / Salida − / Merma −), Cantidad, Fecha, Motivo, Origen (Compra / Ajuste / Consumo de trabajo) y Costo unitario; nota "El costo unitario actualiza el precio del producto (útil si varía por proveedor o marca)."; botón de ancho completo. Valida cantidad > 0.
**Historial**: filas con tipo + delta coloreado en mono, `fecha · motivo`, y enlace "Eliminar".

### 5.15 Liquidación de stock
Máx. 620 px. Explicación: "Ingresa el conteo físico real de cada insumo. La diferencia con el teórico se registra como merma (si falta) o ajuste (si sobra)." Por insumo: nombre 16 px/600 + "Teórico: X" en mono `--muted`; input de conteo (mono 16 px) + unidad + botón "Registrar".

### 5.16 Finanzas
`h1` + "Setiembre 2026 · mes actual" + botones "Reportes" (primario) y "CSV". Cuatro KPI (Ingresos, Gastos, Utilidad en `--success`, Margen en `--success`), cifras 22 px/700 mono. "Desglose de gastos": Materiales + merma, Pagos a trabajadores. **Gráfico "Ingresos vs gastos"**: leyenda con cuadros de 9 px (`#2F6FED` ingresos, `#d97706` gastos); 6 meses; contenedor de 170 px de alto, barras al 38 % del ancho de su columna, radio superior 6, etiqueta del mes en mono 11.5 px. "Top consultorios del mes": nombre + monto y barra de 7 px cuyo ancho es relativo al mayor, pintada con el color del consultorio.

### 5.17 Reportes
Título "Pendiente por cobrar" + rango en mono. Panel de filtros: conmutador "Solo por cobrar" / "Todos los trabajos" (el activo con fondo `--accent`); rejilla con Desde, Hasta, Consultorio y Doctor; botón "Ver reporte". Cuatro KPI: Trabajos con deuda, Monto final, Abonado, Por cobrar (`--danger`). Fila de exportación: "PDF A4" (primario), "Ticket 80 mm", "CSV" (90 px fijos). Resultados agrupados por consultorio: tarjeta con borde izquierdo de color, nombre 16 px/700 + total `--danger`, línea con doctores en `--accent` y "cobrado de facturado" en mono, y debajo cada trabajo como línea sangrada con `border-left: 2px` — `fecha · concepto` a la izquierda, importe `--danger` a la derecha.

### 5.18 Ticket de cobranza (80 mm)
Mismo tratamiento tipográfico que 5.6. Encabezado MasterLab / "Pendiente por cobrar" / rango; por consultorio: nombre + total en 600 y debajo doctor + monto en `--muted`; cierre con Trabajos, Monto final, Pagado y **Saldo por cobrar** en 600.

### 5.19 Configuración
Máx. 620 px. Cuatro tarjetas-enlace (radio 16, padding 16, chevron a la derecha, hover `border-color: --accent`), cada una con título 16 px/600 y descripción 13 px `--muted`:
- Catálogo de trabajos — "Tipos de trabajo, precios, etapas y recetas."
- Trabajadores — "Personal, montos estándar y pagos."
- Usuarios y permisos — "Accesos del equipo (admin / técnico)."
- Historial de actividad — "Quién creó, cambió o eliminó registros."

### 5.20 Catálogo de trabajos
Retorno + título + "+ Nuevo". Buscador. Agrupado por categoría con encabezado 11.5 px/700 mayúsculas `.08em` `--muted`. Cada ítem es una fila de `display: flex` con dos partes:
- Botón principal (`flex: 1`, radio 12, padding 12/14): nombre 14.5 px/500 a la izquierda; a la derecha el componente variable si existe ("+ S/ 20.00 / cofia", 11.5 px `--muted`) y el precio 14.5 px/700 mono.
- **Columna de reordenamiento** (6.4): dos botones apilados de 38×24 px, radio 8, borde `--border`, chevrones de 14 px; hover en `--accent`.
Con búsqueda activa las flechas se ocultan y aparece "Limpia la búsqueda para reordenar los trabajos."

### 5.21 Nuevo / Editar tipo de trabajo
Máx. 560 px. Categoría, Nombre del trabajo, Precio base (S/). `fieldset` "Componente variable (opcional)" con la nota "Para precios como «120 + 20 × cofia». Deja ambos vacíos si no aplica." y dos campos: Etiqueta y Precio unitario. "Guardar".

### 5.22 Detalle de tipo de trabajo
Cabecera: categoría en mayúsculas, nombre 24 px/700, precio 19 px/700 mono; enlaces Editar · Archivar · Eliminar definitivo.
**Etapas estándar**: nota "Al crear un trabajo se copian y podrás ajustarlas o excluir las que haga un proveedor externo."; lista ordenable (arrastrar) + input "Nueva etapa" y botón "Agregar".
**Receta (insumos)**: nota "Insumos y cantidades estándar que consume este trabajo. Se descuentan del stock al cerrarlo."; `select` de insumo + Cantidad + "Agregar".

### 5.23 Trabajadores / Detalle / Nuevo
Lista: nombre 15.5 px/600, "N montos estándar" 12.5 px `--muted`, total pagado en mono a la derecha. Detalle: cabecera con nombre 24 px y "Total pagado: S/ x"; bloque **Montos estándar** (tipo de trabajo + monto + Guardar, con la nota "Monto que se le paga por tipo de trabajo. Podrás seleccionarlo al registrar un pago.") y bloque **Registrar pago** (monto, fecha, nota, botón; "Sin pagos aún." si está vacío). Alta: solo Nombre + Guardar.

### 5.24 Usuarios y permisos
Introducción: "El técnico parte sin reportes ni inventario; abajo le habilitas lo que necesite. Los costos de insumos y el panel de Finanzas quedan siempre solo para administradores."
Tarjeta por usuario: nombre 16 px/700 + correo 13 px `--muted`; `select` de rol (Técnico / Admin) + enlace "Guardar". Debajo, separador y bloque **Permisos**: cada permiso es un botón de ancho completo con casilla de 22 px (radio 7; marcada = fondo y borde `--accent` con check blanco de 13 px), nombre 14.5 px/600 y descripción 12.5 px/1.45 `--muted`. Los cuatro permisos, con su texto exacto:
| Permiso | Descripción |
|---|---|
| Ver reportes | Reportes por consultorio y doctor, sin importes en soles. |
| Reportes con importes | Los reportes que emita incluyen montos y deuda. Incluye ver reportes. |
| Ver inventario | Consultar stock de insumos (sin costos). |
| Registrar movimientos | Entradas, salidas y mermas. Incluye ver inventario. |
Reglas: "Reportes con importes" implica "Ver reportes"; "Registrar movimientos" implica "Ver inventario" (marcar el hijo marca el padre; desmarcar el padre desmarca el hijo).
La tarjeta del propio administrador no es editable y muestra: "Como administrador tiene acceso completo: finanzas, inventario, reportes y configuración."
**Nuevo usuario**: Nombre, correo, contraseña temporal (mínimo 6), rol ("Técnico (registra trabajos)" / "Admin (acceso completo)"), botón "Crear usuario".

### 5.25 Historial de actividad
"Quién creó, actualizó o eliminó registros (últimos 150)." Filas: "{Usuario} {acción}" (acción en peso 400 `--muted`), objeto en 12.5 px `--muted`, y la fecha a la derecha en mono 12.5 px.

## 6. Interacciones y comportamiento

### 6.1 Hoja de selección de tipo de trabajo
Overlay `rgba(10,13,18,.5)` a pantalla completa; panel anclado abajo, ancho máx. 560 px, alto máx. 82vh, radio superior 22, sombra `--pop`, animación `sheetIn` (`opacity 0→1`, `translateY(20px)→0`, 220 ms `ease-out`). Cabecera fija: título "Tipo de trabajo" + botón de cierre de 36 px; buscador con borde `--accent` y `autofocus`. Cuerpo con scroll: encabezado de categoría (11.5 px/700 mayúsculas) y opciones (nombre a la izquierda, precio en mono `--muted` a la derecha, hover `--accentSoft`). Al elegir: se asigna el tipo a la línea y se cierra.

### 6.2 Confirmaciones destructivas
Mismo patrón de hoja inferior (máx. 420 px, radio 20): título 19 px/700, texto 14 px/1.5 `--muted`, y dos botones al 50 %: "Cancelar" (secundario) y el destructivo en `--danger` con texto blanco. Textos exactos:
- Trabajo → "Eliminar trabajo" / "Se borra el trabajo, sus etapas y sus abonos. No se puede deshacer." / "Sí, eliminar".
- Consultorio → "Eliminar definitivo" / "Se borra {nombre}, sus doctores y su historial. ¿Prefieres archivar?" / "Sí, eliminar".
- Insumo → "Eliminar definitivo" / "Esto borra «{nombre}» y todo su historial de movimientos. No se puede deshacer." / "Sí, eliminar".

### 6.3 Avisos (toast)
Píldora centrada a 84 px del fondo, fondo `--text` y texto `--bg`, 14 px/500, radio 999, sombra `--pop`, animación `pop` (150 ms) y autocierre a los **2200 ms**. Se usa en: guardar, crear, cerrar trabajo ("Trabajo cerrado · insumos descontados"), marcar entregado, registrar abono / movimiento / pago / conteo, archivar, eliminar, exportar (CSV, PDF, impresión), reordenar catálogo ("Orden actualizado") y errores de validación ("Ingresa un monto", "Ingresa una cantidad").

### 6.4 Reordenar el catálogo (comportamiento existente a conservar)
Flechas ↑ / ↓ por ítem, dentro de su categoría. La primera posición desactiva ↑ y la última ↓ — se indican con `opacity: .3` (no se ocultan, para que la fila no cambie de tamaño). Cada movimiento persiste el nuevo orden y muestra "Orden actualizado". El orden guardado es el que se usa en el catálogo y en la hoja de selección de tipo de trabajo. Con el buscador activo el reordenamiento se deshabilita.

### 6.5 Responsive
Punto de corte único en **980 px**: por debajo, header de 56 px + barra inferior de 62 px (con `env(safe-area-inset-bottom)`); por encima, barra lateral de 236 px pegada (`position: sticky; height: 100vh`) y sin barra inferior. El contenido nunca supera 880 px. Todas las rejillas usan `auto-fit`/`auto-fill` con `minmax`, y ninguna caja de texto lleva alto fijo ni `nowrap` (salvo chips y precios, que sí lo llevan a propósito).

### 6.6 Tema
Conmutador en el header móvil y en el pie de la barra lateral; escribe `data-theme="dark"` en `<html>` y persiste en `localStorage` (clave `gl-theme`). Toda la paleta está en variables CSS: no hay colores fijos en los componentes salvo los de consultorio y los del gráfico.

### 6.7 Objetivos táctiles
Ningún control interactivo baja de 44 px de alto en móvil, salvo las flechas de reordenar (38×24 px, apiladas y con separación de 3 px, en pantalla de escritorio/configuración) y los botones de icono del header (40 px).

## 7. Estado necesario

| Estado | Uso |
|---|---|
| `screen` | Pantalla activa; se persiste en `localStorage` (`gl-screen`) para volver donde estabas. En producción lo reemplaza el enrutador del App Router. |
| `theme` | `light` / `dark`, persistido. |
| `q`, `consQ`, `invQ`, `catQ`, `pickerQ` | Texto de cada buscador. |
| `filtro` | Filtro de estado de la lista de trabajos. |
| `lineas[]` | Líneas del alta: `{ tipoId, cant, pieza }`. |
| `manual`, `montoManual` | Monto manual que sustituye al total calculado. |
| `paciente`, `entrega`, `notas`, `doctorSel` | Campos del alta. |
| `pickerFor` | Índice de la línea que abrió la hoja de tipos (`null` = cerrada). |
| `etapas[]` | `{ nombre, estado }` con estado en `pendiente / en_progreso / completada / excluida`. |
| `abonos[]` | `{ monto, metodo, fecha, nota }`. |
| `stock`, `movTipo`, `movCant`, `conteo` | Inventario y liquidación. |
| `repIncluir`, `repDesde`, `repHasta` | Filtros de reportes. |
| `permisos` | Cuatro banderas booleanas (5.24). |
| `confirm`, `toast` | Diálogo destructivo y aviso activos. |

Reglas de cálculo: subtotal de línea = `precio del tipo × cantidad`; total = suma de subtotales (o el monto manual si está activo); saldo = `precio − pagado`; progreso de etapas = completadas ÷ aplicables (excluye las "excluidas"); "stock bajo" = `stock < mínimo`.

## 8. Datos y catálogo

El prototipo usa los datos reales del sistema: 11 consultorios con sus colores, 16 trabajos de ejemplo y el catálogo completo (29 tipos en 5 categorías: Aparato ortodoncia – ortopedia, Prótesis fija, Prótesis parcial removible, Prótesis total, Reparación) con sus precios. Sirven de caso de prueba; en producción vienen del backend.

## 9. Tokens de diseño

**Tipografía** — Geist (interfaz) y Geist Mono (todo importe, cantidad, fecha corta y dato numérico), pesos 400/500/600/700. Escala: 38/34/30/28/26/24/22/20/19/17/16/15.5/15/14.5/13.5/13/12.5/11.5 px. Títulos con `letter-spacing` de −0.02 a −0.03em; sobretítulos en mayúsculas con +0.05 a +0.08em. Interlineado 1.2 en títulos, 1.4–1.55 en texto. `text-wrap: pretty` global y `balance` en títulos de tarjeta.

**Color, tema claro**
| Token | Valor |
|---|---|
| `--bg` | `#F6F7F9` |
| `--surface` | `#FFFFFF` |
| `--surface2` | `#FBFCFD` |
| `--text` | `#14181F` |
| `--muted` | `#626B7A` |
| `--border` | `#E5E8EE` |
| `--accent` | `#2F6FED` |
| `--accentSoft` | `#EAF1FE` |
| `--accentInk` | `#1B4FBF` |
| `--accentOn` | `#FFFFFF` |
| `--accentGlow` | `rgba(47,111,237,.28)` |
| `--danger` / `--dangerSoft` | `#DC2A2A` / `#FDECEC` |
| `--success` / `--successSoft` | `#12855F` / `#E7F6EF` |
| `--warn` / `--warnSoft` | `#B45309` / `#FEF3E2` |

**Color, tema oscuro**
| Token | Valor |
|---|---|
| `--bg` | `#0F1216` |
| `--surface` | `#171B21` |
| `--surface2` | `#1D222A` |
| `--text` | `#F2F4F7` |
| `--muted` | `#9AA4B2` |
| `--border` | `#2A303A` |
| `--accent` | `#7EA6FF` |
| `--accentSoft` | `#1D2942` |
| `--accentInk` | `#BBD0FF` |
| `--accentOn` | `#0E141C` |
| `--accentGlow` | `rgba(126,166,255,.22)` |
| `--danger` / `--dangerSoft` | `#FF7A7A` / `#3A2020` |
| `--success` / `--successSoft` | `#4ED8A5` / `#12301F` |
| `--warn` / `--warnSoft` | `#F5B461` / `#332413` |

`--accentOn` es el color del texto sobre `--accent`: blanco en claro y tinta oscura en oscuro. **Nunca usar `#fff` fijo sobre el acento** — en modo oscuro no contrasta.

**Colores de consultorio** (identidad por cliente, iguales en ambos temas): `#db2777`, `#0891b2`, `#2563eb`, `#7c3aed`, `#d97706`, `#dc2626`, `#ca8a04`. Se usan en el borde izquierdo de 4 px, en puntos de 8 px, en avatares (fondo del mismo color al 12 %: `#RRGGBB1f`) y en las barras del top de finanzas.

**Espaciado** — 2 / 3 / 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 22 / 24 / 28 / 48 px. Gap por defecto entre secciones 16, entre tarjetas de lista 9, dentro de tarjeta 10–14.

**Radios** — 7 (casilla) · 8 (píldora pequeña) · 10–12 (botones, inputs) · 14 (tarjeta de lista) · 16 (tarjeta de sección) · 18–22 (tarjeta destacada, hoja) · 999 (chips y avatares circulares).

**Sombras** — `--shadow`: `0 1px 2px rgba(20,24,31,.05), 0 1px 3px rgba(20,24,31,.05)` (oscuro: `0 1px 2px rgba(0,0,0,.45)`). `--pop`: `0 14px 40px rgba(20,24,31,.18)` (oscuro: `0 14px 40px rgba(0,0,0,.55)`). CTA principal: `0 6px 18px var(--accentGlow)`.

**Movimiento** — hover de tarjeta `translateY(-1px)` en 120 ms; `active` de botón `scale(.99)`; barra de progreso `width .3s`; entrada de hoja 220 ms `ease-out`; toast 200 ms.

**Alturas de control** — input/select 44–48 · botón secundario 42–46 · CTA 50–56 · botón de icono 40 · fila de nav inferior 62 · header 56.

## 10. Activos

No hay imágenes. Todos los iconos son SVG en línea con `stroke: currentColor`, `stroke-width` 1.7–2.4 y extremos redondeados, tomados del estilo ya presente en `components/nav/icons.tsx`. El logotipo es el diente actual del repo. Sustituirlos por la librería de iconos que ya use el proyecto si existe.

## 11. Marca

**Pendiente de decisión.** No se encontraron activos de marca "Skardiam" en el repositorio, así que el rediseño mantiene el nombre GestionLab y los tokens actuales del código (azul `#2F6FED`, Geist). Si se adopta la identidad Skardiam, los cambios se concentran en: `--accent` y sus derivados (`--accentSoft`, `--accentInk`, `--accentGlow`), la familia tipográfica, y el logotipo. El resto de la paleta es neutra y funcional, y no debería cambiar.

## 12. Archivos de este paquete

- `GestionLab Rediseño.dc.html` — prototipo completo (todas las pantallas, navegación e interacciones descritas arriba).
- `support.js` — runtime necesario para abrir el prototipo. No tiene relación con el código de producción.
