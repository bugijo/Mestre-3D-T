import { Outlet } from 'react-router-dom'
import { NavBar } from '@/components/ui/NavBar'
import { useEffect, useState } from 'react'

export default function App() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const onError = (e: Event) => {
      const t = e.target as any
      const src = t?.src || t?.href || ''
      if (t && (t.tagName === 'IMG' || t.tagName === 'SCRIPT' || t.tagName === 'LINK')) {
        setErrorMsg(src ? `Falha ao carregar recurso: ${src}` : 'Falha ao carregar recurso')
      }
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = typeof e.reason === 'string' ? e.reason : (e.reason?.message || 'Erro não tratado')
      setErrorMsg(msg)
    }
    window.addEventListener('error', onError, true)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError, true)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background font-inter text-foreground">
      <NavBar />
      {errorMsg && (
        <div className="mx-auto max-w-6xl px-4">
          <div className="mt-4 rounded-lg border border-red-500/50 bg-red-600/20 text-red-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm">{errorMsg}</span>
            <button className="text-red-300 hover:text-white text-sm" onClick={() => setErrorMsg(null)}>Fechar</button>
          </div>
        </div>
      )}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
