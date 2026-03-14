import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { chromium, firefox, webkit } from 'playwright'

const host = process.env.QA_HOST || '127.0.0.1'
const port = Number(process.env.QA_PORT || 4173)
const basePath = (process.env.QA_BASE_PATH || process.env.VITE_APP_BASE_PATH || '/').replace(/\/+$/, '')
const baseUrl = `http://${host}:${port}${basePath}`
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const routeChecks = [
  { route: '/', marker: /Centro de comando|Planejamento/i },
  { route: '/campaigns', marker: /Biblioteca de/i },
  { route: '/session', marker: /Iniciar Sess/i },
  { route: '/reports', marker: /Relatorios de Sessao/i },
  { route: '/player', marker: /sessao ainda nao foi iniciada|Nao ha personagens do tipo jogador/i },
  { route: '/admin', marker: /Inicializar acesso CEO|Entrar no painel admin|Painel Administrativo/i },
]

const availableViewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

const browserMap = {
  chromium,
  firefox,
  webkit,
}

function isBenignConsoleError(text) {
  const normalized = String(text || '')
  return (
    normalized.includes('InvalidStateError: An attempt was made to use an object that is not, or is no longer, usable') ||
    normalized.includes('downloadable font: download failed') ||
    normalized.includes('Failed to load resource: the server responded with a status of 404 (Not Found)')
  )
}

function isBenignPageError(text) {
  const normalized = String(text || '')
  return normalized.includes('SecurityError: The operation is insecure.')
}

function buildUrl(route) {
  if (!route || route === '/') return `${baseUrl}/`
  return `${baseUrl}${route}`
}

async function ensureBuildExists() {
  await access('dist/index.html')
}

async function waitForServerReady(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' })
      if (response.ok) return
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 600))
  }
  throw new Error(`Servidor de preview nao respondeu em ${timeoutMs}ms: ${url}`)
}

function startPreviewServer() {
  const child = spawn(npmCmd, ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    shell: true,
  })

  child.stdout.on('data', (data) => {
    process.stdout.write(`[preview] ${data}`)
  })
  child.stderr.on('data', (data) => {
    process.stderr.write(`[preview] ${data}`)
  })

  return child
}

async function stopPreviewServer(child) {
  if (!child || child.killed) return
  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        shell: true,
      })
      killer.on('close', () => resolve())
      killer.on('error', () => resolve())
    })
    return
  }
  child.kill('SIGTERM')
}

async function runSmokeForBrowser(browserName, browserType, viewports) {
  const browser = await browserType.launch({ headless: true })
  const failures = []
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport })
      const page = await context.newPage()
      const pageErrors = []
      const consoleErrors = []

      page.on('pageerror', (error) => {
        pageErrors.push(String(error))
      })
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      for (const check of routeChecks) {
        const url = buildUrl(check.route)
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
          await page.getByText(check.marker).first().waitFor({ timeout: 8_000 })
        } catch (error) {
          const bodyText = await page.locator('body').innerText().catch(() => '')
          failures.push({
            browser: browserName,
            viewport: viewport.name,
            route: check.route,
            reason: String(error),
            bodyText: bodyText.slice(0, 1200),
            pageErrors: [...pageErrors],
            consoleErrors: [...consoleErrors],
          })
          pageErrors.length = 0
          consoleErrors.length = 0
          continue
        }
        if (pageErrors.length > 0 || consoleErrors.length > 0) {
          const blockingPageErrors = pageErrors.filter((entry) => !isBenignPageError(entry))
          const blockingConsoleErrors = consoleErrors.filter((entry) => !isBenignConsoleError(entry))
          if (blockingConsoleErrors.length === 0 && blockingPageErrors.length === 0) {
            pageErrors.length = 0
            consoleErrors.length = 0
            continue
          }
          failures.push({
            browser: browserName,
            viewport: viewport.name,
            route: check.route,
            reason: 'Erros de console/pageerror detectados.',
            pageErrors: [...blockingPageErrors],
            consoleErrors: [...blockingConsoleErrors],
          })
          pageErrors.length = 0
          consoleErrors.length = 0
        }
      }

      await context.close()
    }
  } finally {
    await browser.close()
  }

  return failures
}

async function main() {
  await ensureBuildExists()

  const requestedBrowsers = (process.env.QA_BROWSERS || 'chromium,firefox,webkit')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  const requestedViewports = (process.env.QA_VIEWPORTS || 'desktop,mobile')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  const viewports = availableViewports.filter((entry) => requestedViewports.includes(entry.name))
  if (viewports.length === 0) {
    throw new Error(`Nenhum viewport valido informado em QA_VIEWPORTS=${process.env.QA_VIEWPORTS ?? ''}`)
  }

  const matrix = requestedBrowsers
    .map((name) => [name, browserMap[name]])
    .filter(([, engine]) => Boolean(engine))

  if (matrix.length === 0) {
    throw new Error(`Nenhum browser valido informado em QA_BROWSERS=${process.env.QA_BROWSERS ?? ''}`)
  }

  const preview = startPreviewServer()
  try {
    await waitForServerReady(`${baseUrl}/`)

    const failures = []
    for (const [name, browserType] of matrix) {
      const result = await runSmokeForBrowser(name, browserType, viewports)
      failures.push(...result)
    }

    if (failures.length > 0) {
      console.error('[QA-BROWSER] Falhas encontradas:')
      console.error(JSON.stringify(failures, null, 2))
      process.exitCode = 1
      return
    }

    console.info(
      `[QA-BROWSER] Smoke concluido com sucesso para browsers=${requestedBrowsers.join(',')} e viewports=${viewports.map((v) => v.name).join(',')}.`,
    )
  } finally {
    await stopPreviewServer(preview)
  }
}

main().catch((error) => {
  console.error('[QA-BROWSER] Erro fatal:', error)
  process.exitCode = 1
})
