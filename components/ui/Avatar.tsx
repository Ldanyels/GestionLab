import { colorConsultorio } from '@/lib/consultorios/color'

interface Props {
  nombre: string
  /** Lado del cuadrado en píxeles. 38 en listas, 52 en cabeceras. */
  tamano?: number
}

/** Inicial del consultorio sobre su color de identidad al 12 %. */
export function Avatar({ nombre, tamano = 38 }: Props) {
  const color = colorConsultorio(nombre)
  const inicial = nombre.trim().charAt(0).toUpperCase()
  return (
    <span
      aria-hidden
      style={{
        width: `${tamano}px`,
        height: `${tamano}px`,
        backgroundColor: `${color}1f`,
        color,
        fontSize: `${Math.round(tamano * 0.42)}px`,
      }}
      className="flex shrink-0 items-center justify-center rounded-[var(--radius-md)] font-bold"
    >
      {inicial}
    </span>
  )
}
