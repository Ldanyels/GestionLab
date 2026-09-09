# Acceso de plataforma a un laboratorio — Diseño

**Fecha:** 2026-09-09
**Sub-proyecto 1 de 4:** cimiento y lectura.

## El problema

Quien opera la plataforma necesita entrar a cualquier laboratorio para darle
soporte —ver qué pasó, corregir un error que el cliente no sabe deshacer— sin
figurar como usuario de ninguno, ni siquiera de MasterLab.

Hoy eso es imposible por construcción. `laboratorio_actual()` es literalmente:

```sql
select laboratorio_id from perfil where id = auth.uid()
```

Sin perfil devuelve NULL, y todas las políticas RLS comparan `= laboratorio_actual()`,
así que una cuenta sin laboratorio no ve absolutamente nada. «No pertenecer a
ningún laboratorio» y «poder entrar a todos» son, tal como está el sistema, lo
contrario.

## Decisiones ya tomadas

Estas vienen de la conversación de diseño y el resto del documento las asume:

1. **Alcance:** ver todo y poder corregir cosas concretas, no operar a diario.
   Las correcciones abarcan cuatro dominios —usuarios y contraseñas, datos de un
   trabajo, abonos, catálogo— repartidos en los sub-proyectos 2 a 4.
2. **Sin nombres de pacientes.** Las pantallas de plataforma identifican un
   trabajo por tipo, doctor, fecha y monto. Es suficiente para encontrarlo y
   corregirlo, y deja al operador fuera del tratamiento de datos de salud, la
   categoría más protegida de la Ley 29733.
3. **No se toca ninguna política RLS.** El poder viene de la clave de servicio
   en el servidor, como ya ocurre en el panel de laboratorios.

### Por qué no se suplanta al inquilino

La alternativa evidente era dar a `laboratorio_actual()` una segunda vía que
reconociera al super-administrador, y reutilizar toda la aplicación ya
construida. Se descarta por tres razones:

- El aislamiento pasaría a ser **condicional**. Hoy un fallo en las políticas
  filtra datos; con una vía de suplantación, un fallo permite **escribir en el
  laboratorio equivocado**.
- La base no puede verificar quién administra la plataforma: eso vive en la
  variable de entorno `SUPERADMIN_EMAILS`, deliberadamente fuera de la base
  (ver `lib/plataforma/acceso.ts`). Habría que mover ese privilegio a un dato, y
  un dato se puede otorgar por error —es exactamente la clase de fallo que cerró
  la migración 0018—.
- Se verían los nombres de pacientes, contra la decisión 2.

## Los dos problemas que este sub-proyecto resuelve

### Problema A: la auditoría no sabría quién es el operador

`registrar_auditoria()` (migración 0010) escribe:

```sql
insert into auditoria(..., usuario_id, usuario_nombre)
values (..., auth.uid(), (select nombre from perfil where id = auth.uid()))
```

Con la clave de servicio, `auth.uid()` es NULL y no hay perfil que consultar.
**Todo cambio hecho desde el panel quedaría registrado como si no lo hubiera
hecho nadie**, que es justo lo contrario del requisito.

Es un problema del cimiento, no de las pantallas: hay que resolverlo antes de
que exista la primera corrección, o el sub-proyecto 2 nacerá sin rastro.

Pero además hace falta ya, aunque este sub-proyecto no escriba nada, porque hay
algo que sí debe quedar registrado desde el primer día: **los accesos**. Un
laboratorio que acepta que su proveedor pueda ver sus datos necesita poder
comprobar cuándo los vio. Sin eso, «puedo entrar a tu laboratorio» es una
promesa sin contrapeso.

**Solución:** una columna nueva `auditoria.actor_plataforma text`, nula por
defecto, y una acción nueva `'ACCESO'` en la restricción de `accion`. Cada vez
que el panel abre la ficha de un laboratorio ajeno se escribe una fila de
acceso con el correo del operador. Cuando lleguen las escrituras
(sub-proyectos 2 a 4), el mismo envoltorio marcará con ese correo las filas que
el disparador genere.

