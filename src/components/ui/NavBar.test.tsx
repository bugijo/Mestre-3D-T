import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter, MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { NavBar } from './NavBar'

describe('NavBar', () => {
  const routes = [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <div>Dashboard</div> },
        { path: 'characters', element: <div>BestiarioPage</div> },
        { path: 'campaigns', element: <div>CampaignsPage</div> },
        { path: 'session', element: <div>SessionPage</div> },
        { path: 'reports', element: <div>ReportsPage</div> },
        { path: 'playground', element: <div>DevPage</div> },
      ],
    },
  ]

  it('renderiza itens principais', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/'],
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    })
    render(
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      />,
    )

    expect(screen.getByText('Mestre 3D&T')).toBeInTheDocument()
    const toggle = screen.getAllByRole('button').find((element) => element.getAttribute('aria-label') === 'Abrir menu')
    if (!toggle) throw new Error('Menu mobile nao encontrado')
    fireEvent.click(toggle)

    const links = screen.getAllByRole('link').map((element) => element.textContent?.trim())
    expect(links).toContain('Dashboard')
    expect(links).toContain('Campanhas')
    expect(links).toContain('Bestiario')
    expect(links).toContain('Relatorios')
    expect(links).toContain('Admin')
    expect(links).toContain('Jogar')
  })

  it('navega para Bestiario ao clicar', async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/'],
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    })
    render(
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      />,
    )

    const toggle = screen.getAllByRole('button').find((element) => element.getAttribute('aria-label') === 'Abrir menu')
    if (!toggle) throw new Error('Menu mobile nao encontrado')
    fireEvent.click(toggle)

    const bestiaryLink = screen.getAllByRole('link').find((element) => element.getAttribute('href') === '/characters')
    if (!bestiaryLink) throw new Error('Link do bestiario nao encontrado')
    fireEvent.click(bestiaryLink)

    expect(await screen.findByText('BestiarioPage')).toBeInTheDocument()
  })

  it('abre menu no mobile', () => {
    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <NavBar />
      </MemoryRouter>,
    )

    const toggle = screen.getAllByRole('button').find((element) => element.getAttribute('aria-label') === 'Abrir menu')
    if (!toggle) throw new Error('Menu mobile nao encontrado')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })
})
