import { beforeEach, describe, expect, it } from 'vitest'
import { clearLogEntries, getLogEntries, logError, logInfo } from './logger'

describe('logger', () => {
  beforeEach(() => {
    clearLogEntries()
  })

  it('registra eventos e persiste contexto serializado', () => {
    logInfo('test:info', 'Evento de teste', { value: 1 })
    logError('test:error', new Error('Falha controlada'), { foo: 'bar' })

    const entries = getLogEntries()
    expect(entries).toHaveLength(2)
    expect(entries[0].source).toBe('test:error')
    expect(entries[0].message).toBe('Falha controlada')
    expect(entries[0].context).toContain('"foo":"bar"')
  })
})
