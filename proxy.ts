import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          ),
      },
    },
  )

  // Vía rápida: verificar la firma del token aquí mismo. `getUser()` pregunta
  // a Supabase por red y añade cientos de milisegundos a CADA navegación.
  // Si no hay token válido (o está vencido), se cae a `getUser()`, que además
  // renueva la sesión y escribe las cookies nuevas.
  let hayUsuario = false
  try {
    const { data, error } = await supabase.auth.getClaims()
    hayUsuario = !error && typeof data?.claims?.sub === 'string'
  } catch {
    hayUsuario = false
  }
  if (!hayUsuario) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    hayUsuario = Boolean(user)
  }
  const user = hayUsuario

  const { pathname } = req.nextUrl
  const isAuthRoute = pathname.startsWith('/login') // login y logout
  const isLoginPage = pathname === '/login'

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  // Solo la página de login (no /login/logout) reenvía a los ya autenticados.
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/hoy', req.url))
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons).*)'],
}
