import { PantallaDeError } from '@/components/ui/PantallaDeError'

/**
 * Pantalla para los `notFound()` de la aplicación: un trabajo, consultorio,
 * insumo o trabajador que ya no existe, o cuyo identificador es de otro
 * laboratorio y por eso la consulta no devuelve nada.
 */
export default function NoEncontrado() {
  return (
    <PantallaDeError
      titulo="No encontramos eso"
      explicacion="El registro ya no existe o no pertenece a tu laboratorio. Puede que alguien lo haya eliminado."
    />
  )
}
