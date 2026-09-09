# Recuperación de contraseña y alta de laboratorios — Diseño

**Fecha:** 2026-09-09
**Autor:** dbenitez@p1s.pe
**Estado:** Diseño aprobado; pendiente de revisión del spec escrito

---

## 1. Por qué

Dos huecos bloquean la operación y la venta:

**No hay forma de recuperar una contraseña.** El login dice *"Pídele al
administrador que la restablezca"* y resulta que **tampoco existe esa pantalla
de administrador**: `app/(app)/configuracion/usuarios/actions.ts` tiene crear,
cambiar rol, guardar permisos y eliminar, pero nada de restablecer. MasterLab
ya tiene cuatro usuarios reales; la primera contraseña olvidada es un problema
sin salida.

**Dar de alta un laboratorio son tres pasos manuales de SQL.** Están
documentados en `docs/supabase-setup.md` (pasos 3 a 5): insertar en
`laboratorio`, crear el usuario en el panel de Supabase y insertar el `perfil`
copiando el UID a mano. No se puede vender así.

## 2. Alcance

Dos subproyectos independientes. El correo es prerrequisito de la recuperación,
así que van en este orden.

| # | Subproyecto | Entrega |
|---|---|---|
| 1 | Correo transaccional y recuperación de contraseña | Autoservicio desde el login y restablecimiento por el administrador |
| 2 | Panel de super-administrador y alta de laboratorios | Crear, listar, suspender y reactivar laboratorios sin SQL |

**Fuera de alcance**, decidido explícitamente:

- **Cobro automático.** Se cobra a mano (Yape/transferencia + factura por
  SEE-SOL) y se activa el mes desde el panel. Culqi se integra cuando cobrar a
  mano consuma tiempo real.
- **Registro público de laboratorios.** El alta es asistida desde el panel.
- **Catálogo semilla.** Decisión del cliente: cada laboratorio nuevo arranca
  con catálogo vacío. Ver la mitigación en §5.4.
- **Verificación de correo al crear usuarios.** Se mantiene `email_confirm:
  true`: el administrador que invita da fe de la dirección.

## 3. Restricciones del entorno actual

Descubiertas al explorar y condicionan el diseño:

1. **`proxy.ts` redirige al login todo lo que no empiece con `/login`.** Las
   pantallas de recuperación viven bajo `/login/...` y no hace falta abrir
   ningún hueco público nuevo. Además `isLoginPage` compara con igualdad
   (`pathname === '/login'`), así que `/login/nueva-clave` **no** rebota a
   `/hoy` cuando el usuario ya tiene sesión — que es exactamente lo que hace
   falta, porque validar el token crea sesión.

2. **`@supabase/ssr` usa el flujo PKCE por defecto** (`flowType: "pkce"` en
   `createBrowserClient` y `createServerClient`). `resetPasswordForEmail`
   genera un `code_challenge` y guarda el verificador en el almacenamiento del
   cliente que hizo la petición. **Eso rompe el caso real**: si el usuario pide
   el enlace en la computadora y abre el correo en el teléfono, el verificador
   no está y el intercambio falla. Ver la solución en §5.2.

3. **No existe ninguna ruta de retorno de autenticación** (`/auth/callback` o
   equivalente).

4. **El SMTP interno de Supabase limita a unos pocos correos por hora**, así que
   es inservible en producción.

5. **`perfil.laboratorio_id` es `NOT NULL`** y `rol` está restringido por
   `check (rol in ('admin','tecnico'))`. Un administrador de plataforma no
   pertenece a ningún laboratorio, así que no cabe en ese modelo. Ver §6.1.

## 4. Infraestructura (configuración, no código)

**Correo: Resend como SMTP de Supabase.**

| Ajuste | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Puerto | `465` |
| Usuario | `resend` |
| Contraseña | clave API de Resend |
| Remitente | `no-responder@skardiam.com` |
| Nombre | `GestionLab` |

**Dominio:** `gestionlab.skardiam.com`, CNAME a `cname.vercel-dns.com` con el
proxy de Cloudflare **desactivado** (en naranja no se emite el certificado).
En Supabase → Authentication → URL Configuration: Site URL
`https://gestionlab.skardiam.com` y `https://gestionlab.skardiam.com/**` entre
las Redirect URLs.

**Variables de entorno nuevas:** `RESEND_API_KEY` y `SUPERADMIN_EMAILS`.

`scripts/verificar-dominio.mjs` comprueba todo lo anterior sin credenciales.

## 5. Subproyecto 1 — Correo y recuperación

### 5.1 Plantilla de correo

La plantilla de recuperación de Supabase viene en inglés y usa
`{{ .ConfirmationURL }}`, que arrastra el problema de PKCE. Se reemplaza por
una en español que apunta a:

```
https://gestionlab.skardiam.com/login/nueva-clave?token_hash={{ .TokenHash }}&type=recovery
```

### 5.2 Autoservicio desde el login

