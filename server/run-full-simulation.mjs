/**
 * RUNNER — Orquestra Master + 4 Players com session code dinâmico
 */

import { spawn } from 'node:child_process'

async function runSimulation() {
  console.log('═══════════════════════════════════════════')
  console.log('  VIRTUAL TABLE — Full Simulation Runner')
  console.log('═══════════════════════════════════════════\n')

  // 1. Start master and capture session code
  console.log('🚀 Iniciando MASTER-SIM...')
  const master = spawn('node', ['server/virtual-table-master-sim.mjs'], {
    cwd: '/media/giovanni/HD/Projetos/RPG/app',
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let sessionCode = null
  let masterOutput = ''

  master.stdout.on('data', (data) => {
    const output = data.toString()
    masterOutput += output
    process.stdout.write(`[MASTER] ${output}`)
    
    // Extract session code
    const match = output.match(/Código da sessão para jogadores: (\w+)/)
    if (match) {
      sessionCode = match[1]
      console.log(`\n📋 Session code captured: ${sessionCode}\n`)
    }
  })

  master.stderr.on('data', (data) => {
    process.stderr.write(`[MASTER] ${data}`)
  })

  // Wait for session code (max 15 seconds)
  console.log('⏳ Aguardando session code...')
  for (let i = 0; i < 30 && !sessionCode; i++) {
    await new Promise(r => setTimeout(r, 500))
  }

  if (!sessionCode) {
    console.log('❌ Não conseguiu obter session code do master')
    master.kill()
    process.exit(1)
  }

  // 2. Start 4 players with the session code
  console.log(`\n🚀 Iniciando 4 PLAYERS com session code: ${sessionCode}\n`)
  
  const playerScripts = [
    'server/virtual-table-player-1-sim.mjs',
    'server/virtual-table-player-2-sim.mjs',
    'server/virtual-table-player-3-sim.mjs',
    'server/virtual-table-player-4-sim.mjs'
  ]

  const playerProcs = []
  for (const script of playerScripts) {
    const proc = spawn('node', [script], {
      cwd: '/media/giovanni/HD/Projetos/RPG/app',
      env: { ...process.env, SESSION_CODE: sessionCode },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    
    const name = script.match(/player-(\d)/)[1]
    proc.stdout.on('data', (data) => {
      process.stdout.write(`[PLAYER-${name}] ${data}`)
    })
    proc.stderr.on('data', (data) => {
      process.stderr.write(`[PLAYER-${name}] ${data}`)
    })
    playerProcs.push({ name: `PLAYER-${name}`, proc })
    
    await new Promise(r => setTimeout(r, 500)) // Stagger starts
  }

  // 3. Wait for all to complete
  console.log('\n⏳ Aguardando conclusão da simulação (timeout 180s)...\n')
  
  const allProcs = [{ name: 'MASTER', proc: master }, ...playerProcs]
  
  await Promise.all(allProcs.map(p => new Promise(resolve => {
    const timeout = setTimeout(() => {
      console.log(`\n⏰ [${p.name}] Timeout (180s), matando...`)
      p.proc.kill()
      resolve()
    }, 180000)
    p.proc.on('exit', (code) => {
      clearTimeout(timeout)
      console.log(`\n✅ [${p.name}] Finalizado com código ${code}`)
      resolve()
    })
    p.proc.on('error', (err) => {
      clearTimeout(timeout)
      console.log(`\n❌ [${p.name}] Erro: ${err.message}`)
      resolve()
    })
  })))

  console.log('\n═══════════════════════════════════════════')
  console.log('  SIMULAÇÃO COMPLETA')
  console.log('═══════════════════════════════════════════\n')
}

runSimulation().catch(console.error)