import { describe, it, expect } from 'vitest'
import { appName } from '@/lib/config'

describe('config', () => {
  it('expone el nombre de la app', () => {
    expect(appName).toBe('GestionLab')
  })
})
