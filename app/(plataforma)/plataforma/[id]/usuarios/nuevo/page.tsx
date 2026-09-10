import Link from 'next/link'
import { notFound } from 'next/navigation'
import { resumenDeLaboratorio } from '@/lib/plataforma/laboratorio-detalle'
import { FormularioUsuario } from '@/components/plataforma/FormularioUsuario'
import { crearUsuarioDeLaboratorioAction } from '../../actions'

export default async function NuevoUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Se comprueba que el laboratorio exista antes de ofrecer el formulario: si
  // no, el operador escribiría los datos para que la acción los rechace.
  const resumen = await resumenDeLaboratorio(id)
  if (!resumen) notFound()

  return (
    <section className="space-y-5">
      <header>
        <Link href={`/plataforma/${id}`} className="text-[13.5px] text-[var(--color-accent)]">
          ‹ {resumen.laboratorio.nombre}
        </Link>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.02em]">
          Nuevo usuario
        </h1>
        <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
          Se crea dentro de {resumen.laboratorio.nombre} y queda registrado en su historial.
        </p>
      </header>

      <FormularioUsuario labId={id} action={crearUsuarioDeLaboratorioAction} />
    </section>
  )
}
