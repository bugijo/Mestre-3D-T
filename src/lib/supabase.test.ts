import { describe, it, expect } from 'vitest'
import { healthCheck } from './supabase'

describe('Supabase healthCheck', () => {
  it('retorna erro quando env não está configurado', async () => {
    const res = await healthCheck()
    expect(res.ok).toBe(false)
    expect(typeof (res as any).error).toBe('string')
  })
})
