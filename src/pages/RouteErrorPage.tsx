import { useEffect } from 'react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { logError } from '@/lib/logger'

export function RouteErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    logError('router:error-boundary', error)
  }, [error])

  let title = 'Falha ao abrir a rota'
  let description = 'Ocorreu um erro inesperado durante a navegacao.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText || 'Erro de rota'}`
    description = typeof error.data === 'string' ? error.data : description
  } else if (error instanceof Error) {
    description = error.message
  }

  return (
    <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 px-6 py-16 text-center">
      <div className="text-xs uppercase tracking-[0.32em] text-red-200">Navegacao</div>
      <h1 className="mt-3 text-4xl font-display font-bold text-white">{title}</h1>
      <p className="mt-4 text-sm text-red-100/90">{description}</p>
      <div className="mt-8">
        <Link to="/" className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15">
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  )
}
