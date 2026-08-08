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
        { path: 'studio', element: <div>StudioPage</div> },
        { path: 'story', element: <div>StoryPage</div> },
        { path: 'player', element: <div>PlayerPage</div> },
        { path: 'admin', element: <div>AdminPage</div> },
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

    expect(screen.getByText('Dungeon Keeper')).toBeInTheDocument()
    const toggle = screen.getAllByRole('button').find((element) => element.getAttribute('aria-label') === 'Abrir menu')
    if (!toggle) throw new Error('Menu mobile nao encontrado')
    fireEvent.click(toggle)

    const links = screen.getAllByRole('link').map((element) => element.textContent?.trim())
    expect(links).toContain('Dashboard')
    expect(links).toContain('Campanhas')
    expect(links).toContain('Personagens')
    expect(links).toContain('Estúdio')
    expect(links).toContain('História')
    expect(links).toContain('Jogar')
    expect(links).toContain('Relatorios')
    expect(links).toContain('Admin')
    expect(links).toContain('Jogador')
    expect(links).toContain('Dev')
  })

  it('navega para Personagens ao clicar', async () => {
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

    const charactersLink = screen.getAllByRole('link').find((element) => element.getAttribute('href') === '/characters')
    if (!charactersLink) throw new Error('Link de personagens nao encontrado')
    fireEvent.click(charactersLink)

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
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })
})
