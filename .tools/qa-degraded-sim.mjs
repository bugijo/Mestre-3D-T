import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { chromium } from 'playwright'

const host = process.env.QA_HOST || '127.0.0.1'
const port = Number(process.env.QA_PORT || 4173)
const basePath = (process.env.QA_BASE_PATH || '/Mestre-3D-T').replace(/\/+$/, '')
const baseUrl = `http://${host}:${port}${basePath}`
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const profiles = [
  { name: 'desktop-degraded', viewport: { width: 1366, height: 768 }, cpuRate: 4, latencyMs: 250, downBps: 120_000, upBps: 60_000 },
  { name: 'mobile-degraded', viewport: { width: 390, height: 844 }, cpuRate: 6, latencyMs: 350, downBps: 90_000, upBps: 40_000 },
]

function nowMs() {
  return performance.now()
}

function round2(value) {
  return Number(value.toFixed(2))
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
  child.stdout.on('data', (data) => process.stdout.write(`[preview] ${data}`))
  child.stderr.on('data', (data) => process.stderr.write(`[preview] ${data}`))
  return child
}

async function stopPreviewServer(child) {
  if (!child || child.killed) return
  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', shell: true })
      killer.on('close', () => resolve())
      killer.on('error', () => resolve())
    })
    return
  }
  child.kill('SIGTERM')
}

async function applyDegradation(context, page, profile) {
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: profile.latencyMs,
    downloadThroughput: profile.downBps,
    uploadThroughput: profile.upBps,
    connectionType: 'cellular3g',
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate })
}

async function measureStep(metrics, label, action, assertion) {
  const started = nowMs()
  await action()
  await assertion()
  metrics[label] = round2(nowMs() - started)
}

async function runProfile(browser, profile) {
  const context = await browser.newContext({ viewport: profile.viewport })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  const metrics = {
    profile: profile.name,
    initialLoadMs: 0,
    sessionStartMs: 0,
    addNoteMs: 0,
    startCombatMs: 0,
    nextTurnMs: 0,
    endCombatMs: 0,
    endSessionMs: 0,
    totalScenarioMs: 0,
  }

  const scenarioStart = nowMs()
  await applyDegradation(context, page, profile)

  await measureStep(
    metrics,
    'initialLoadMs',
    () => page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 45_000 }),
    () => page.getByText(/Centro de comando|Planejamento/i).first().waitFor({ timeout: 30_000 }),
  )

  await page.goto(`${baseUrl}/session`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.getByRole('button', { name: /Iniciar sessao com/i }).first().waitFor({ timeout: 30_000 })

  await measureStep(
    metrics,
    'sessionStartMs',
    () => page.getByRole('button', { name: /Iniciar sessao com/i }).first().click(),
    () => page.getByRole('button', { name: /Encerrar sessao/i }).first().waitFor({ timeout: 30_000 }),
  )

  const noteText = `QA degradado ${profile.name} ${Date.now()}`
  await measureStep(
    metrics,
    'addNoteMs',
    async () => {
      await page.getByPlaceholder('Adicionar nota...').fill(noteText)
      await page.getByRole('button', { name: /Adicionar nota/i }).click()
    },
    () => page.getByText(noteText).first().waitFor({ state: 'attached', timeout: 30_000 }),
  )

  await measureStep(
    metrics,
    'startCombatMs',
    () => page.getByRole('button', { name: /Iniciar combate/i }).click(),
    () => page.getByText(/Combate em Andamento/i).first().waitFor({ timeout: 30_000 }),
  )

  await measureStep(
    metrics,
    'nextTurnMs',
    () => page.getByRole('button', { name: /pr.*ximo turno/i }).click(),
    () => page.getByText(/Rodada/i).first().waitFor({ timeout: 30_000 }),
  )

  await measureStep(
    metrics,
    'endCombatMs',
    () => page.getByRole('button', { name: /Encerrar combate/i }).click(),
    () => page.getByRole('button', { name: /Iniciar combate/i }).waitFor({ timeout: 30_000 }),
  )

  await measureStep(
    metrics,
    'endSessionMs',
    async () => {
      await page.getByRole('button', { name: /Encerrar sessao/i }).first().click()
      const dialog = page.getByRole('alertdialog')
      await dialog.getByRole('button', { name: /Encerrar sessao/i }).click()
    },
    () => page.getByText(/Iniciar Sess/i).first().waitFor({ timeout: 30_000 }),
  )

  metrics.totalScenarioMs = round2(nowMs() - scenarioStart)

  await context.close()
  return { metrics, errors }
}

function summarizeResults(results) {
  const keys = ['initialLoadMs', 'sessionStartMs', 'addNoteMs', 'startCombatMs', 'nextTurnMs', 'endCombatMs', 'endSessionMs', 'totalScenarioMs']
  const summary = {}
  for (const key of keys) {
    const values = results.map((entry) => entry.metrics[key])
    const avg = values.reduce((acc, value) => acc + value, 0) / values.length
    summary[key] = round2(avg)
  }
  return summary
}

async function main() {
  await ensureBuildExists()
  const preview = startPreviewServer()
  try {
    await waitForServerReady(`${baseUrl}/`)
    const browser = await chromium.launch({ headless: true })
    try {
      const results = []
      for (const profile of profiles) {
        results.push(await runProfile(browser, profile))
      }
      const summary = summarizeResults(results)
      const allErrors = results.flatMap((entry) => entry.errors)

      console.info('[QA-DEGRADED] Resultados por perfil:')
      console.info(JSON.stringify(results.map((entry) => entry.metrics), null, 2))
      console.info('[QA-DEGRADED] Media geral:')
      console.info(JSON.stringify(summary, null, 2))

      if (allErrors.length > 0) {
        console.warn('[QA-DEGRADED] Erros de console/pageerror detectados:')
        console.warn(JSON.stringify(allErrors.slice(0, 10), null, 2))
      }
    } finally {
      await browser.close()
    }
  } finally {
    await stopPreviewServer(preview)
  }
}

main().catch((error) => {
  console.error('[QA-DEGRADED] Erro fatal:', error)
  process.exitCode = 1
})
