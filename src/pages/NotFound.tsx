import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-16 text-center">
      <div className="text-xs uppercase tracking-[0.32em] text-text-muted">404</div>
      <h1 className="mt-3 text-4xl font-display font-bold text-white">Pagina nao encontrada</h1>
      <p className="mt-4 text-sm text-text-muted">
        O endereco solicitado nao existe ou foi movido dentro do grimorio da mesa.
      </p>
      <div className="mt-8">
        <Link to="/" className="btn-secondary px-4 py-2 text-sm">
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  )
}
