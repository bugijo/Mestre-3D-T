import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHero } from './PageHero'

describe('PageHero', () => {
  it('renderiza titulo, descricao e acoes', () => {
    render(
      <PageHero
        eyebrow="Teste"
        title="Painel visual"
        description="Descricao do hero"
        actions={<button type="button">Acao</button>}
        aside={<div>Resumo lateral</div>}
      />,
    )

    expect(screen.getByText('Teste')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Painel visual' })).toBeInTheDocument()
    expect(screen.getByText('Descricao do hero')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Acao' })).toBeInTheDocument()
    expect(screen.getByText('Resumo lateral')).toBeInTheDocument()
  })
})
