import { createAdminSupabase } from '@/lib/supabase/admin'

/**
 * Lecturas de un laboratorio, ya acotadas a él.
 *
 * El panel usa la clave de servicio, que ignora RLS por definición: aquí no hay
 * ninguna política protegiendo nada. Olvidar un `.eq('laboratorio_id', …)` en
 * una sola consulta expone el laboratorio equivocado, así que el acotado se
 * escribe **una vez**, aquí, en vez de repetirse en cada consulta.
 *
 * No es una barrera infranqueable —quien escriba código nuevo puede importar el
 * cliente crudo— sino una de diseño: el camino fácil es el correcto.
 */
export function clienteDeLaboratorio(laboratorioId: string) {
  if (!laboratorioId) {
    throw new Error('clienteDeLaboratorio necesita el id de un laboratorio')
  }
  const admin = createAdminSupabase()

  return {
    laboratorioId,

    /** SELECT sobre una tabla del inquilino, ya filtrado. */
    leer: (tabla: string, columnas: string) =>
      admin.from(tabla).select(columnas).eq('laboratorio_id', laboratorioId),

    /**
     * UPDATE sobre una tabla del inquilino, ya filtrado.
     *
     * El acotado se aplica **antes** de devolver el constructor, así que sigue
     * ahí aunque quien lo use olvide filtrar por `id`. En una escritura eso no
     * es una comodidad: sin RLS protegiendo, un identificador de otro
     * laboratorio modificaría la fila equivocada.
     */
    escribir: (tabla: string, cambios: Record<string, unknown>) =>
      admin.from(tabla).update(cambios).eq('laboratorio_id', laboratorioId),

    /** DELETE sobre una tabla del inquilino, ya filtrado. */
    borrar: (tabla: string) =>
      admin.from(tabla).delete().eq('laboratorio_id', laboratorioId),

    /**
     * SELECT sobre la propia fila del laboratorio. Va aparte porque esa tabla
     * no tiene `laboratorio_id`: se identifica por `id`.
     */
    laboratorio: (columnas: string) =>
      admin.from('laboratorio').select(columnas).eq('id', laboratorioId),
  }
}

export type ClienteDeLaboratorio = ReturnType<typeof clienteDeLaboratorio>
