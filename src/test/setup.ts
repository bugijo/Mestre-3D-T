import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

const gradientMock = () => ({
  addColorStop: vi.fn(),
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    setTransform: vi.fn(),
    createImageData: vi.fn((w = 1, h = 1) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h })),
    putImageData: vi.fn(),
    createRadialGradient: vi.fn(() => gradientMock()),
    createLinearGradient: vi.fn(() => gradientMock()),
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'round',
    font: '12px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
  })),
})

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  configurable: true,
  value: vi.fn(() => 'data:image/png;base64,AAA'),
})

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
})

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: class {
    observe() {}
    disconnect() {}
    unobserve() {}
  },
})

Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock'),
})

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
})

Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})
