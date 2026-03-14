export function AppShellFallback({ label = 'Carregando modulo...' }: { label?: string }) {
  return (
    <div className="app-panel-strong flex min-h-[40vh] flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-secondary/20 blur-xl" />
        <div className="relative h-12 w-12 rounded-full border-4 border-secondary/70 border-t-transparent animate-spin" />
      </div>
      <div className="space-y-2">
        <p className="eyebrow">Carregando interface</p>
        <p className="text-sm text-text-muted">{label}</p>
      </div>
    </div>
  )
}
