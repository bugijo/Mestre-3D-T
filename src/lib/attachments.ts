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
  maxSizeInBytes: 5 * 1024 * 1024, // 5MB
  compressionQuality: 0.8,
}

/**
 * Processa um arquivo para anexo seguindo as regras de validação.
 * @param file O arquivo a ser processado
 * @param config Configurações opcionais (sobrescrevem o padrão)
 * @returns Promise com o resultado da operação
 */
export async function processAttachment(
  file: File,
  config: Partial<AttachmentConfig> = {}
): Promise<AttachmentResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const timestamp = Date.now()

  // 1. Log de tentativa
  console.log(`[Attachment] Iniciando processamento: ${file.name} (${file.type}, ${file.size} bytes)`)

  // 2. Validação de Tipo
  if (!finalConfig.allowedTypes.includes(file.type)) {
    const error = `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: ${finalConfig.allowedTypes.join(', ')}`
    console.error(`[Attachment] Falha: ${error}`)
    return { success: false, error, timestamp }
  }

  // 3. Validação de Tamanho
  if (file.size > finalConfig.maxSizeInBytes) {
    const error = `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: ${(finalConfig.maxSizeInBytes / 1024 / 1024).toFixed(2)}MB`
    console.error(`[Attachment] Falha: ${error}`)
    return { success: false, error, timestamp }
  }

  // 4. Conversão e Compressão
  try {
    let dataUrl = await fileToDataUrl(file)

    if (file.size === 0) {
      const error = 'Arquivo vazio'
      console.error(`[Attachment] Falha: ${error}`)
      return { success: false, error, timestamp }
    }

    if (file.type.startsWith('image/')) {
      const dims = await getImageSize(dataUrl)
      if (
        (finalConfig.maxWidth && dims.width > finalConfig.maxWidth) ||
        (finalConfig.maxHeight && dims.height > finalConfig.maxHeight)
      ) {
        const error = `Dimensão excedida: ${dims.width}x${dims.height}. Máximo: ${finalConfig.maxWidth ?? '∞'}x${finalConfig.maxHeight ?? '∞'}`
        console.error(`[Attachment] Falha: ${error}`)
        return { success: false, error, timestamp }
      }
    }

    // Se for imagem e tiver qualidade definida, tenta comprimir
    if (
      file.type.startsWith('image/') &&
      file.type !== 'image/gif' &&
      finalConfig.compressionQuality &&
      finalConfig.compressionQuality < 1.0
    ) {
      try {
        console.log(`[Attachment] Comprimindo imagem com qualidade ${finalConfig.compressionQuality}...`)
        const compressedDataUrl = await compressImage(dataUrl, file.type, finalConfig.compressionQuality)
        // Só usa o comprimido se ficou menor (embora dataUrl base64 seja string, o tamanho importa)
        if (compressedDataUrl.length < dataUrl.length) {
            console.log(`[Attachment] Compressão efetiva: ${(dataUrl.length / 1024).toFixed(2)}KB -> ${(compressedDataUrl.length / 1024).toFixed(2)}KB`)
            dataUrl = compressedDataUrl
        } else {
            console.log('[Attachment] Compressão não reduziu tamanho, mantendo original.')
        }
      } catch (compErr) {
        console.warn('[Attachment] Falha na compressão, usando original:', compErr)
      }
    }

    console.log(`[Attachment] Sucesso: ${file.name} processado.`)
    return { success: true, dataUrl, file, timestamp }
  } catch (err) {
    const error = `Erro ao ler arquivo: ${err instanceof Error ? err.message : String(err)}`
    console.error(`[Attachment] Erro crítico: ${error}`)
    return { success: false, error, timestamp }
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
  return new Promise((resolve) => {
    const img = new Image()
    let settled = false
    const done = (dims: { width: number; height: number }) => {
      if (!settled) {
        settled = true
        resolve(dims)
      }
    }
    img.onload = () => done({ width: img.width, height: img.height })
    img.onerror = () => done({ width: 1, height: 1 })
    img.src = dataUrl
    setTimeout(() => done({ width: 1, height: 1 }), 100)
  })
}

function compressImage(dataUrl: string, type: string, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Mantém proporção, limitando largura máxima para otimização (opcional, mas bom para performance)
      const MAX_WIDTH = 1920
      let width = img.width
      let height = img.height

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      }

      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Não foi possível obter contexto 2D do canvas'))
        return
      }

      // Fundo branco para imagens com transparência convertidas para jpeg (se necessário)
      // Mas aqui vamos manter o tipo original se suportado pelo browser
      ctx.drawImage(img, 0, 0, width, height)
      
      // O browser tenta converter para o tipo solicitado. Se não suportar (ex: gif), pode cair pra png.
      // 'image/webp' é uma boa opção moderna se quisermos forçar, mas vamos respeitar o type original.
      resolve(canvas.toDataURL(type, quality))
    }
    img.onerror = (err) => reject(err)
    img.src = dataUrl
  })
}
