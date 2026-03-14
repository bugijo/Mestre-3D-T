import { useEffect, useMemo, useState } from 'react'
import { getAutoContentCacheStatus } from '@/config/auto-content'
import { getGameCatalogCacheStatus } from '@/data/gameCatalog'
import { clearLogEntries, getLogEntries, subscribeToLogs } from '@/lib/logger'

export function useDiagnostics() {
  const [logs, setLogs] = useState(getLogEntries())

  useEffect(() => {
    const unsubscribe = subscribeToLogs(setLogs)
    return () => {
      unsubscribe()
    }
  }, [])

  const stats = useMemo(() => {
    const errors = logs.filter((entry) => entry.level === 'error').length
    const warnings = logs.filter((entry) => entry.level === 'warn').length
    return {
      total: logs.length,
      errors,
      warnings,
      latest: logs[0] ?? null,
      autoContent: getAutoContentCacheStatus(),
      gameCatalog: getGameCatalogCacheStatus(),
    }
  }, [logs])

  return {
    logs,
    stats,
    clearLogs: clearLogEntries,
  }
}
