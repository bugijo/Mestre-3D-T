import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { Dashboard } from './Dashboard'

describe('Dashboard', () => {
  it('alternar tabs atualiza aria-pressed', () => {
    const router = createMemoryRouter([{ path: '/', element: <Dashboard /> }], { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    const allBtn = screen.getByRole('button', { name: /All Campaigns/i })
    const activeBtn = screen.getByRole('button', { name: /Active/i })
    expect(allBtn).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(activeBtn)
    expect(activeBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('exibe botão PREPARE NOW com aria-label acessível', () => {
    const router = createMemoryRouter([{ path: '/', element: <Dashboard /> }], { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    const prepBtn = screen.getAllByRole('button').find(el => el.getAttribute('aria-label') === 'Preparar sessão')!
    expect(prepBtn).toBeEnabled()
    expect(prepBtn).toHaveTextContent('PREPARE NOW')
    fireEvent.click(prepBtn)
  })
})
