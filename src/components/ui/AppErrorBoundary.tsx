import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logError } from '@/lib/logger'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || 'Erro inesperado na interface.',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError('ui:error-boundary', error, { componentStack: errorInfo.componentStack })
  }

  reset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl rounded-3xl border border-red-500/20 bg-black/40 p-8 text-white shadow-xl">
          <div className="text-xs uppercase tracking-[0.24em] text-red-300">Falha capturada</div>
          <h1 className="mt-3 text-3xl font-bold">A interface encontrou um erro.</h1>
          <p className="mt-3 text-sm text-red-100/80">{this.state.message}</p>
          <div className="mt-6 flex gap-3">
            <button onClick={this.reset} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm">
              Tentar novamente
            </button>
            <button onClick={() => window.location.reload()} className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-2 text-sm">
              Recarregar app
            </button>
          </div>
        </div>
      </div>
    )
  }
}
