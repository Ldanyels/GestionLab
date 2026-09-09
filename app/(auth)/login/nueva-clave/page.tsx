import Link from 'next/link'
import { LogoDiente } from '@/components/nav/icons'
import { FormularioClaveNueva } from '@/components/usuarios/FormularioClaveNueva'
import { guardarClaveAction } from './actions'

/**
 * Destino del enlace del correo de recuperación.
 *
 * El token se canjea con `verifyOtp` y **no** con el flujo PKCE. Es la decisión
 * central de esta pantalla: `@supabase/ssr` usa PKCE por defecto, y ahí el
 * verificador queda guardado en el navegador que pidió el correo, así que
 * pedir el enlace en la computadora y abrirlo en el teléfono fallaría.
 * `verifyOtp` con `token_hash` no necesita verificador y funciona entre
 * dispositivos, que es el caso normal cuando alguien revisa su correo.
 *
 * **Esta página no canjea el token: lo pasa al formulario.** Canjearlo aquí lo
 * gastaba —es de un solo uso— y la sesión resultante no llegaba al navegador,
 * porque Next no permite escribir cookies durante el render de un Server
 * Component y `lib/supabase/server.ts` descarta esa escritura. El resultado era
 * que el formulario aparecía y el guardado fallaba siempre. Por eso el canje
 * vive en `guardarClaveAction`, junto al guardado y en la misma petición.
 *
 * Aquí solo se comprueba que el enlace traiga lo que debe traer. Si el token
 * está vencido o ya se usó, lo dice la acción al enviar; no se puede saber
 * antes sin gastarlo.
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
  const valido = Boolean(token_hash) && type === 'recovery'

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
            <FormularioClaveNueva
              action={guardarClaveAction}
              tokenHash={token_hash ?? ''}
            />
          </>
        ) : (
          <>
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
              Este enlace está incompleto
            </h1>
            <p className="text-[14.5px] leading-relaxed text-[var(--color-muted)]">
              Le falta el código de seguridad. Suele pasar cuando se copia el enlace a
              mano o el correo lo corta. Pide uno nuevo y ábrelo directamente desde el
              mensaje.
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
