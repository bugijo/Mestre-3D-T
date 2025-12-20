import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
vi.mock('@/lib/attachments', () => {
  return {
    processAttachment: vi.fn((file: File) => {
      if (file.type === 'application/pdf') {
        return Promise.resolve({ success: false, error: 'Tipo de arquivo não permitido: application/pdf. Tipos aceitos: image/jpeg, image/png, image/webp, image/gif', timestamp: Date.now() })
      }
      return Promise.resolve({ success: true, dataUrl: 'data:image/png;base64,AAA', timestamp: Date.now() })
    })
  }
})
import { ImageUpload } from './ImageUpload'

function makeFile(contents: string, type: string, name = 'file.dat') {
  const blob = new Blob([contents], { type })
  return new File([blob], name, { type })
}

describe('ImageUpload', () => {
  it('exibe erro para tipo inválido e não chama onImageSelected', async () => {
    const onSelect = vi.fn()
    const { container } = render(<ImageUpload onImageSelected={onSelect} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const badFile = makeFile('pdf', 'application/pdf', 'doc.pdf')
    fireEvent.change(input, { target: { files: [badFile] } })
    expect(await screen.findByText(/Tipo de arquivo não permitido/)).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('processa imagem válida e chama onImageSelected (mock)', async () => {
    const onSelect = vi.fn()
    const { container } = render(<ImageUpload onImageSelected={onSelect} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const goodFile = makeFile('hello', 'image/png', 'ok.png')
    fireEvent.change(input, { target: { files: [goodFile] } })
    await waitFor(() => expect(onSelect).toHaveBeenCalled())
    expect(screen.getByAltText('Preview')).toBeInTheDocument()
  })
})
