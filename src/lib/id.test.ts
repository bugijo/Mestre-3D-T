import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createId } from './id'

describe('createId', () => {
  const originalCrypto = globalThis.crypto

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
      writable: true,
    })
    vi.restoreAllMocks()
  })

  it('retorna uma string no formato UUID v4', () => {
    const id = createId()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('retorna IDs únicos em chamadas sucessivas', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId()))
    expect(ids.size).toBe(100)
  })

  describe('com crypto.randomUUID disponível (secure context)', () => {
    it('usa crypto.randomUUID quando a função existe', () => {
      const spy = vi.spyOn(crypto, 'randomUUID')
      const id = createId()
      expect(spy).toHaveBeenCalledOnce()
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
    })
  })

  describe('sem crypto.randomUUID (ex: HTTP LAN)', () => {
    beforeEach(() => {
      // Remove apenas randomUUID do crypto nativo sem quebrar getRandomValues
      vi.stubGlobal('crypto', {
        getRandomValues: vi.fn((buffer: Uint8Array) => {
          for (let i = 0; i < buffer.length; i++) {
            buffer[i] = Math.floor(Math.random() * 256)
          }
          return buffer
        }),
        subtle: originalCrypto?.subtle,
      })
    })

    it('gera UUID v4 válido via getRandomValues', () => {
      const id = createId()
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
    })

    it('chama crypto.getRandomValues internamente', () => {
      createId()
      expect(crypto.getRandomValues).toHaveBeenCalledOnce()
    })

    it('retorna IDs únicos em chamadas sucessivas', () => {
      const ids = new Set(Array.from({ length: 100 }, () => createId()))
      expect(ids.size).toBe(100)
    })
  })

  describe('sem crypto nenhum (ambiente extremamente restrito)', () => {
    beforeEach(() => {
      vi.stubGlobal('crypto', undefined)
    })

    it('gera um ID no formato UUID v4 mesmo sem crypto', () => {
      const id = createId()
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
    })

    it('retorna IDs únicos em chamadas sucessivas', () => {
      const ids = new Set(Array.from({ length: 100 }, () => createId()))
      expect(ids.size).toBe(100)
    })
  })

  describe('com crypto mas getRandomValues ausente', () => {
    beforeEach(() => {
      vi.stubGlobal('crypto', { randomUUID: undefined })
    })

    it('faz fallback para Math.random e retorna UUID válido', () => {
      const id = createId()
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
    })
  })

  it('nunca lança exceção', () => {
    for (let i = 0; i < 50; i++) {
      expect(() => createId()).not.toThrow()
    }
  })
})