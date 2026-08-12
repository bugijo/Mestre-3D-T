/**
 * VIRTUAL TABLE — Full Simulation Runner
 * Runs Master + 4 Players simultaneously
 */

import { spawn } from 'node:child_process'

const SCRIPTS = [
  { name: 'MASTER', file: 'virtual-table-master-sim.mjs', env: {} },
  { name: 'PLAYER-1', file: 'virtual-table-player-1-sim.mjs', env: { ROLE: 'player-1' } },
  { name: 'PLAYER-2', file: 'virtual-table-player-2-sim.mjs', env: { ROLE: 'player-2' } },
  { name: 'PLAYER-3', file: 'virtual-table-player-3-sim.mjs', env: { ROLE: 'player-3' } },
  { name: 'PLAYER-4', file: 'virtual-table-player-4-sim.mjs', env: { ROLE: 'player-4' } },
]

async function runSimulation() {
  console.log('═══════════════════════════════════════════')
  console.log('  VIRTUAL TABLE — Full Simulation')
  console.log('═══════════════════════════════════════════\n')

  const processes = []
  let sessionCode = null
  let masterReady = false

  for (const script of SCRIPTS) {
    const proc = spawn('node', [`server/${script.file}`], {
      cwd: '/media/giovanni/HD/Projetos/RPG/app',
      env: { ...process.env, ...script.env },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    proc.stdout.on('data', (data) => {
      const output = data.toString()
      process.stdout.write(`[${script.name}] ${output}`)
      
      // Capture session code from master
      if (script.name === 'MASTER' && output.includes('CÓDIGO DA SESSÃO:')) {
        const match = output.match(/CÓDIGO DA SESSÃO: (\w+)/)
        if (match) {
          sessionCode = match[1]
          console.log(`\n📋 Captured session code: ${sessionCode}\n`)
        }
      }
      
      if (script.name === 'MASTER' && output.includes('Todos os 4 jogadores aprovados')) {
        masterReady = true
        console.log('\n✅ Master ready, players can proceed\n')
      }
    })

    proc.stderr.on('data', (data) => {
      process.stderr.write(`[${script.name}] ${data}`)
    })

    proc.on('exit', (code) => {
      console.log(`\n[${script.name}] exited with code ${code}`)
    })

    processes.push({ name: script.name, proc })
    
    // Stagger starts
    await new Promise(r => setTimeout(r, 1000))
  }

  // Wait for master to create session and get code
  console.log('\n⏳ Waiting for session code...')
  for (let i = 0; i < 30 && !sessionCode; i++) {
    await new Promise(r => setTimeout(r, 1000))
  }

  if (!sessionCode) {
    console.log('❌ No session code captured')
    for (const p of processes) p.proc.kill()
    process.exit(1)
  }

  // Update player env with session code
  console.log(`\n📋 Session code: ${sessionCode}`)
  console.log('Restarting players with session code...\n')
  
  // Kill players and restart with session code
  for (const p of processes) {
    if (p.name !== 'MASTER') p.proc.kill()
  }
  
  await new Promise(r => setTimeout(r, 1000))

  // Restart players with session code
  const playerScripts = SCRIPTS.filter(s => s.name !== 'MASTER')
  const playerProcesses = []
  
  for (const script of playerScripts) {
    const proc = spawn('node', [`server/${script.file}`], {
      cwd: '/media/giovanni/HD/Projetos/RPG/app',
      env: { ...process.env, SESSION_CODE: sessionCode },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    proc.stdout.on('data', (data) => {
      process.stdout.write(`[${script.name}] ${data}`)
    })

    proc.stderr.on('data', (data) => {
      process.stderr.write(`[${script.name}] ${data}`)
    })

    playerProcesses.push({ name: script.name, proc })
    
    await new Promise(r => setTimeout(r, 500))
  }

  // Wait for completion
  console.log('\n⏳ Running simulation... (timeout 180s)\n')
  
  const allProcs = [...processes.filter(p => p.name === 'MASTER'), ...playerProcesses]
  
  await Promise.all(allProcs.map(p => new Promise(resolve => {
    const timeout = setTimeout(() => {
      console.log(`\n[${p.name}] Timeout, killing...`)
      p.proc.kill()
      resolve()
    }, 180000)
    p.proc.on('exit', () => {
      clearTimeout(timeout)
      resolve()
    })
  })))

  console.log('\n✅ Simulation complete')
}

runSimulation().catch(console.error)