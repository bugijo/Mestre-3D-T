import { Outlet } from 'react-router-dom'
import { NavBar } from '@/components/ui/NavBar'
import { useEffect, useState } from 'react'
import { logError } from '@/lib/logger'

export default function App() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const recentSources = new Set<string>()
    const onError = (event: Event) => {
      const target = event.target as { tagName?: string; src?: string; href?: string; getAttribute?: (name: string) => string | null } | null
      const source = target?.src || target?.href || ''

      if (!target) return
      if (target.tagName === 'IMG') {
        if (source) {
          logError('app:image-resource-error', `Falha ao carregar imagem: ${source}`, { source })
        }
        return
      }

      if ((target.tagName === 'SCRIPT' || target.tagName === 'LINK') && target.getAttribute?.('data-silent-resource-error') !== 'true') {
        if (source && recentSources.has(source)) return
        const message = source ? `Falha ao carregar recurso: ${source}` : 'Falha ao carregar recurso'
        if (source) {
          recentSources.add(source)
          window.setTimeout(() => recentSources.delete(source), 5000)
        }
        setErrorMsg(message)
        logError('app:resource-error', message, { source })
      }
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const message = typeof event.reason === 'string' ? event.reason : event.reason?.message || 'Erro nao tratado'
      setErrorMsg(message)
      logError('app:unhandled-rejection', event.reason)
    }

    window.addEventListener('error', onError, true)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError, true)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return (
    <div className="app-shell">
      <div className="app-backdrop-grid" />
      <div className="app-spotlight -left-24 top-20 h-72 w-72 bg-secondary/20 animate-ambient-float" />
      <div className="app-spotlight right-[-4rem] top-[22rem] h-80 w-80 bg-primary/20 animate-ambient-float" />
      <div className="app-spotlight bottom-[-4rem] left-1/3 h-72 w-72 bg-primary/10 animate-ambient-float" />
      <NavBar />
      <div className="relative z-10">
        {errorMsg && (
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-100 shadow-soft-md backdrop-blur-md">
              <span className="text-sm">{errorMsg}</span>
              <button className="rounded-xl px-2 py-1 text-sm text-red-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400/40" onClick={() => setErrorMsg(null)}>
                Fechar
              </button>
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-[88rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
