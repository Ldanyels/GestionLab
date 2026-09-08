import '@testing-library/jest-dom/vitest'

// jsdom no implementa matchMedia y varios componentes lo consultan
// (ej. ThemeToggle para el modo del sistema). Por defecto: modo claro.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((consulta: string) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
