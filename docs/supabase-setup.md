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
