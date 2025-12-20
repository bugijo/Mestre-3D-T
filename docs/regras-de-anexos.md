# Regra de Anexos Automatizados (Automated Attachment Rule)

Este documento descreve a funcionalidade de processamento de anexos implementada no projeto Mestre 3D&T, garantindo uploads seguros, otimizados e consistentes.

## Visão Geral

A regra de anexos automatizados é responsável por:
1.  **Validar** arquivos antes do upload (tipo e tamanho).
2.  **Processar** arquivos, convertendo-os para Data URLs (Base64) para armazenamento local inicial ou preview.
3.  **Otimizar** imagens automaticamente através de compressão (Canvas API) para reduzir o uso de armazenamento e melhorar a performance.
4.  **Logar** tentativas, sucessos e falhas para auditoria.

## Localização do Código

- **Lógica Core:** `src/lib/attachments.ts`
- **Componente UI:** `src/components/ui/ImageUpload.tsx`

## Configuração

A função `processAttachment` aceita um objeto de configuração opcional `AttachmentConfig`:

```typescript
type AttachmentConfig = {
  // Lista de MIME types permitidos
  allowedTypes: string[] 
  // Tamanho máximo em bytes (Padrão: 5MB)
  maxSizeInBytes: number
  // Qualidade de compressão para imagens (0.0 a 1.0). Se definido, tenta comprimir.
  compressionQuality?: number 
}
```

### Configuração Padrão (`DEFAULT_CONFIG`)

- **Tipos Permitidos:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- **Tamanho Máximo:** 5MB
- **Qualidade de Compressão:** 0.8 (80%)

## Uso Programático

Para processar um arquivo manualmente (ex: em um drag-and-drop customizado):

```typescript
import { processAttachment } from '@/lib/attachments'

const handleFile = async (file: File) => {
  const result = await processAttachment(file, {
    maxSizeInBytes: 2 * 1024 * 1024, // Limite de 2MB
    compressionQuality: 0.7 // Compressão mais agressiva
  })

  if (result.success) {
    console.log("URL da imagem:", result.dataUrl)
    // Salvar result.dataUrl no estado ou enviar para backend
  } else {
    alert(result.error)
  }
}
```

## Uso via Componente UI (`ImageUpload`)

Para interfaces de usuário, utilize o componente `ImageUpload` que já encapsula a lógica visual, estados de loading e tratamento de erros.

```tsx
import { ImageUpload } from '@/components/ui/ImageUpload'

export function MinhaPagina() {
  const [capa, setCapa] = useState<string>('')

  return (
    <ImageUpload
      label="Capa da Campanha"
      currentImage={capa}
      onImageSelected={(url) => setCapa(url)}
      config={{ compressionQuality: 0.6 }} // Opcional
    />
  )
}
```

## Tratamento de Erros

A regra retorna um objeto `AttachmentResult` que deve ser verificado:

- `success`: Booleano indicando sucesso.
- `error`: Mensagem de erro amigável em caso de falha (ex: "Arquivo muito grande").
- `timestamp`: Momento da operação.

Erros comuns tratados:
- Tipo de arquivo não suportado.
- Arquivo excede o tamanho máximo.
- Erro de leitura/permissão do arquivo.
- Falha na compressão (fallback silencioso para arquivo original).

## Compressão de Imagens

A compressão é realizada no cliente (browser) usando a API de Canvas:
1.  A imagem é desenhada em um Canvas.
2.  Se a largura for maior que 1920px, ela é redimensionada proporcionalmente (Max Width).
3.  O Canvas é exportado como Data URL com a qualidade definida.
4.  Se o arquivo comprimido for maior que o original (raro, mas possível em arquivos já otimizados), o original é mantido.
