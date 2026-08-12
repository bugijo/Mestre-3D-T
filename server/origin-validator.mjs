/**
 * origin-validator.mjs — Validate WebSocket / HTTP Origin headers
 *
 * LAN mode:  allow localhost, 127.0.0.1, ::1, *.local, and the bound host
 * ONLINE mode: allow origins listed in ALLOWED_ORIGINS env var, or '*' for any
 */

import { getConfig } from './app-config.mjs'

/**
 * @param {string|null|undefined} origin  — the Origin header value
 * @param {string}                 host    — the Host header value (used in LAN mode)
 * @param {string}                 [mode]  — 'lan' | 'online'; defaults to config.mode
 * @returns {boolean} true if the origin is allowed
 */
export function validateOrigin(origin, host, mode) {
  if (!origin) return true // no origin header = same-origin request

  const config = getConfig()
  const effectiveMode = mode || config.mode

  if (effectiveMode === 'online') {
    return validateOnlineOrigin(origin, config)
  }

  return validateLanOrigin(origin, host, config)
}

function validateOnlineOrigin(origin, config) {
  // '*' allows all origins (e.g. during development)
  if (config.allowedOrigins.includes('*')) return true

  try {
    const originUrl = new URL(origin)
    return config.allowedOrigins.some((allowed) => {
      // Exact match
      if (allowed === origin) return true
      // Match by origin (scheme + host, ignoring path)
      try {
        const allowedUrl = new URL(allowed)
        return allowedUrl.origin === originUrl.origin
      } catch {
        return allowed === origin
      }
    })
  } catch {
    return false
  }
}

function validateLanOrigin(origin, host, config) {
  try {
    const originUrl = new URL(origin)
    const allowedHosts = ['localhost', '127.0.0.1', '::1', config.host]
    return (
      allowedHosts.some((h) => originUrl.hostname === h) ||
      originUrl.hostname.endsWith('.local')
    )
  } catch {
    return false
  }
}