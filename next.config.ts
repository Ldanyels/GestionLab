import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad.
 *
 * No había ninguna: el sistema se podía incrustar en un iframe ajeno, no
 * exigía HTTPS en visitas posteriores, y filtraba la URL completa como
 * referente al salir. Son cuatro líneas de configuración que cierran ataques
 * que no dependen de ningún fallo del código.
 */
const cabecerasDeSeguridad = [
  /*
    Nadie puede incrustar el sistema en su página.

    Sin esto, una web cualquiera puede cargar GestionLab en un iframe invisible
    y engañar al usuario para que pulse dentro sin verlo —el clic va a un botón
    real, con su sesión activa. `frame-ancestors` en la CSP es la versión
    moderna; `X-Frame-Options` la respalda en navegadores antiguos.
  */
  { key: 'X-Frame-Options', value: 'DENY' },

  // El navegador respeta el tipo declarado en vez de adivinarlo. Evita que un
  // archivo subido se acabe ejecutando como si fuera otra cosa.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  /*
    Al salir hacia otro sitio solo se envía el dominio, no la ruta.

    Las rutas de este sistema llevan identificadores de trabajos y de
    consultorios; mandarlos como referente a un sitio externo sería filtrar
    información de pacientes por el camino.
  */
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // No se usa cámara desde el navegador —las fotos entran por el selector de
  // archivos del sistema— ni micrófono ni ubicación. Se niegan todos.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },

  /*
    HTTPS obligatorio durante un año, subdominios incluidos.

    Vercel ya sirve solo por HTTPS; esto impide además el primer salto por HTTP
    de quien escriba el dominio a mano, que es donde se intercepta una sesión.
  */
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const nextConfig: NextConfig = {
  // Oculta el indicador flotante de desarrollo (tapaba la barra de navegación).
  devIndicators: false,

  async headers() {
    return [{ source: '/:path*', headers: cabecerasDeSeguridad }]
  },
};

export default nextConfig;
