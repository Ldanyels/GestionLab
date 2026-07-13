import { describe, it, expect } from 'vitest'
import { formatMoney } from '@/lib/format'

describe('formatMoney', () => {
  it('formatea soles con dos decimales', () => {
    expect(formatMoney(90)).toBe('S/ 90.00')
    expect(formatMoney(1234.5)).toBe('S/ 1,234.50')
  })
  it('formatea cero', () => {
    expect(formatMoney(0)).toBe('S/ 0.00')
  })
})
