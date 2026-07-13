import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: BASE_URL },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'pnpm dev',
    url: BASE_URL,
    // Reutiliza el servidor de GestionLab si ya corre en 3100 (puerto dedicado).
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
