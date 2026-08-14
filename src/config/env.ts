/**
 * Client-side environment resolution.
 *
 * Works for web (same-origin or explicit env vars) and for the Capacitor
 * mobile builds, where the app is served from the device WebView and must
 * talk to the public backend over absolute URLs.
 */

/** Base URL of the Eumaeus API backend. Falls back to same-origin. */
export function apiBaseUrl(): string {
  const explicit = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  return window.location.origin
}

/** WebSocket URL of the backend. Falls back to same-origin /ws. */
export function wsUrl(): string {
  const explicit =
    (import.meta.env.VITE_WS_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_LAN_WS_URL as string | undefined)?.trim()
  if (explicit) return explicit
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}
