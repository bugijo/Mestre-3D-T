import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppDiagnosticsPanel } from './AppDiagnosticsPanel'
import { clearLogEntries, logError, logInfo } from '@/lib/logger'

describe('AppDiagnosticsPanel', () => {
  beforeEach(() => {
    clearLogEntries()
  })

  it('exibe eventos recentes e permite sumarizar erros', () => {
    logInfo('diagnostics:test', 'Tudo certo')
    logError('diagnostics:test', new Error('Falha de teste'), { area: 'dashboard' })

    render(<AppDiagnosticsPanel />)

    expect(screen.getByText('Diagnostico do App')).toBeInTheDocument()
    expect(screen.getByText('Falha de teste')).toBeInTheDocument()
    expect(screen.getAllByText('diagnostics:test').length).toBeGreaterThan(0)
  })
})
