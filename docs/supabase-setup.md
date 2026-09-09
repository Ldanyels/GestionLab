# Setup de Supabase — GestionLab

## 1. Variables de entorno
Copiar los valores del proyecto Supabase a `.env.local` (ver `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` — URL base (sin `/rest/v1/`).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Clave **publicable** (`sb_publishable_...`).
- `SUPABASE_SERVICE_ROLE_KEY` — Clave **secreta** (`sb_secret_...`). Solo servidor.

## 2. Ejecutar migraciones
En Supabase → **SQL Editor** → **New query**, pegar y ejecutar el contenido de
`supabase/migrations/0001_fundacion.sql`. Debe crear las tablas `laboratorio` y `perfil`
sin errores (verificar en **Table Editor**).

## 3. Crear el laboratorio MasterLab
En el SQL Editor, ejecutar:
```sql
insert into laboratorio (nombre, plan) values ('MasterLab', 'gratis')
returning id;
```
Copiar el `id` que devuelve (lo necesitas en el paso 5).

## 4. Crear el usuario administrador
En Supabase → **Authentication → Users → Add user → Create new user**:
- Email: el correo del administrador (ej. el de Marlon).
- Password: una contraseña temporal.
- (Recomendado para el arranque) marcar **Auto Confirm User** para no requerir verificación por correo.

Copiar el **UID** del usuario recién creado (columna del listado de usuarios).

## 5. Vincular el usuario a MasterLab como admin
En el SQL Editor, reemplazar los dos valores y ejecutar:
```sql
insert into perfil (id, laboratorio_id, nombre, rol)
values ('<UID-DEL-USUARIO>', '<ID-DEL-LABORATORIO>', 'Marlon Chávez', 'admin');
```

## 6. Configurar autenticación por correo
En **Authentication → Sign In / Providers → Email**: habilitado.
Para el arranque, desactivar **Confirm email** (se reactiva en Fase 2).

## Notas de seguridad
- Las políticas RLS restringen cada tabla al laboratorio del usuario (`laboratorio_actual()`).
- La clave **secreta** nunca se expone al navegador ni se commitea.

## 7. Correo transaccional (Resend) y recuperación de contraseña

El SMTP integrado de Supabase permite **2 correos por hora** y solo a miembros
del equipo del proyecto, así que es inservible en producción. Se usa Resend
como SMTP propio.

**Orden importante:** primero el SMTP. Desde junio de 2026, en el plan gratuito
no se pueden editar las plantillas de correo mientras se use el remitente por
defecto de Supabase; configurar SMTP propio desbloquea la edición.

### 7.1 Dominio en Resend

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

### 7.2 SMTP en Supabase

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

### 7.3 URLs

En **Authentication → URL Configuration**:

- Site URL: `https://gestionlab.skardiam.com`
- Redirect URLs: añadir `https://gestionlab.skardiam.com/**`

### 7.4 Plantilla del correo

En **Authentication → Emails → Reset Password**:

- Asunto: `Restablece tu contraseña de GestionLab`
- Cuerpo: el contenido de `docs/correo/plantilla-restablecer-clave.html`

La plantilla arma el enlace con `{{ .TokenHash }}` y **no** con
`{{ .ConfirmationURL }}`. No es un detalle de estilo: `@supabase/ssr` usa el
flujo PKCE, donde el verificador queda en el navegador que pidió el correo, así
que pedir el enlace en la computadora y abrirlo en el teléfono fallaría. Con
`TokenHash`, `/login/nueva-clave` valida el token en el servidor con
`verifyOtp`, sin verificador, y funciona entre dispositivos.

### 7.5 Comprobación

```bash
node scripts/verificar-dominio.mjs
```

Comprueba el CNAME del subdominio, que sirva el login y no la pantalla de
acceso de Vercel, los tres registros de Resend y que el dominio raíz no acabe
con dos SPF. No necesita credenciales.
