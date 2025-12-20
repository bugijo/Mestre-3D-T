import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

vi.mock('@/store/AppStore', () => {
  const api = {
    state: { audio: { currentTrackUrl: null, volume: 0.5, isPlaying: false, isMuted: false } },
    playTrack: vi.fn(),
    pauseTrack: vi.fn(),
    resumeTrack: vi.fn(),
    stopTrack: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
  }
  return { useAppStore: () => api }
})

import { AudioPlayer } from './AudioPlayer'

describe('AudioPlayer', () => {
  it('desabilita botão de tocar quando não há URL', () => {
    const { container } = render(<AudioPlayer />)
    const playBtn = within(container).getByRole('button', { name: /Tocar|Pausar/i })
    expect(playBtn).toHaveAttribute('aria-disabled', 'true')
  })

  it('permite mutar/desmutar e alterar volume', () => {
    const { container } = render(<AudioPlayer />)
    const muteBtn = screen
      .getAllByRole('button')
      .find(el => {
        const name = el.getAttribute('aria-label') || ''
        return /Mutar|Desmutar/i.test(name)
      })!
    fireEvent.click(muteBtn)
    const slider = within(container).getByRole('slider', { name: 'Volume' })
    fireEvent.change(slider, { target: { value: '0.8' } })
    expect(muteBtn).toBeInTheDocument()
    expect(slider).toBeInTheDocument()
  })

  it('exibe controles de parar quando há faixa atual', async () => {
    vi.resetModules()
    vi.doMock('@/store/AppStore', () => {
      const api = {
        state: { audio: { currentTrackUrl: 'http://audio/test.mp3', volume: 0.5, isPlaying: true, isMuted: false } },
        playTrack: vi.fn(),
        pauseTrack: vi.fn(),
        resumeTrack: vi.fn(),
        stopTrack: vi.fn(),
        setVolume: vi.fn(),
        toggleMute: vi.fn(),
      }
      return { useAppStore: () => api }
    })
    const { AudioPlayer } = await import('./AudioPlayer')
    const { container, unmount } = render(<AudioPlayer />)
    expect(within(container).getByRole('button', { name: 'Parar' })).toBeInTheDocument()
    unmount()
  })
})
