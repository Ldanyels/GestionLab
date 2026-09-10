'use client'

import { useEffect, useState } from 'react'

/**
 * Si el navegador cree tener conexión.
 *
 * Existe porque el sistema se usa en un laboratorio con wifi irregular, y hasta
 * ahora un envío sin señal terminaba en un botón girando que no llevaba a
 * ninguna parte: sin aviso, sin error legible, y con el técnico sin saber si lo
 * que escribió se guardó.
 *
 * **Lo que esto detecta y lo que no.** `navigator.onLine` es falso solo cuando
 * el dispositivo no tiene red en absoluto —modo avión, wifi apagado, cable
 * fuera—, que es el caso frecuente en el taller. Un wifi conectado pero sin
 * salida a internet devuelve `true`, así que el aviso no aparecería. No se
 * suple con sondeos periódicos a propósito: gastarían batería y datos para
 * cubrir un caso menos común, y un falso «sin conexión» sería peor que ninguno
 * porque enseñaría a ignorar el aviso.
 */
export function useConexion(): boolean {
  /*
    Empieza en `true`, no en el valor real.

    El render del servidor no puede saberlo, y empezar en `false` haría
    aparecer el aviso un instante en cada carga de página, incluso con
    conexión perfecta. Un aviso que parpadea sin motivo se aprende a ignorar.
  */
  const [enLinea, setEnLinea] = useState(true)

  useEffect(() => {
    const sincronizar = () => setEnLinea(navigator.onLine)
    // Una vez al montar: si la página se abrió sin conexión (desde la caché
    // del navegador), no llega ningún evento que lo cuente.
    sincronizar()
    window.addEventListener('online', sincronizar)
    window.addEventListener('offline', sincronizar)
    return () => {
      window.removeEventListener('online', sincronizar)
      window.removeEventListener('offline', sincronizar)
    }
  }, [])

  return enLinea
}
