# Cumplimiento de protección de datos — GestionLab

**Estos documentos son borradores para que los revise un abogado.** No los firmes
ni los publiques sin esa revisión: fijan obligaciones tuyas frente a tus
clientes y frente a la autoridad, y un error aquí se paga en multas, no en un
error de compilación.

Marco vigente, verificado el 2026-09-10:

- **Ley N° 29733**, Ley de Protección de Datos Personales, modificada por el
  **Decreto Legislativo N° 1621**.
- **Reglamento: Decreto Supremo N° 016-2024-JUS**, publicado el 30 de noviembre
  de 2024 y **en vigor desde el 30 de marzo de 2025**. Derogó el reglamento de
  2013 (DS 003-2013-JUS), así que cualquier plantilla o guía anterior a marzo de
  2025 está desactualizada.
- Autoridad: **Autoridad Nacional de Protección de Datos Personales (ANPD)**,
  del Ministerio de Justicia y Derechos Humanos.

## Quién es qué, y por qué importa

Esta es la decisión de la que cuelga todo lo demás:

| | |
|---|---|
| **Cada laboratorio** | Es el **responsable del tratamiento** de los datos de sus pacientes. Él decide qué registra y para qué. |
| **Tú (Skardiam / GestionLab)** | Eres el **encargado del tratamiento**: tratas esos datos por cuenta del laboratorio, siguiendo sus instrucciones, sin poder usarlos para nada propio. |
| **Tú, además** | Eres **responsable** de tus propios datos: los de contacto y facturación del laboratorio, y las cuentas de usuario. |

Ser encargado y no responsable te quita decisiones y te añade obligaciones
concretas: no puedes usar los datos de los pacientes para nada tuyo, tienes que
poder demostrar qué haces con ellos, y necesitas un contrato firmado con cada
laboratorio. **Ese contrato dejó de ser opcional el día que el panel de
plataforma pudo entrar a ver y corregir datos de un laboratorio ajeno.**

## Los cuatro documentos

| Documento | Para qué | A quién se le entrega |
|---|---|---|
| [politica-de-privacidad.md](politica-de-privacidad.md) | Informar qué datos tratas y cómo | Público, en el sitio y en la app |
| [terminos-del-servicio.md](terminos-del-servicio.md) | El contrato del servicio: precio, suspensión, disponibilidad, fin del contrato | Cada laboratorio, al contratar |
| [contrato-de-encargo-de-tratamiento.md](contrato-de-encargo-de-tratamiento.md) | Tu obligación como encargado. Anexo de los términos | Cada laboratorio, **firmado** |
| Este archivo | Lo que hay que hacer ante la ANPD | Uso interno |

Los 14 huecos que quedan entre corchetes son la identidad de la empresa —razón
social, RUC, domicilio fiscal, correo de contacto y fechas—, más los datos del
laboratorio en el contrato de encargo. Precios y plazos ya están puestos.

## Planes y precios (decidido el 2026-09-10)

| Plan | Mensual | Anual | Usuarios |
|---|---|---|---|
| Hasta 5 usuarios | S/ 250 | S/ 2,500 | 5 |
| Usuarios ilimitados | S/ 350 | S/ 3,500 | sin límite |

El anual equivale a diez meses. **Primer mes sin costo** y **carga inicial del
catálogo incluida**: son las dos cosas que quitan las objeciones reales, y
ninguna cuesta dinero.

Por qué estos números, para cuando haya que revisarlos:

- **Referencia de mercado:** Fabrikdent cobra 70–95 USD al mes (S/260–355), así
  que S/250 queda justo por debajo del más barato.
- **Referencia del cliente:** MasterLab facturó S/9,650 en septiembre de 2026 con
  47 trabajos y un ticket medio de S/205. S/250 es el 2,6% de eso, o poco más
  que un trabajo suyo al mes. Ese es el argumento de venta.
- **Costo:** la infraestructura es un **costo fijo** de unos S/170 al mes
  (Supabase Pro y Vercel Pro), sirva a uno o a veinte laboratorios. Culqi se
  queda 3,44%. El costo marginal de cada laboratorio nuevo es de unos S/10, así
  que la palanca del negocio es **sumar clientes, no subir el precio**.
