import React, { useEffect, useRef, useState } from 'react'
import { processAttachment, type AttachmentConfig } from '@/lib/attachments'
import { cn } from '@/lib/cn'
import { logError, logWarn } from '@/lib/logger'

type ImageUploadProps = {
  label?: string
  currentImage?: string | null
  onImageSelected: (dataUrl: string) => void
  className?: string
  config?: Partial<AttachmentConfig>
  syncGithub?: {
    enabled?: boolean
    issueNumber?: number
    pullNumber?: number
    pathPrefix?: string
    commitMessage?: string
  }
}

export function ImageUpload({
  label = 'Imagem',
  currentImage,
  onImageSelected,
  className,
  config,
  syncGithub,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentImage || null)

  useEffect(() => {
    setPreview(currentImage || null)
  }, [currentImage])

  const handleSelectedFile = async (file: File) => {
    setIsProcessing(true)
    setError(null)

    try {
      const result = await processAttachment(file, config)

      if (result.success && result.dataUrl) {
        setPreview(result.dataUrl)
        onImageSelected(result.dataUrl)

        if (syncGithub?.enabled) {
          try {
            const { syncAttachmentToGithub } = await import('@/lib/github')
            const res = await syncAttachmentToGithub({
              dataUrl: result.dataUrl,
              mime: file.type,
              originalName: file.name,
              issueNumber: syncGithub.issueNumber,
              pullNumber: syncGithub.pullNumber,
              pathPrefix: syncGithub.pathPrefix,
              commitMessage: syncGithub.commitMessage,
            })
            if (!res.ok) {
              setError(res.error)
              logWarn('image-upload:github-sync', res.error, { fileName: file.name })
            }
          } catch (githubError) {
            logError('image-upload:github-sync', githubError, { fileName: file.name })
          }
        }
      } else {
        setError(result.error || 'Erro desconhecido ao processar imagem.')
      }
    } catch (uploadError) {
      setError('Falha critica no upload.')
      logError('image-upload:critical', uploadError, { fileName: file.name })
    } finally {
      setIsProcessing(false)
      setIsDragOver(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await handleSelectedFile(file)
  }

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation()
    setPreview(null)
    setError(null)
    onImageSelected('')
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <label className="text-accent font-rajdhani font-semibold">{label}</label>}

      <div
        className={cn(
          'relative group cursor-pointer border-2 border-dashed border-white/20 rounded-lg overflow-hidden transition-all hover:border-secondary/50 bg-black/40',
          preview ? 'h-48' : 'h-32 flex items-center justify-center',
          isProcessing && 'opacity-50 cursor-wait',
          isDragOver && 'border-accent bg-accent/10',
        )}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!isProcessing) setIsDragOver(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!isProcessing) setIsDragOver(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          const nextTarget = event.relatedTarget as Node | null
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
            setIsDragOver(false)
          }
        }}
        onDrop={async (event) => {
          event.preventDefault()
          if (isProcessing) return
          const file = event.dataTransfer.files?.[0]
          if (!file) {
            setIsDragOver(false)
            return
          }
          await handleSelectedFile(file)
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <span className="text-white font-rajdhani">Alterar Imagem</span>
              <button
                onClick={handleRemove}
                aria-label="Remover imagem"
                className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-full border border-red-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                title="Remover imagem"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Processando...</span>
              </div>
            ) : (
              <>
                <div className="mx-auto w-10 h-10 mb-2 text-gray-500 group-hover:text-accent transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 font-rajdhani">
                  Clique para upload ou arraste
                </p>
                <p className="text-xs text-gray-600 mt-1">Max 5MB (JPG, PNG, WEBP)</p>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <div className="text-red-400 text-xs mt-1 bg-red-900/20 p-2 rounded border border-red-900/50 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          {error}
        </div>
      )}
    </div>
  )
}