**`/login/recuperar`** — formulario con un solo campo, el correo.

La acción llama a `resetPasswordForEmail` y **responde siempre lo mismo**, exista
o no ese correo: *"Si esa dirección tiene una cuenta, te llegará un enlace."*
Sin esto, la pantalla se convierte en un detector de quién tiene cuenta en el
sistema.

**`/login/nueva-clave`** — página de servidor. Lee `token_hash` y `type` de la
consulta y llama a `supabase.auth.verifyOtp({ type: 'recovery', token_hash })`.

`verifyOtp` es la pieza clave: **no necesita el verificador de PKCE**, así que
funciona aunque el correo se abra en otro dispositivo. Si el token es válido,
queda sesión establecida y se muestra el formulario de contraseña nueva, cuya
acción llama a `updateUser({ password })`. Si el token venció o ya se usó, la
página lo dice y ofrece pedir otro enlace.

El enlace del login pasa de texto muerto (*"Pídele al administrador…"*) a un
enlace real a `/login/recuperar`.

### 5.3 Restablecimiento por el administrador

En Configuración → Usuarios, cada persona gana **"Restablecer contraseña"**: el
administrador escribe la nueva y se aplica. Es coherente con el modelo que ya
existe, donde el administrador fija la contraseña inicial al crear el usuario.

Nueva función en `lib/usuarios/data.ts`:

```ts
export async function restablecerClave(id: string, password: string): Promise<void>
```

Reutiliza `perteneceALab(id, labId)`, que ya existe, así que **un administrador
solo puede tocar usuarios de su propio laboratorio**. La acción exige
`requireAdmin()`. La contraseña se valida con el mismo mínimo de 6 caracteres
que usa `usuarioSchema`.

### 5.4 Mitigación del catálogo vacío

Como los laboratorios nuevos arrancan sin catálogo y `trabajo` exige
`catalogo_trabajo_id`, hoy `/trabajos/nuevo` queda inservible sin explicar por
qué. Pasa a mostrar *"Primero crea un tipo de trabajo"* con enlace directo a
Configuración → Catálogo.

## 6. Subproyecto 2 — Panel de super-administrador

### 6.1 Cómo se identifica al super-administrador

**Una variable de entorno `SUPERADMIN_EMAILS`** (correos separados por coma),
no una fila en la base de datos.

La razón es de seguridad, no de comodidad: si el super-administrador fuera un
rol en `perfil`, un fallo de la clase de `perfil_self_insert` —el agujero que se
cerró hoy con la migración 0018— podría **otorgarlo**. Una variable de entorno
no se puede escalar desde SQL. Y siendo una sola persona la que administra la
plataforma, no hace falta gestionarlo desde una pantalla.

```ts
// lib/plataforma/acceso.ts
export function esSuperAdmin(email: string | null | undefined): boolean
export async function requireSuperAdmin(): Promise<void>  // redirige a /hoy si no
```

`esSuperAdmin` es pura y comprueba pertenencia sin distinguir mayúsculas ni
espacios. Si `SUPERADMIN_EMAILS` está vacía o no existe, devuelve `false`
siempre: **ausencia de configuración no concede acceso**.

**De dónde sale el correo.** `getSessionContext` devuelve `userId`, `perfil` y
`laboratorio`, pero no el correo. `requireSuperAdmin` lo toma del claim `email`
de `auth.getClaims()`, que ya se verifica localmente en cada petición, con
respaldo en `getUser()` si la verificación local no está disponible — el mismo
patrón que `idUsuario` en `lib/auth.ts`, para no añadir un viaje de red.

**Caso del super-administrador sin laboratorio.** El modelo permite que un
administrador de plataforma no tenga fila en `perfil`, porque su acceso no
depende de ella. Pero entonces `/plataforma` solo es alcanzable escribiendo la
dirección: el enlace del pie de la barra lateral vive dentro del grupo `(app)`,
que exige perfil, y `/hoy` le mostraría *"Cuenta sin laboratorio"*. Hoy no es
un problema porque el super-administrador es además administrador de MasterLab,
así que tiene perfil. Se documenta y no se resuelve: darle una barra de
navegación propia al panel es trabajo que nadie necesita todavía.

### 6.2 Aislamiento: el punto arquitectónico

El panel usa **exclusivamente la clave de servicio, en el servidor**. No se
relaja ninguna política RLS.

Consecuencia deliberada: **las 132 comprobaciones de
`scripts/probar-aislamiento.mjs` siguen pasando sin cambios.** El poder del
super-administrador viene del servidor, no de un agujero en las políticas. Si
en el futuro alguien propone una política del tipo `using (es_superadmin())`,
esa suite debe empezar a fallar — y eso es la señal de que la propuesta está
mal.

### 6.3 Pantallas

`app/(plataforma)/` como grupo de rutas propio, con `requireSuperAdmin()` en su
layout.

