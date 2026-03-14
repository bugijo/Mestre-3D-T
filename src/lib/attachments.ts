import { logError, logInfo, logWarn } from '@/lib/logger'

export type AttachmentConfig = {
  allowedTypes: string[]
  maxSizeInBytes: number
  compressionQuality?: number
  maxWidth?: number
  maxHeight?: number
}

export type AttachmentResult = {
  success: boolean
  dataUrl?: string
  file?: File
  error?: string
  timestamp: number
}

const DEFAULT_CONFIG: AttachmentConfig = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSizeInBytes: 5 * 1024 * 1024,
  compressionQuality: 0.8,
}

const MAX_CACHE_ENTRIES = 24
const imageSizeCache = new Map<string, Promise<{ width: number; height: number }>>()
const compressionCache = new Map<string, Promise<string>>()

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash.toString(16)
}

function setBoundedCache<T>(cache: Map<string, T>, key: string, value: T) {
  if (!cache.has(key) && cache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
  cache.set(key, value)
}

function buildErrorResult(message: string, timestamp: number, context?: unknown) {
  logWarn('attachments:validation', message, context)
  return { success: false, error: message, timestamp } satisfies AttachmentResult
}

export async function processAttachment(
  file: File,
  config: Partial<AttachmentConfig> = {},
): Promise<AttachmentResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const timestamp = Date.now()
  logInfo('attachments:start', 'Processando anexo', {
    fileName: file.name,
    mime: file.type,
    size: file.size,
  })

  if (!finalConfig.allowedTypes.includes(file.type)) {
    return buildErrorResult(
      `Tipo de arquivo nao permitido: ${file.type}. Tipos aceitos: ${finalConfig.allowedTypes.join(', ')}`,
      timestamp,
      { fileName: file.name },
    )
  }

  if (file.size > finalConfig.maxSizeInBytes) {
    return buildErrorResult(
      `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximo permitido: ${(finalConfig.maxSizeInBytes / 1024 / 1024).toFixed(2)}MB`,
      timestamp,
      { fileName: file.name },
    )
  }

  try {
    let dataUrl = await fileToDataUrl(file)

    if (file.size === 0) {
      return buildErrorResult('Arquivo vazio', timestamp, { fileName: file.name })
    }

    if (file.type.startsWith('image/')) {
      const dims = await getImageSize(dataUrl)
      const widthExceeded = finalConfig.maxWidth != null && dims.width > finalConfig.maxWidth
      const heightExceeded = finalConfig.maxHeight != null && dims.height > finalConfig.maxHeight

      if (widthExceeded || heightExceeded) {
        return buildErrorResult(
          `Dimensao excedida: ${dims.width}x${dims.height}. Maximo: ${finalConfig.maxWidth ?? 'sem limite'}x${finalConfig.maxHeight ?? 'sem limite'}`,
          timestamp,
          { fileName: file.name },
        )
      }
    }

    if (
      file.type.startsWith('image/') &&
      file.type !== 'image/gif' &&
      finalConfig.compressionQuality &&
      finalConfig.compressionQuality < 1
    ) {
      try {
        const compressedDataUrl = await compressImageCached(dataUrl, file.type, finalConfig.compressionQuality)
        if (compressedDataUrl.length < dataUrl.length) {
          dataUrl = compressedDataUrl
        }
      } catch (error) {
        logWarn('attachments:compression', 'Falha ao comprimir imagem, mantendo original', {
          fileName: file.name,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    logInfo('attachments:success', 'Anexo processado com sucesso', {
      fileName: file.name,
      size: file.size,
      outputLength: dataUrl.length,
    })
    return { success: true, dataUrl, file, timestamp }
  } catch (error) {
    const message = `Erro ao ler arquivo: ${error instanceof Error ? error.message : String(error)}`
    logError('attachments:critical', error, { fileName: file.name })
    return { success: false, error: message, timestamp }
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  const key = hashString(dataUrl)
  const cached = imageSizeCache.get(key)
  if (cached) return cached

  const pending = new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image()
    let settled = false
    const done = (dims: { width: number; height: number }) => {
      if (settled) return
      settled = true
      resolve(dims)
    }
    img.onload = () => done({ width: img.width, height: img.height })
    img.onerror = () => done({ width: 1, height: 1 })
    img.src = dataUrl
    setTimeout(() => done({ width: 1, height: 1 }), 100)
  })

  setBoundedCache(imageSizeCache, key, pending)
  return pending
}

function compressImageCached(dataUrl: string, type: string, quality: number): Promise<string> {
  const key = `${type}:${quality}:${hashString(dataUrl)}`
  const cached = compressionCache.get(key)
  if (cached) return cached

  const pending = compressImage(dataUrl, type, quality).catch((error) => {
    compressionCache.delete(key)
    throw error
  })

  setBoundedCache(compressionCache, key, pending)
  return pending
}

function compressImage(dataUrl: string, type: string, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxWidth = 1920
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Nao foi possivel obter contexto 2D do canvas'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL(type, quality))
    }
    img.onerror = (error) => reject(error)
    img.src = dataUrl
  })
}
