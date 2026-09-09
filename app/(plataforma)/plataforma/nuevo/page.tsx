import Link from 'next/link'
import { FormularioLaboratorio } from '@/components/plataforma/FormularioLaboratorio'
import { crearLaboratorioAction } from '../actions'

export default function NuevoLaboratorioPage() {
  return (
    <section className="space-y-5">
      <header>
        <Link
          href="/plataforma"
          className="text-[13.5px] text-[var(--color-accent)]"
        >
          ‹ Laboratorios
        </Link>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.02em]">
          Nuevo laboratorio
        </h1>
        <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">
          Se crea el laboratorio y la cuenta de su administrador en un solo paso.
        </p>
      </header>

      <FormularioLaboratorio action={crearLaboratorioAction} />
    </section>
  )
}
