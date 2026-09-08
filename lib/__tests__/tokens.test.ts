import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

/** Bloque de declaraciones que sigue a un selector, para aislar cada tema. */
function bloque(selector: string): string {
  const i = css.indexOf(selector)
  if (i === -1) return ''
  const abre = css.indexOf('{', i)
  return css.slice(abre, css.indexOf('}', abre))
}

const CLARO: Record<string, string> = {
  '--color-bg': '#F6F7F9',
  '--color-surface': '#FFFFFF',
  '--color-surface-2': '#FBFCFD',
  '--color-text': '#14181F',
  '--color-muted': '#626B7A',
  '--color-border': '#E5E8EE',
  '--color-accent': '#2F6FED',
  '--color-accent-soft': '#EAF1FE',
  '--color-accent-ink': '#1B4FBF',
  '--color-accent-contrast': '#FFFFFF',
  '--color-danger': '#DC2A2A',
  '--color-danger-soft': '#FDECEC',
  '--color-success': '#12855F',
  '--color-success-soft': '#E7F6EF',
  '--color-warn': '#B45309',
  '--color-warn-soft': '#FEF3E2',
}

const OSCURO: Record<string, string> = {
  '--color-bg': '#0F1216',
  '--color-surface': '#171B21',
  '--color-surface-2': '#1D222A',
  '--color-text': '#F2F4F7',
  '--color-muted': '#9AA4B2',
  '--color-border': '#2A303A',
  '--color-accent': '#7EA6FF',
  '--color-accent-soft': '#1D2942',
  '--color-accent-ink': '#BBD0FF',
  '--color-accent-contrast': '#0E141C',
  '--color-danger': '#FF7A7A',
  '--color-danger-soft': '#3A2020',
  '--color-success': '#4ED8A5',
  '--color-success-soft': '#12301F',
  '--color-warn': '#F5B461',
  '--color-warn-soft': '#332413',
}

describe('paleta del rediseño', () => {
  it('define el tema claro en :root con los valores del spec', () => {
    const raiz = bloque(':root {')
    for (const [token, valor] of Object.entries(CLARO)) {
      expect(raiz, `${token} en tema claro`).toContain(`${token}: ${valor}`)
    }
  })

  it('define el tema oscuro con los valores del spec', () => {
    const oscuro = bloque(":root[data-theme='dark']")
    for (const [token, valor] of Object.entries(OSCURO)) {
      expect(oscuro, `${token} en tema oscuro`).toContain(`${token}: ${valor}`)
    }
  })

  it('el oscuro por sistema usa la misma paleta', () => {
    const porSistema = bloque(":root:not([data-theme='light'])")
    expect(porSistema).toContain('--color-bg: #0F1216')
    expect(porSistema).toContain('--color-accent: #7EA6FF')
  })

  it('define los radios y sombras del spec', () => {
    expect(css).toContain('--radius-sm: 0.5rem')
    expect(css).toContain('--radius-md: 0.75rem')
    expect(css).toContain('--radius-lg: 1rem')
    expect(css).toContain('--radius-xl: 1.25rem')
    expect(css).toContain('--shadow-card:')
    expect(css).toContain('--shadow-pop:')
    expect(css).toContain('--color-accent-glow:')
  })

  it('expone los tokens nuevos como utilidades de Tailwind', () => {
    const tema = bloque('@theme inline')
    for (const token of [
      '--color-surface-2',
      '--color-danger-soft',
      '--color-success-soft',
      '--color-warn',
      '--color-warn-soft',
    ]) {
      expect(tema, `${token} en @theme`).toContain(token)
    }
  })

  it('activa text-wrap: pretty de forma global', () => {
    expect(css).toMatch(/text-wrap:\s*pretty/)
  })
})
