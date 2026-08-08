import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

function normalizeBasePath(value?: string) {
  const raw = (value || '/').trim()
  if (!raw || raw === '/') return '/'
  return `/${raw.replace(/^\/+|\/+$/g, '')}/`
}

function resolveDefaultBasePath(explicitBase?: string) {
  if (explicitBase) {
    return explicitBase
  }

  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const [, repoName] = process.env.GITHUB_REPOSITORY.split('/')
    if (repoName) {
      return `/${repoName}/`
    }
  }

  return '/'
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = normalizeBasePath(resolveDefaultBasePath(env.VITE_APP_BASE_PATH))

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['dossier-mark.svg'],
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: 'Dungeon Keeper — Mesa Presencial',
          short_name: 'Dungeon Keeper',
          description: 'Dossiê digital para sessões presenciais de RPG.',
          theme_color: '#11100f',
          background_color: '#11100f',
          display: 'standalone',
          icons: [
            {
              src: 'dossier-mark.svg',
              sizes: 'any',
              type: 'image/svg+xml',
            },
            {
              src: 'dossier-mark.svg',
              sizes: 'any',
              type: 'image/svg+xml',
            },
          ],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      exclude: ['.agent/**', 'node_modules/**', 'dist/**'],
      maxWorkers: 2,
      minWorkers: 1,
      coverage: {
        provider: 'v8',
        reportsDirectory: 'coverage',
        reporter: ['text', 'lcov', 'html'],
        include: [
          'src/admin/AdminAccessContext.tsx',
          'src/lib/adminSecurity.ts',
          'src/lib/db.ts',
          'src/lib/logger.ts',
          'src/lib/sessionReports.ts',
          'src/lib/snapshot.ts',
        ],
        exclude: ['src/test/**'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 65,
          statements: 80,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      allowedHosts: true,
    },
    preview: {
      allowedHosts: true,
    },
  }
})
