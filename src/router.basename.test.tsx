import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import App from '@/App'
import { Dashboard } from '@/components/Dashboard'

describe('Roteamento com basename', () => {
  it('resolve index em / com basename /', async () => {
    const router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
        </Route>
      ),
      {
        basename: '/',
        initialEntries: ['/'],
      }
    )
    render(<RouterProvider router={router} />)
    expect(screen.getAllByText('Mestre 3D&T').length).toBeGreaterThan(0)
  })

  it('resolve index em /Mestre-3D-T/ com basename /Mestre-3D-T/', async () => {
    const router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
        </Route>
      ),
      {
        basename: '/Mestre-3D-T/',
        initialEntries: ['/Mestre-3D-T/'],
      }
    )
    render(<RouterProvider router={router} />)
    expect(screen.getAllByText('Mestre 3D&T').length).toBeGreaterThan(0)
  })
})
