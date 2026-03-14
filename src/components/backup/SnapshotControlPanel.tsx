import { useMemo, useState } from 'react'
import { Copy, Download, RefreshCcw, Upload, Wifi, WifiOff } from 'lucide-react'
import { downloadSnapshot, healthCheck, uploadSnapshot } from '@/lib/supabase'
import { useAppStore } from '@/store/AppStore'
import { isAppSnapshot, normalizeSnapshot, sanitizeSyncSlot } from '@/lib/snapshot'
import { logError, logInfo } from '@/lib/logger'

export function SnapshotControlPanel() {
  const { state, replaceSnapshot } = useAppStore()
  const [status, setStatus] = useState<{ loading: boolean; ok: boolean | null; message: string }>({
    loading: false,
    ok: null,
    message: 'Integracao nao verificada.',
  })
  const [feedback, setFeedback] = useState('')
  const [slot, setSlot] = useState('default')
  const [remoteAction, setRemoteAction] = useState<'upload' | 'download' | null>(null)
  const [remoteSyncAt, setRemoteSyncAt] = useState<string | null>(null)

  const summary = useMemo(
    () => ({
      campaigns: state.campaigns.length,
      scenes: state.scenes.length,
      characters: state.characters.length,
      combats: state.combats.length,
      notes: state.session.notes.length,
    }),
    [state],
  )

  const normalizedSlot = sanitizeSyncSlot(slot)

  const exportSnapshot = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `mestre3dt-snapshot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    logInfo('backup:export', 'Snapshot exportado localmente')
    setFeedback('Snapshot exportado.')
  }

  const importSnapshot = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!isAppSnapshot(parsed)) {
          setFeedback('Arquivo invalido para restauracao.')
          return
        }
        replaceSnapshot(normalizeSnapshot(parsed))
        logInfo('backup:import', 'Snapshot importado localmente', { fileName: file.name })
        setFeedback('Snapshot restaurado com sucesso.')
      } catch (error) {
        logError('backup:import', error, { fileName: file.name })
        setFeedback('Falha ao ler o snapshot.')
      }
    }
    reader.readAsText(file)
  }

  const copySnapshot = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(state))
      setFeedback('Snapshot copiado para a area de transferencia.')
    } catch (error) {
      logError('backup:copy', error)
      setFeedback('Nao foi possivel copiar o snapshot.')
    }
  }

  const checkCloud = async () => {
    setStatus({ loading: true, ok: null, message: 'Verificando Supabase...' })
    const result = await healthCheck(true)
    if (result.ok) {
      setStatus({ loading: false, ok: true, message: 'Supabase acessivel.' })
      return
    }
    setStatus({ loading: false, ok: false, message: result.error })
  }

  const handleRemoteUpload = async () => {
    setRemoteAction('upload')
    const result = await uploadSnapshot(normalizedSlot, state)
    if (result.ok) {
      setRemoteSyncAt(result.data.updated_at)
      setFeedback(`Snapshot enviado para o slot "${normalizedSlot}".`)
      setStatus({ loading: false, ok: true, message: 'Supabase acessivel.' })
    } else {
      setFeedback(`Falha no envio remoto: ${result.error}`)
      setStatus({ loading: false, ok: false, message: result.error })
    }
    setRemoteAction(null)
  }

  const handleRemoteDownload = async () => {
    setRemoteAction('download')
    const result = await downloadSnapshot(normalizedSlot)
    if (result.ok) {
      replaceSnapshot(result.data)
      setRemoteSyncAt(new Date().toISOString())
      setFeedback(`Snapshot do slot "${normalizedSlot}" restaurado da nuvem.`)
      setStatus({ loading: false, ok: true, message: 'Supabase acessivel.' })
    } else {
      setFeedback(`Falha no download remoto: ${result.error}`)
      setStatus({ loading: false, ok: false, message: result.error })
    }
    setRemoteAction(null)
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Backup da Mesa</h3>
          <p className="mt-1 text-sm text-text-muted">Exporte, restaure ou valide o sync opcional com a nuvem.</p>
        </div>
        <button
          onClick={checkCloud}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white transition hover:bg-black/30"
        >
          <RefreshCcw size={14} className={status.loading ? 'animate-spin' : ''} />
          Validar cloud
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-5">
        <SummaryPill label="Campanhas" value={summary.campaigns} />
        <SummaryPill label="Cenas" value={summary.scenes} />
        <SummaryPill label="Personagens" value={summary.characters} />
        <SummaryPill label="Combates" value={summary.combats} />
        <SummaryPill label="Notas" value={summary.notes} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
        {status.ok === true ? <Wifi size={15} className="text-primary" /> : <WifiOff size={15} className="text-amber-300" />}
        <span className="text-white">{status.message}</span>
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex-1">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-text-muted">Slot remoto</span>
            <input
              value={slot}
              onChange={(event) => setSlot(event.target.value)}
              placeholder="default"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/50"
            />
          </label>
          <button
            onClick={handleRemoteUpload}
            disabled={remoteAction !== null}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white transition hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload size={14} />
            {remoteAction === 'upload' ? 'Enviando...' : 'Enviar para nuvem'}
          </button>
          <button
            onClick={handleRemoteDownload}
            disabled={remoteAction !== null}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white transition hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} />
            {remoteAction === 'download' ? 'Baixando...' : 'Baixar da nuvem'}
          </button>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Slot ativo: <span className="text-white">{normalizedSlot}</span>
          {remoteSyncAt ? ` • ultimo sync ${new Date(remoteSyncAt).toLocaleString('pt-BR')}` : ' • nenhum sync remoto nesta sessao'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={exportSnapshot} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white transition hover:bg-black/30">
          <Download size={14} />
          Exportar snapshot
        </button>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white transition hover:bg-black/30">
          <Upload size={14} />
          Importar snapshot
          <input type="file" accept="application/json" className="hidden" onChange={(event) => event.target.files?.[0] && importSnapshot(event.target.files[0])} />
        </label>
        <button onClick={copySnapshot} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white transition hover:bg-black/30">
          <Copy size={14} />
          Copiar JSON
        </button>
      </div>

      {feedback && <p className="mt-4 text-sm text-accent">{feedback}</p>}
    </section>
  )
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-center">
      <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</div>
      <div className="mt-1 text-lg font-bold text-white">{value}</div>
    </div>
  )
}
