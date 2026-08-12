/**
 * app-config.mjs — Centralized server configuration
 *
 * Reads env vars and returns a config object. Used by all server modules.
 * No Vite / import.meta.env dependency — pure process.env for Node.js.
 */

export function getConfig() {
  const mode = process.env.APP_MODE || 'lan'
  const isOnline = mode === 'online'
  const port = Number(process.env.PORT || process.env.LAN_PORT || 4173)
  const host = process.env.LAN_HOST || '0.0.0.0'

  return {
    mode,
    port,
    host,
    publicUrl: process.env.PUBLIC_APP_URL || `http://localhost:${port}`,
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
    isOnline,
    nodeEnv: process.env.NODE_ENV || 'development',
  }
}