- **«Usuarios ilimitados» es seguro:** Supabase Pro incluye 100,000 usuarios
  activos al mes. Lo que sí crece con el uso es el tráfico de datos —250 GB
  incluidos— y lo dispara el **historial acumulado de cada laboratorio**, no la
  cantidad de personas. Cuando un laboratorio pase de unos dos mil trabajos habrá
  que paginar las consultas en vez de traer la lista completa y filtrar en
  memoria, que es como está hecho hoy.

### Cómo facturar: boleta de venta, no recibo por honorarios

Situación según la ficha RUC del 2026-09-10: **persona natural con negocio**,
RUC 15612020377, nombre comercial **Skardiam Systems**, actividad principal
**6201 – Programación informática**. Afecto a **Nuevo RUS** y a **renta de 4ta
categoría**. Comprobantes habilitados: **boleta de venta** (desde 01/2024) y
**recibo por honorarios** (desde 08/2025). **No factura.**

**Cobrar la suscripción con boleta de venta, no con recibo por honorarios.** Tres
razones:

1. Vender el uso de un sistema es una operación del negocio, no el ejercicio
   independiente de una profesión. La boleta es el comprobante que le
   corresponde.
2. **Evita la retención del 8%.** Esa retención solo aplica a los recibos por
   honorarios. Con boleta, el laboratorio paga el importe completo, y desaparece
   el problema del plan anual: se cobran los S/2,500, no S/2,300.
3. **La cuota del Nuevo RUS es fija y mínima:** S/20 al mes hasta S/5,000 de
   ingresos mensuales (categoría 1), S/50 hasta S/8,000 (categoría 2). Con veinte
   laboratorios a S/250 todavía se está en categoría 1.

La cláusula de retención de los términos se queda igualmente: no estorba, y
cubre el caso de que alguna vez se emita un recibo por honorarios por un trabajo
de desarrollo a medida.

#### Dos cosas que hay que preguntarle al contador

**La primera es la importante, y conviene no dejarla pasar.** El Nuevo RUS está
pensado para «personas naturales **no profesionales**», y hay fuentes que ubican
los **servicios de informática —programación y consultoría informática—** entre
las actividades **excluidas** del régimen. La página de SUNAT sobre actividades
no comprendidas no las nombra de forma expresa, así que **no está resuelto**, y
en la ficha RUC la profesión figura como «no especificada», lo que juega a
favor.

Importa porque si SUNAT considera que la actividad está excluida, la
reclasificación es **retroactiva**, y la situación existe desde enero de 2024, no
desde ahora. Es una pregunta de media hora con un contador y no debería
postergarse.

**La segunda es comercial.** Con boleta de venta el laboratorio **no obtiene
crédito fiscal** y su deducción del gasto es limitada. Un laboratorio formal
puede exigir factura, y el Nuevo RUS no permite emitirla: haría falta pasar a
**RER** o **MYPE Tributario**. Eso tiene una ventaja añadida —permite **deducir
los costos reales**: Supabase, Vercel, Culqi— y un costo: contabilidad más
exigente y pagos que dejan de ser una cuota fija.

Los términos ya lo dicen: quien necesite factura debe avisarlo antes de
contratar.

### MasterLab: cliente fundador, sin costo

MasterLab **no paga**, de forma indefinida, a cambio de poner el sistema a
prueba y dar retroalimentación. Conviene tenerlo escrito para que no se
convierta en un sobreentendido incómodo dentro de un año.

**Que no pague no cambia nada de lo legal:** tratan datos de salud de pacientes
reales, así que el contrato de encargo hay que firmarlo con ellos igual, y la
política de privacidad les aplica desde el primer día.

## Qué hay que hacer ante la ANPD

### 1. Inscribir los bancos de datos personales

Sigue siendo obligatorio con el reglamento nuevo. **No inscribirlos es
infracción grave: de 5 a 50 UIT.**

Se hace en el Registro Nacional de Protección de Datos Personales, en la
plataforma de la ANPD. Por lo que el sistema guarda hoy, son tres bancos:

- **Clientes y facturación** — datos de contacto de cada laboratorio. Tú eres
  el responsable.
- **Usuarios del sistema** — nombre y correo de quienes entran. Tú eres el
  responsable.
