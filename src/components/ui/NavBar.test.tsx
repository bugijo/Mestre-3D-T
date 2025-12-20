import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RouterProvider, createMemoryRouter, MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { NavBar } from './NavBar'

describe('NavBar', () => {
  const routes = [
    { path: '/', element: <App />, children: [
      { index: true, element: <div>Dashboard</div> },
      { path: 'characters', element: <div>BestiarioPage</div> },
      { path: 'campaigns', element: <div>CampaignsPage</div> },
      { path: 'session', element: <div>SessionPage</div> },
      { path: 'playground', element: <div>DevPage</div> },
    ] },
  ]

  it('renderiza itens principais', () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    expect(screen.getByText('Mestre 3D&T')).toBeInTheDocument()
    const toggle = screen.getAllByRole('button').find(el => el.getAttribute('aria-label') === 'Abrir menu')!
    fireEvent.click(toggle)
    const links = screen.getAllByRole('link').map(el => el.textContent?.trim())
    expect(links).toContain('Dashboard')
    expect(links).toContain('Campanhas')
    expect(links).toContain('Bestiário')
    expect(links).toContain('Jogar')
  })

  it('navega para Bestiário ao clicar', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    const toggle = screen.getAllByRole('button').find(el => el.getAttribute('aria-label') === 'Abrir menu')!
    fireEvent.click(toggle)
    const bestLink = screen.getAllByRole('link').find(el => el.getAttribute('href') === '/characters')!
    fireEvent.click(bestLink)
    expect(await screen.findByText('BestiarioPage')).toBeInTheDocument()
  })

  it('abre menu no mobile', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    )
    const toggle = screen.getAllByRole('button').find(el => el.getAttribute('aria-label') === 'Abrir menu')!
    fireEvent.click(toggle)
    // aguarda atualização de estado
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })
})
