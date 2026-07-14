// Paleta estable para identificar consultorios de un vistazo.
const PALETA = [
  '#2563eb', // azul
  '#d97706', // ámbar
  '#059669', // verde
  '#7c3aed', // violeta
  '#db2777', // rosa
  '#0891b2', // cian
  '#ca8a04', // oro
  '#dc2626', // rojo
]

/** Color determinístico para un consultorio, derivado de su nombre (estable entre pantallas). */
export function colorConsultorio(clave: string): string {
  let h = 0
  for (let i = 0; i < clave.length; i++) {
    h = (h * 31 + clave.charCodeAt(i)) >>> 0
  }
  return PALETA[h % PALETA.length]
}