- **Pacientes y trabajos de laboratorio** — aquí están los **datos de salud**,
  que son datos sensibles y la categoría más protegida de la ley. El
  responsable es **cada laboratorio**, no tú; tú declaras tu condición de
  encargado.

Ese último punto conviene confirmarlo con el abogado: quién inscribe el banco de
pacientes —cada laboratorio por su cuenta, o tú declarando el encargo— cambia
según cómo se interprete tu rol, y equivocarse deja a alguien sin inscribir.

### 2. Resolver si necesitas un Oficial de Protección de Datos

Es obligatorio desde el **30 de noviembre de 2025** para empresas medianas y
grandes, y para quienes **tratan datos sensibles a gran escala**. Los criterios
exactos están en la **Resolución Directoral N° 100-JUS-DGTAIPD** (diciembre de
2025). No designarlo cuando corresponde: de 0.5 a 5 UIT.

Con un laboratorio y unos cientos de pacientes probablemente no califiques como
«gran escala», pero **la respuesta depende de un umbral publicado, no de una
impresión**. Que el abogado lo mire contra esa resolución, y vuelve a mirarlo
cuando tengas varios laboratorios: el tratamiento crece con los clientes.

### 3. Montar el procedimiento de notificación de brechas

El reglamento nuevo obliga a notificar a la ANPD **dentro de 48 horas** de
detectar el incidente. La notificación debe incluir la naturaleza del incidente,
qué categorías de datos y cuántos titulares se vieron afectados, el contacto
responsable, las consecuencias probables y qué se hizo para contenerlo.

No notificar, o notificar tarde, es una infracción **añadida** a la de la brecha
misma.

Esto no es un documento: es un procedimiento que tiene que existir antes de
hacer falta. Lo mínimo:

- Quién decide que algo es una brecha, y su teléfono.
- Dónde se mira para saber a quién afectó. En GestionLab: la tabla `auditoria`
  y los registros del servidor.
- Un borrador de la notificación ya escrito, con los huecos por rellenar.
- Avisar también a los laboratorios afectados: eres su encargado, y el
  responsable de notificar a sus pacientes es **él**, no tú, pero no puede
  hacerlo si tú no le cuentas.

### 4. Atender los derechos de los titulares

Un paciente puede pedir acceso, rectificación, cancelación u oposición sobre sus
datos. **Esas peticiones se las hace a su laboratorio, no a ti** — él es el
responsable. Tú tienes que poder ayudarlo a cumplirlas, y el contrato de encargo
lo dice.

Hoy el sistema permite buscar y corregir un paciente desde la app del
laboratorio, así que acceso y rectificación están cubiertos. **Cancelación no
del todo**: borrar un trabajo se puede, pero no hay una función de «borra todo
lo de este paciente» ni un registro de que se hizo. Si algún laboratorio recibe
esa petición, avísame y lo construimos.

## Lo que hay que arreglar en el sistema, no en un documento

Estas tres salen de cómo está construido GestionLab hoy y son afirmaciones que
los documentos van a hacer. Conviene que sean ciertas antes de firmar:

1. **Los datos de salud están en Estados Unidos.** El proyecto de Supabase está
   en la región `us-east-2` (Ohio). Eso es un flujo transfronterizo de datos
   sensibles, y hay que declararlo e informarlo — está en la política de
   privacidad y en el contrato. La alternativa es mover la base a un proveedor
   en Perú o a una región con garantías, que es trabajo de infraestructura, no
   de redacción.

2. ~~El laboratorio no puede consultar el historial de tus accesos.~~
   **Resuelto el 2026-09-10.** La pantalla ya existía —Configuración → Historial
   de actividad— pero no leía las columnas de atribución de plataforma, así que
   un cambio tuyo aparecía como «Sistema». Ahora se muestra como «Soporte» con
   tu correo y el detalle de lo que cambiaste. La cláusula de verificación del
   contrato ya promete algo que el cliente puede comprobar por su cuenta.

3. **Vercel está en plan Hobby, que prohíbe el uso comercial.** No es materia de
   protección de datos, pero es el riesgo más inmediato de todos: cobrar con el
   sistema alojado ahí es motivo para que lo suspendan, sin aviso y con el
   cliente adentro.
