import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { LogoDiente } from '@/components/nav/icons'
import { FormularioClaveNueva } from '@/components/usuarios/FormularioClaveNueva'
import { guardarClaveAction } from './actions'

/**
 * Destino del enlace del correo de recuperación.
 *
 * Valida el token con `verifyOtp` y **no** con el flujo PKCE. Es la decisión
 * central de esta pantalla: `@supabase/ssr` usa PKCE por defecto, y ahí el
 * verificador queda guardado en el navegador que pidió el correo, así que
 * pedir el enlace en la computadora y abrirlo en el teléfono fallaría.
 * `verifyOtp` con `token_hash` no necesita verificador y funciona entre
 * dispositivos, que es el caso normal cuando alguien revisa su correo.
 *
 * Validar el token deja sesión establecida; de ahí que `guardarClaveAction`
 * pueda usar `updateUser` sin recibir el token.
 *
 * No hace falta abrir un hueco en `proxy.ts`: esta ruta empieza con `/login`,
 * que ya pasa sin sesión, y el reenvío de usuarios autenticados solo aplica a
 * `/login` exacto, así que la sesión recién creada no rebota a `/hoy`.
 */
export default async function NuevaClavePage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>
}) {
  const { token_hash, type } = await searchParams

  let valido = false
  if (token_hash && type === 'recovery') {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash })
    valido = !error
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <LogoDiente className="text-[var(--color-accent)]" width={24} height={24} />
          GestionLab
        </span>

        {valido ? (
          <>
            <div>
              <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
                Elige tu contraseña
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Con esta entrarás de ahora en adelante.
              </p>
            </div>
            <FormularioClaveNueva action={guardarClaveAction} />
          </>
        ) : (
          <>
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
              Este enlace ya no sirve
            </h1>
            <p className="text-[14.5px] leading-relaxed text-[var(--color-muted)]">
              Los enlaces vencen en una hora y solo se pueden usar una vez. Pide uno
              nuevo y vuelve a intentarlo.
            </p>
            <Link
              href="/login/recuperar"
              className="flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[15px] font-semibold text-[var(--color-accent-contrast)]"
            >
              Pedir otro enlace
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