Se añade una columna en vez de reutilizar `usuario_nombre` porque son cosas
distintas y confundirlas sería mentir: `usuario_nombre` responde «qué usuario
del laboratorio hizo esto» y aquí la respuesta correcta es «ninguno». Un
laboratorio que revise su historial debe poder distinguir un cambio suyo de uno
del proveedor.

**Alternativa descartada:** hacer que el disparador lea una variable de sesión
de PostgreSQL. PostgREST no permite fijar variables de sesión arbitrarias por
petición, así que exigiría conexión directa a la base, que la aplicación no
tiene.

### Problema B: sin RLS, el acotado es responsabilidad del código

Las consultas del panel usan la clave de servicio, que ignora RLS por
definición. Olvidar un `.eq('laboratorio_id', …)` en una sola consulta expone o
modifica el laboratorio equivocado, y ninguna política lo impedirá.

**Solución:** ninguna pantalla del panel usa `createAdminSupabase()`
directamente. Todas pasan por `clienteDeLaboratorio(laboratorioId)`, que
devuelve un objeto con las operaciones ya acotadas. El acotado se escribe una
vez, en un archivo pequeño y probado, en vez de repetirse en cada consulta.

Esto no es una barrera criptográfica: quien escriba código nuevo puede saltársela
importando el cliente crudo. Es una barrera de diseño —el camino fácil es el
correcto— reforzada con pruebas que verifican que las consultas acotadas no
devuelven filas de otro laboratorio.

## Qué se construye

### `lib/plataforma/cliente.ts`

```ts
export interface ClienteDeLaboratorio {
  readonly laboratorioId: string
  /** SELECT ya acotado a este laboratorio. */
  leer(tabla: string, columnas: string): PostgrestFilterBuilder<never, never, unknown[]>
}

export function clienteDeLaboratorio(laboratorioId: string): ClienteDeLaboratorio
```

`leer` aplica `.eq('laboratorio_id', laboratorioId)` antes de devolver el
constructor de consulta, de modo que quien lo use pueda seguir encadenando
filtros sin poder quitar el acotado.

La escritura acotada no se define todavía: no tiene ningún uso en este
sub-proyecto, y una función sin llamador es una decisión tomada antes de tiempo.
Llega en el sub-proyecto 2, sobre esta misma pieza.

### `lib/plataforma/auditoria.ts`

```ts
/** Deja constancia de que el operador de la plataforma abrió este laboratorio. */
export async function registrarAccesoDePlataforma(
  laboratorioId: string,
  correo: string,
): Promise<void>
```

Escribe una fila con `accion = 'ACCESO'`, `tabla = 'laboratorio'`,
`registro_id` = el laboratorio, `usuario_id` y `usuario_nombre` en NULL —porque
no lo hizo ningún usuario del laboratorio— y `actor_plataforma` = el correo.

**Nunca interrumpe la navegación.** Si la escritura falla, se registra el fallo
en el servidor y la ficha se muestra igual: dejar a un operador sin poder
atender a un cliente porque no se pudo apuntar la visita sería un mal cambio.
El registro es una obligación de la plataforma, no una condición del servicio.

### `lib/plataforma/laboratorio-detalle.ts`

Lectura de un laboratorio para el panel:

```ts
export interface ResumenDeLaboratorio {
  laboratorio: LaboratorioFila
  trabajos: number
  consultorios: number
  doctores: number
  usuarios: number
  porCobrar: number
  ultimoMovimiento: string | null
}
export async function resumenDeLaboratorio(id: string): Promise<ResumenDeLaboratorio | null>

/** Trabajos del laboratorio, SIN nombre de paciente. */
export interface TrabajoDePlataforma {
  id: string
  tipo_nombre: string
  doctor_nombre: string
  consultorio_nombre: string
  fecha_ingreso: string
  entregado_el: string | null
  estado: EstadoTrabajo
  precio_acordado: number
  saldo: number
}
export async function trabajosDeLaboratorio(id: string): Promise<TrabajoDePlataforma[]>
```