**`/plataforma`** — lista de laboratorios: nombre, plan, estado, número de
usuarios, número de trabajos y fecha de creación. Acciones de suspender y
reactivar, que escriben `laboratorio.estado`. Ese estado **ya tiene efecto**
gracias al trabajo previo: `PantallaSuspendida` en el layout de la aplicación y
`respuestaSiSuspendido()` en las cuatro rutas de exportación.

**`/plataforma/nuevo`** — formulario con nombre del laboratorio, y nombre,
correo y contraseña del administrador.

El acceso al panel es un enlace discreto en el pie de la barra lateral, visible
solo para quien pasa `esSuperAdmin`.

### 6.4 El alta, y su reversión

```ts
// lib/plataforma/laboratorios.ts
export async function crearLaboratorioConAdmin(input: {
  laboratorio: string
  adminNombre: string
  adminEmail: string
  adminPassword: string
}): Promise<{ laboratorioId: string }>
```

Tres inserciones que deben quedar todas o ninguna:

1. `laboratorio` → devuelve el id
2. `auth.admin.createUser({ email, password, email_confirm: true })`
3. `perfil` con `rol: 'admin'` y ese `laboratorio_id`

Si el paso 2 falla, se borra el laboratorio. Si falla el 3, se borran el usuario
y el laboratorio. Es el mismo patrón de reversión que ya usa `crearUsuario` en
`lib/usuarios/data.ts`, extendido un nivel.

**No es una transacción de base de datos**: crear el usuario de autenticación
es una llamada a otro servicio y no participa del `BEGIN/COMMIT` de PostgreSQL.
La reversión es explícita en código, y por eso el orden importa: primero lo que
se puede deshacer barato.

Cuando el alta termina, sustituye los pasos 3 a 5 de `docs/supabase-setup.md`,
que se actualiza para decirlo.

## 7. Manejo de errores

Todo lo nuevo usa lo que ya existe: `intentar` e `intentarSinEstado` de
`lib/acciones.ts` para no perder el formulario, `mensajeDeError` de
`lib/errores.ts` para traducir, y `registrarError` de `lib/registro.ts`, que
redacta los valores que PostgreSQL adjunta a sus mensajes.

Dos casos con mensaje propio:

- **Correo ya registrado** al dar de alta un laboratorio. Los correos son
  únicos en todo el proyecto de Supabase, así que el mensaje debe decir que ese
  correo ya tiene cuenta en otro laboratorio, no un genérico.
- **Token vencido o ya usado** en `/login/nueva-clave`.

## 8. Pruebas

**Unitarias (Vitest), sobre lo que se puede aislar:**

- `esSuperAdmin`: pertenencia, mayúsculas, espacios, varios correos, variable
  vacía o ausente. El caso importante: **sin configuración, nadie es
  super-administrador**.
- Componentes de las pantallas nuevas con Testing Library, incluido que
  `/login/recuperar` muestre el mismo mensaje en todos los casos.

**Contra la base real:**

- `scripts/probar-aislamiento.mjs` debe seguir dando 132 de 132 **sin
  modificarse**. Es la comprobación de que §6.2 se cumplió.
- Una comprobación nueva del alta: crear un laboratorio con su administrador,
  verificar que ese administrador solo ve su laboratorio, y borrarlo todo.

**Manual, porque depende de infraestructura externa:** pedir un enlace de
recuperación, abrirlo **en otro dispositivo** y cambiar la contraseña. Ese es el
caso que el flujo PKCE rompía y la razón de usar `verifyOtp`.

## 9. Archivos

**Subproyecto 1**

| Acción | Archivo |
|---|---|
| Crear | `app/(auth)/login/recuperar/page.tsx`, `actions.ts` |
| Crear | `app/(auth)/login/nueva-clave/page.tsx`, `actions.ts` |
| Modificar | `app/(auth)/login/page.tsx` — enlace real de recuperación |
| Modificar | `lib/usuarios/data.ts` — `restablecerClave` |
| Modificar | `app/(app)/configuracion/usuarios/actions.ts`, `page.tsx` |
| Crear | `components/usuarios/RestablecerClave.tsx` + prueba |
| Modificar | `app/(app)/trabajos/nuevo/page.tsx` — aviso de catálogo vacío |
| Modificar | `.env.example` |

**Subproyecto 2**

| Acción | Archivo |
|---|---|
| Crear | `lib/plataforma/acceso.ts` + prueba |
| Crear | `lib/plataforma/laboratorios.ts` |
| Crear | `app/(plataforma)/layout.tsx` |
| Crear | `app/(plataforma)/plataforma/page.tsx`, `actions.ts` |
| Crear | `app/(plataforma)/plataforma/nuevo/page.tsx` |
| Crear | `components/plataforma/` (tarjeta de laboratorio, formulario) + pruebas |
| Modificar | `components/nav/Sidebar.tsx` — enlace al panel |
| Modificar | `docs/supabase-setup.md` — el alta ya no es manual |

Sin migraciones de base de datos en ninguno de los dos.
