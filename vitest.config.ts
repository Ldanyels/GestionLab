import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    /*
      `.kilo/worktrees` es una copia completa del proyecto que deja otra
      herramienta dentro del repositorio. Sin excluirla, vitest recorre las
      pruebas dos veces y el total sale al doble —215 archivos en vez de 108—,
      que es peor que un número equivocado: hace creer que hay cobertura donde
      solo hay un eco.
    */
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',
      '**/.next/**',
      '**/.kilo/**',
      '**/worktrees/**',
    ],
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
})