`paciente_nombre` no aparece en el tipo ni en el `select`. No se trae y se
oculta: no se trae. Un campo que no viaja no se filtra por accidente en un
registro de errores ni en una respuesta.

### `app/(plataforma)/plataforma/[id]/page.tsx`

La ficha del laboratorio: su nombre y estado, las cifras del resumen, y la
lista de sus trabajos. Enlazada desde cada fila de `/plataforma`.

## Qué NO entra en este sub-proyecto

- Cualquier escritura sobre datos del laboratorio (sub-proyectos 2 a 4).
- Ver o exportar reportes del laboratorio.
- **Una pantalla donde el laboratorio vea esos accesos.** La política RLS de
  `auditoria` ya permite a cada laboratorio leer sus propias filas, así que el
  dato le pertenece y le llega; lo que falta es dónde mirarlo. Hasta que exista,
  la transparencia es real en la base pero no está a la vista, y conviene no
  presentarla al cliente como una función terminada.

## Pruebas

- `clienteDeLaboratorio` acota: una consulta a través de él sobre una base con
  dos laboratorios sembrados devuelve solo las filas del suyo.
- `trabajosDeLaboratorio` no incluye `paciente_nombre` en ninguna fila
  devuelta, ni siquiera como `undefined`.
- `registrarAccesoDePlataforma` escribe una fila con `accion = 'ACCESO'` y el
  correo del operador en `actor_plataforma`, dejando en NULL los campos de
  usuario del laboratorio.
- Abrir la ficha de un laboratorio deja esa fila; abrirla dos veces deja dos.
- Si el registro del acceso falla, la ficha se muestra igual.
- La ficha del laboratorio pinta las cifras y la lista, y muestra el estado
  suspendido cuando corresponde.
- **Criterio de aceptación del sub-proyecto:** `CONFIRMO=si pnpm test:aislamiento`
  sigue pasando **sin modificar el script**. Si este trabajo debilitara el
  aislamiento del inquilino, esa suite es la que debe ponerse roja.

## Migración

`supabase/migrations/0020_auditoria_actor_plataforma.sql`

```sql
alter table auditoria add column if not exists actor_plataforma text;

comment on column auditoria.actor_plataforma is
  'Correo del operador de la plataforma que provocó el registro. NULL cuando lo hizo un usuario del propio laboratorio.';

-- 'ACCESO' no es un cambio de datos, y por eso no lo contemplaba la
-- restricción original: registra que alguien de la plataforma abrió la ficha
-- del laboratorio. Se recrea la restricción porque no admite ampliarse.
alter table auditoria drop constraint if exists auditoria_accion_check;
alter table auditoria add constraint auditoria_accion_check
  check (accion in ('INSERT','UPDATE','DELETE','ACCESO'));
```

Aditiva e idempotente. No toca datos existentes ni ninguna política.

El nombre de la restricción está **verificado contra la base de producción**
(2026-09-09): al intentar insertar una fila con `accion = 'ACCESO'`, PostgreSQL
responde `23514: new row for relation "auditoria" violates check constraint
"auditoria_accion_check"`. Eso confirma las dos cosas que la migración necesita:
que ese es el nombre a recrear, y que hoy la acción se rechaza.

## Riesgo aceptado

Un operador de plataforma con la clave de servicio puede, por definición, leer
cualquier dato de cualquier laboratorio: la clave existe en el servidor y no hay
forma de limitarla desde la aplicación. Lo que este diseño controla es que **el
camino normal** —las pantallas del panel— no exponga datos de salud y deje
rastro de cada cambio. No pretende proteger contra quien escriba código nuevo
con malas intenciones y acceso al repositorio.
