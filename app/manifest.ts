import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GestionLab',
    short_name: 'GestionLab',
    description: 'Gestión para laboratorios dentales',
    start_url: '/hoy',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2f6fed',
    lang: 'es',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
