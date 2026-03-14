import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'neutral'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border',
              tone === 'danger'
                ? 'border-rose-400/30 bg-rose-500/15 text-rose-200'
                : 'border-white/10 bg-white/5 text-white',
            )}
          >
            <AlertTriangle size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-xl font-bold text-white">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="mt-2 text-sm leading-relaxed text-text-muted">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'rounded-xl border px-4 py-2 text-sm text-white transition',
              tone === 'danger'
                ? 'border-rose-400/30 bg-rose-500/20 hover:bg-rose-500/30'
                : 'border-secondary/40 bg-secondary/20 hover:bg-secondary/30',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
