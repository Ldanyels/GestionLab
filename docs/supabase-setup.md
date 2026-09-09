# Setup de Supabase — GestionLab

## 1. Variables de entorno
Copiar los valores del proyecto Supabase a `.env.local` (ver `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` — URL base (sin `/rest/v1/`).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Clave **publicable** (`sb_publishable_...`).
- `SUPABASE_SERVICE_ROLE_KEY` — Clave **secreta** (`sb_secret_...`). Solo servidor.
- `SUPERADMIN_EMAILS` — Correos que administran la plataforma, separados por coma.
  Dan acceso a `/plataforma`. Si falta, nadie lo tiene.

## 2. Ejecutar migraciones
En Supabase → **SQL Editor** → **New query**, pegar y ejecutar el contenido de
`supabase/migrations/0001_fundacion.sql`. Debe crear las tablas `laboratorio` y `perfil`
sin errores (verificar en **Table Editor**).

## 3. Dar de alta laboratorios

Desde `/plataforma` → **+ Nuevo**, con un correo que esté en
`SUPERADMIN_EMAILS`. El formulario crea el laboratorio, la cuenta de su
administrador y el perfil que los vincula, en un solo paso y revirtiendo todo
si algo falla a mitad. Desde ahí también se suspende y se reactiva el acceso.

### Solo para el primer laboratorio de un proyecto nuevo

El panel necesita una sesión de super-administrador, y en un proyecto recién
creado todavía no hay ninguna cuenta. Ese primer laboratorio sí se hace a mano,
una única vez:

```sql
insert into laboratorio (nombre, plan) values ('MasterLab', 'gratis')
returning id;
```

Luego, en **Authentication → Users → Add user → Create new user**, con
**Auto Confirm User** marcado, y copiando el **UID** que aparece en el listado:

```sql
insert into perfil (id, laboratorio_id, nombre, rol)
values ('<UID-DEL-USUARIO>', '<ID-DEL-LABORATORIO>', 'Nombre Apellido', 'admin');
```

A partir del segundo, todo va por el panel.

## 4. Configurar autenticación por correo
En **Authentication → Sign In / Providers → Email**: habilitado.
Para el arranque, desactivar **Confirm email** (se reactiva en Fase 2).

## Notas de seguridad
- Las políticas RLS restringen cada tabla al laboratorio del usuario (`laboratorio_actual()`).
- La clave **secreta** nunca se expone al navegador ni se commitea.

## 5. Correo transaccional (Resend) y recuperación de contraseña

El SMTP integrado de Supabase permite **2 correos por hora** y solo a miembros
del equipo del proyecto, así que es inservible en producción. Se usa Resend
como SMTP propio.

**Orden importante:** primero el SMTP. Desde junio de 2026, en el plan gratuito
no se pueden editar las plantillas de correo mientras se use el remitente por
defecto de Supabase; configurar SMTP propio desbloquea la edición.

### 5.1 Dominio en Resend

Añadir `skardiam.com` en Resend y copiar sus tres registros a Cloudflare. En
Cloudflare el nombre va **sin** el dominio:

| Tipo | Nombre | Qué es |
|------|--------|--------|
| `TXT` | `resend._domainkey` | Clave DKIM, distinta para cada dominio |
| `MX`  | `send`              | Buzón de rebotes, prioridad 10 |
| `TXT` | `send`              | SPF (`v=spf1 include:amazonses.com ~all`) |

Resend usa el subdominio `send.` a propósito, para no chocar con el SPF que el
dominio pueda tener para su correo normal. Un dominio solo admite **un** SPF:
dos rompen la entrega de todo su correo.

### 5.2 SMTP en Supabase

En **Project Settings → Auth → SMTP Settings** (`/auth/smtp`):

| Campo | Valor |
|-------|-------|
| Host | `smtp.resend.com` |
| Puerto | `465` |
| Usuario | `resend` |
| Contraseña | clave API de Resend |
| Remitente | `no-responder@skardiam.com` |
| Nombre | `GestionLab` |

Al activarlo, Supabase impone un tope de 30 correos por hora, ajustable en la
página de Rate Limits.

### 5.3 URLs

En **Authentication → URL Configuration**:

- Site URL: `https://gestionlab.skardiam.com`
- Redirect URLs: añadir `https://gestionlab.skardiam.com/**`

### 5.4 Plantilla del correo

En **Authentication → Emails → Reset Password**:

- Asunto: `Restablece tu contraseña de GestionLab`
- Cuerpo: el contenido de `docs/correo/plantilla-restablecer-clave.html`

La plantilla arma el enlace con `{{ .TokenHash }}` y **no** con
`{{ .ConfirmationURL }}`. No es un detalle de estilo: `@supabase/ssr` usa el
flujo PKCE, donde el verificador queda en el navegador que pidió el correo, así
que pedir el enlace en la computadora y abrirlo en el teléfono fallaría. Con
`TokenHash`, `/login/nueva-clave` valida el token en el servidor con
`verifyOtp`, sin verificador, y funciona entre dispositivos.

### 5.5 Comprobación

```bash
node scripts/verificar-dominio.mjs
```

Comprueba el CNAME del subdominio, que sirva el login y no la pantalla de
acceso de Vercel, los tres registros de Resend y que el dominio raíz no acabe
con dos SPF. No necesita credenciales.

### 5.6 Si el correo de recuperación no llega

La pantalla de recuperación responde siempre lo mismo, exista o no la cuenta,
para no convertirse en un detector de quién tiene usuario. Eso también esconde
el fallo real, que queda en el registro del servidor. Para verlo directamente,
pedir el enlace por HTTP:

```bash
curl -s -X POST "$URL/auth/v1/recover" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"alguien@ejemplo.com"}'
```

Qué significa cada respuesta:

| Respuesta | Causa |
|-----------|-------|
| `{}` con HTTP 200 | Supabase aceptó y envió. Si no llega, mirar Resend → Logs y la carpeta de spam. |
| `unexpected_failure` — `Error sending recovery email` | El envío SMTP falla. Casi siempre: la clave API puesta en **Usuario** en vez de en Contraseña (el usuario es literalmente `resend`), o el remitente dejado en `noreply@mail.app.supabase.io` con SMTP propio activado, que Resend rechaza porque ese dominio no es suyo. |
| `over_email_send_rate_limit` | Tope por hora alcanzado. Se sube en **Auth → Rate Limits**. |

Si Resend → Logs no muestra ningún intento, Supabase no llegó a Resend: host,
puerto o credenciales. Si lo muestra fallido, ahí sale el motivo exacto.
