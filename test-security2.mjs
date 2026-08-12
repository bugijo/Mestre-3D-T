import { WebSocket } from 'ws'

const PORT = 4175
const WS_URL = `ws://127.0.0.1:${PORT}/ws`

class TestClient {
  constructor(name) {
    this.name = name
    this.socket = null
    this.messages = []
    this.waiters = []
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(WS_URL)
      this.socket.on('open', () => resolve(this))
      this.socket.on('error', reject)
      this.socket.on('message', (raw) => {
        const msg = JSON.parse(String(raw))
        this.messages.push(msg)
        const idx = this.waiters.findIndex(w => w.predicate(msg))
        if (idx >= 0) {
          const [w] = this.waiters.splice(idx, 1)
          clearTimeout(w.timer)
          w.resolve(msg)
        }
      })
    })
  }

  send(msg) {
    this.socket.send(JSON.stringify(msg))
  }

  waitFor(predicate, timeout = 3000) {
    const idx = this.messages.findIndex(predicate)
    if (idx >= 0) return Promise.resolve(this.messages.splice(idx, 1)[0])
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const i = this.waiters.findIndex(w => w === waiter)
        if (i >= 0) this.waiters.splice(i, 1)
        reject(new Error(`${this.name}: timeout`))
      }, timeout)
      const waiter = { predicate, resolve, timer }
      this.waiters.push(waiter)
    })
  }

  close() { this.socket.close() }
}

async function runMoreTests() {
  console.log('=== ADDITIONAL SECURITY TESTS ===\n')
  
  const issues = []
  function report(severity, category, title, details, evidence, file) {
    issues.push({ severity, category, title, details, evidence, file })
    const icon = severity === 'BLOCKER' ? '🔴' : severity === 'CRITICAL' ? '🟠' : severity === 'HIGH' ? '🟡' : severity === 'MEDIUM' ? '🔵' : '🟢'
    console.log(`${icon} [${severity}] ${category}: ${title}`)
    console.log(`   ${details}`)
    console.log(`   Evidence: ${evidence}`)
    console.log(`   File: ${file}\n`)
  }

  // Test A: ActionId deduplication - check if it's a race condition or logic bug
  console.log('--- TEST A: ActionId deduplication detailed ---')
  const masterA = new TestClient('MasterA')
  await masterA.connect()
  masterA.send({ type: 'host:create', campaignId: 'test-A', campaignTitle: 'TestA', projection: { session: { isActive: true } } })
  const readyA = await masterA.waitFor(m => m.type === 'host:ready')
  const codeA = readyA.code
  
  const playerA = new TestClient('PlayerA')
  await playerA.connect()
  playerA.send({ type: 'player:join', code: codeA, playerName: 'PlayerA' })
  const sA = await playerA.waitFor(m => m.type === 'player:status')
  masterA.send({ type: 'participant:approve', participantId: sA.participant.id, approved: true, characterId: 'char-1' })
  await playerA.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await playerA.waitFor(m => m.type === 'session:resume')
  
  // Send two events with SAME actionId SEQUENTIALLY (not parallel)
  playerA.send({ type: 'event:send', actionId: 'seq-dup-test', event: { kind: 'dice', payload: { total: 1 }, audience: { kind: 'all' } } })
  await new Promise(r => setTimeout(r, 50)) // Small delay
  playerA.send({ type: 'event:send', actionId: 'seq-dup-test', event: { kind: 'dice', payload: { total: 2 }, audience: { kind: 'all' } } })
  
  const ack1 = await playerA.waitFor(m => m.type === 'event:ack' && m.actionId === 'seq-dup-test')
  const ack2 = await playerA.waitFor(m => m.type === 'event:ack' && m.actionId === 'seq-dup-test')
  console.log(`  ack1: ${JSON.stringify(ack1)}`)
  console.log(`  ack2: ${JSON.stringify(ack2)}`)
  
  if (!ack1.duplicate && ack2.duplicate) {
    console.log('  ✓ Sequential deduplication works')
  } else if (!ack1.duplicate && !ack2.duplicate) {
    report('HIGH', 'PROTOCOL', 'ActionId deduplication FAILS for sequential sends', 
      'Second event with same actionId should be rejected as duplicate',
      `Both returned duplicate=false`, 
      'app/server/lan-server.mjs:350-354')
  }

  // Test B: participant:approve from player - verify the server ignores it silently
  console.log('\n--- TEST B: participant:approve from player (detailed) ---')
  const masterB = new TestClient('MasterB')
  await masterB.connect()
  masterB.send({ type: 'host:create', campaignId: 'test-B', campaignTitle: 'TestB', projection: { session: { isActive: true } } })
  const readyB = await masterB.waitFor(m => m.type === 'host:ready')
  const codeB = readyB.code
  
  const playerB1 = new TestClient('PlayerB1')
  await playerB1.connect()
  playerB1.send({ type: 'player:join', code: codeB, playerName: 'PlayerB1' })
  const sB1 = await playerB1.waitFor(m => m.type === 'player:status')
  
  const playerB2 = new TestClient('PlayerB2')
  await playerB2.connect()
  playerB2.send({ type: 'player:join', code: codeB, playerName: 'PlayerB2' })
  const sB2 = await playerB2.waitFor(m => m.type === 'player:status')
  
  // PlayerB1 tries to approve PlayerB2
  playerB1.send({ type: 'participant:approve', participantId: sB2.participant.id, approved: true, characterId: 'char-1' })
  await new Promise(r => setTimeout(r, 200))
  
  // Check if PlayerB2 status changed
  const list = await masterB.waitFor(m => m.type === 'participant:list')
  const p2status = list.participants.find(p => p.id === sB2.participant.id)?.status
  console.log(`  PlayerB2 status after PlayerB1 approve attempt: ${p2status}`)
  
  if (p2status === 'pending') {
    console.log('  ✓ Server correctly ignored player approve (status still pending)')
    // But the server sent a player:status back to PlayerB1 - that's info leakage
    const playerB1Status = playerB1.messages.find(m => m.type === 'player:status' && m.participant.id === sB1.participant.id)
    console.log(`  PlayerB1 got status response: ${JSON.stringify(playerB1Status)}`)
    report('MEDIUM', 'AUTHORIZATION', 'Server responds to unauthorized participant:approve', 
      'Server sends player:status back to unauthorized sender, leaking participant info',
      `PlayerB1 received: ${JSON.stringify(playerB1Status)}`, 
      'app/server/lan-server.mjs:307-322')
  } else {
    report('CRITICAL', 'AUTHORIZATION', 'Player can approve other players', 
      'participant:approve from non-master changed participant status',
      `PlayerB2 status: ${p2status}`, 
      'app/server/lan-server.mjs:307-322')
  }

  // Test C: Master token reuse - can a player use master token to create NEW session?
  console.log('\n--- TEST C: Master token reuse for new session ---')
  const masterC = new TestClient('MasterC')
  await masterC.connect()
  masterC.send({ type: 'host:create', campaignId: 'test-C', campaignTitle: 'TestC', projection: { session: { isActive: true } } })
  const readyC = await masterC.waitFor(m => m.type === 'host:ready')
  const masterTokenC = readyC.masterToken
  
  const attackerC = new TestClient('AttackerC')
  await attackerC.connect()
  // Try to create NEW session with stolen master token (not resume)
  attackerC.send({ type: 'host:create', campaignId: 'stolen', campaignTitle: 'Stolen', projection: { session: { isActive: true } }, resumeToken: masterTokenC })
  const respC = await attackerC.waitFor(m => m.type === 'host:ready' || m.type === 'error')
  console.log(`  Response: ${JSON.stringify(respC)}`)
  
  if (respC.type === 'host:ready' && respC.resumed === false) {
    report('CRITICAL', 'AUTHORIZATION', 'Stolen master token allows creating new sessions', 
      'resumeToken parameter accepted for new session creation',
      `New session code: ${respC.code}`, 
      'app/server/lan-server.mjs:228-237')
  } else if (respC.type === 'host:ready' && respC.resumed === true) {
    report('HIGH', 'AUTHORIZATION', 'Stolen master token resumes existing session', 
      'Attacker can take over master session with token',
      `Resumed session: ${respC.code}`, 
      'app/server/lan-server.mjs:228-237')
  } else {
    console.log('  ✓ Server rejected stolen token for new session')
  }

  // Test D: Join with invalid/empty code
  console.log('\n--- TEST D: Join with invalid codes ---')
  const playerD = new TestClient('PlayerD')
  await playerD.connect()
  playerD.send({ type: 'player:join', code: '', playerName: 'Test' })
  const respD1 = await playerD.waitFor(m => m.type === 'error' || m.type === 'player:status', 1000).catch(() => null)
  console.log(`  Empty code: ${JSON.stringify(respD1)}`)
  
  playerD.send({ type: 'player:join', code: 'INVALID', playerName: 'Test' })
  const respD2 = await playerD.waitFor(m => m.type === 'error' || m.type === 'player:status', 1000).catch(() => null)
  console.log(`  Invalid code: ${JSON.stringify(respD2)}`)
  
  playerD.send({ type: 'player:join', code: 'AAAAAA', playerName: 'Test' })
  const respD3 = await playerD.waitFor(m => m.type === 'error' || m.type === 'player:status', 1000).catch(() => null)
  console.log(`  Non-existent code: ${JSON.stringify(respD3)}`)

  // Test E: Event with invalid audience
  console.log('\n--- TEST E: Event with malformed audience ---')
  const masterE = new TestClient('MasterE')
  await masterE.connect()
  masterE.send({ type: 'host:create', campaignId: 'test-E', campaignTitle: 'TestE', projection: { session: { isActive: true } } })
  const readyE = await masterE.waitFor(m => m.type === 'host:ready')
  const codeE = readyE.code
  
  const playerE = new TestClient('PlayerE')
  await playerE.connect()
  playerE.send({ type: 'player:join', code: codeE, playerName: 'PlayerE' })
  const sE = await playerE.waitFor(m => m.type === 'player:status')
  masterE.send({ type: 'participant:approve', participantId: sE.participant.id, approved: true, characterId: 'char-1' })
  await playerE.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await playerE.waitFor(m => m.type === 'session:resume')
  
  // Send event with invalid audience
  playerE.send({ type: 'event:send', actionId: 'bad-audience', event: { kind: 'dice', payload: { total: 1 }, audience: { kind: 'invalid' } } })
  const respE = await playerE.waitFor(m => m.type === 'event:ack' || m.type === 'error', 1000).catch(() => null)
  console.log(`  Invalid audience response: ${JSON.stringify(respE)}`)
  
  // Send event with audience.participants but not array
  playerE.send({ type: 'event:send', actionId: 'bad-audience2', event: { kind: 'dice', payload: { total: 1 }, audience: { kind: 'participants', participantIds: 'not-array' } } })
  const respE2 = await playerE.waitFor(m => m.type === 'event:ack' || m.type === 'error', 1000).catch(() => null)
  console.log(`  Malformed participants response: ${JSON.stringify(respE2)}`)

  // Test F: Session:end from player
  console.log('\n--- TEST F: session:end from player ---')
  const masterF = new TestClient('MasterF')
  await masterF.connect()
  masterF.send({ type: 'host:create', campaignId: 'test-F', campaignTitle: 'TestF', projection: { session: { isActive: true } } })
  const readyF = await masterF.waitFor(m => m.type === 'host:ready')
  const codeF = readyF.code
  
  const playerF = new TestClient('PlayerF')
  await playerF.connect()
  playerF.send({ type: 'player:join', code: codeF, playerName: 'PlayerF' })
  const sF = await playerF.waitFor(m => m.type === 'player:status')
  masterF.send({ type: 'participant:approve', participantId: sF.participant.id, approved: true, characterId: 'char-1' })
  await playerF.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await playerF.waitFor(m => m.type === 'session:resume')
  
  // Player tries to end session
  playerF.send({ type: 'session:end' })
  await new Promise(r => setTimeout(r, 200))
  const ended = masterF.messages.find(m => m.type === 'session:ended')
  console.log(`  Session ended by player: ${!!ended}`)
  if (ended) {
    report('HIGH', 'AUTHORIZATION', 'Player can end session', 
      'session:end not guarded by isMaster check',
      'Player sent session:end and session ended', 
      'app/server/lan-server.mjs:384-390')
  } else {
    console.log('  ✓ Server correctly ignored session:end from player')
  }

  // Test G: stage:present from player
  console.log('\n--- TEST G: stage:present from player ---')
  const masterG = new TestClient('MasterG')
  await masterG.connect()
  masterG.send({ type: 'host:create', campaignId: 'test-G', campaignTitle: 'TestG', projection: { session: { isActive: true } } })
  const readyG = await masterG.waitFor(m => m.type === 'host:ready')
  const codeG = readyG.code
  
  const playerG = new TestClient('PlayerG')
  await playerG.connect()
  playerG.send({ type: 'player:join', code: codeG, playerName: 'PlayerG' })
  const sG = await playerG.waitFor(m => m.type === 'player:status')
  masterG.send({ type: 'participant:approve', participantId: sG.participant.id, approved: true, characterId: 'char-1' })
  await playerG.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await playerG.waitFor(m => m.type === 'session:resume')
  
  // Player tries to present stage
  playerG.send({ type: 'stage:present', stage: { id: 'player-stage', kind: 'message', title: 'Hacked', body: 'Player presenting', transition: 'reveal', audience: { kind: 'all' } } })
  await new Promise(r => setTimeout(r, 200))
  const stageUpdate = masterG.messages.find(m => m.type === 'stage:update' && m.stage?.id === 'player-stage')
  console.log(`  Stage presented by player received by master: ${!!stageUpdate}`)
  if (stageUpdate) {
    report('HIGH', 'AUTHORIZATION', 'Player can present stage', 
      'stage:present not guarded by isMaster check',
      'Player stage appeared on master', 
      'app/server/lan-server.mjs:334-346')
  } else {
    console.log('  ✓ Server correctly ignored stage:present from player')
  }

  // Test H: session:state from player
  console.log('\n--- TEST H: session:state from player ---')
  const masterH = new TestClient('MasterH')
  await masterH.connect()
  masterH.send({ type: 'host:create', campaignId: 'test-H', campaignTitle: 'TestH', projection: { session: { isActive: true } } })
  const readyH = await masterH.waitFor(m => m.type === 'host:ready')
  const codeH = readyH.code
  
  const playerH = new TestClient('PlayerH')
  await playerH.connect()
  playerH.send({ type: 'player:join', code: codeH, playerName: 'PlayerH' })
  const sH = await playerH.waitFor(m => m.type === 'player:status')
  masterH.send({ type: 'participant:approve', participantId: sH.participant.id, approved: true, characterId: 'char-1' })
  await playerH.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await playerH.waitFor(m => m.type === 'session:resume')
  
  // Player tries to send session:state
  playerH.send({ type: 'session:state', projection: { hacked: true } })
  await new Promise(r => setTimeout(r, 200))
  const stateUpdate = masterH.messages.find(m => m.type === 'session:state' && m.projection?.hacked)
  console.log(`  Session state from player received by master: ${!!stateUpdate}`)
  if (stateUpdate) {
    report('HIGH', 'AUTHORIZATION', 'Player can send session:state', 
      'session:state not guarded by isMaster check',
      'Player projection appeared on master', 
      'app/server/lan-server.mjs:325-332')
  } else {
    console.log('  ✓ Server correctly ignored session:state from player')
  }

  // Test I: Reconnection with expired session
  console.log('\n--- TEST I: Reconnection after session ended ---')
  const masterI = new TestClient('MasterI')
  await masterI.connect()
  masterI.send({ type: 'host:create', campaignId: 'test-I', campaignTitle: 'TestI', projection: { session: { isActive: true } } })
  const readyI = await masterI.waitFor(m => m.type === 'host:ready')
  const codeI = readyI.code
  
  const playerI = new TestClient('PlayerI')
  await playerI.connect()
  playerI.send({ type: 'player:join', code: codeI, playerName: 'PlayerI' })
  const sI = await playerI.waitFor(m => m.type === 'player:status')
  const tokenI = sI.participant.reconnectToken
  masterI.send({ type: 'participant:approve', participantId: sI.participant.id, approved: true, characterId: 'char-1' })
  await playerI.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await playerI.waitFor(m => m.type === 'session:resume')
  
  // End session
  masterI.send({ type: 'session:end' })
  const endedI = await playerI.waitFor(m => m.type === 'session:ended')
  console.log(`  Session ended: ${JSON.stringify(endedI)}`)
  
  // Try to reconnect after session ended
  playerI.close()
  await new Promise(r => setTimeout(r, 100))
  const playerIre = new TestClient('PlayerIre')
  await playerIre.connect()
  playerIre.send({ type: 'player:join', code: codeI, playerName: 'PlayerI', reconnectToken: tokenI })
  const respIre = await playerIre.waitFor(m => m.type === 'session:resume' || m.type === 'error' || m.type === 'player:status', 2000).catch(() => null)
  console.log(`  Reconnect after end: ${JSON.stringify(respIre)}`)

  // Test J: Large payload DoS test
  console.log('\n--- TEST J: Large payload ---')
  const masterJ = new TestClient('MasterJ')
  await masterJ.connect()
  masterJ.send({ type: 'host:create', campaignId: 'test-J', campaignTitle: 'TestJ', projection: { session: { isActive: true } } })
  const readyJ = await masterJ.waitFor(m => m.type === 'host:ready')
  const codeJ = readyJ.code
  
  const playerJ = new TestClient('PlayerJ')
  await playerJ.connect()
  playerJ.send({ type: 'player:join', code: codeJ, playerName: 'PlayerJ' })
  const sJ = await playerJ.waitFor(m => m.type === 'player:status')
  masterJ.send({ type: 'participant:approve', participantId: sJ.participant.id, approved: true, characterId: 'char-1' })
  await playerJ.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await playerJ.waitFor(m => m.type === 'session:resume')
  
  // Send large payload (1MB)
  const largePayload = 'x'.repeat(1024 * 1024)
  playerJ.send({ type: 'event:send', actionId: 'large-payload', event: { kind: 'dice', payload: { data: largePayload }, audience: { kind: 'all' } } })
  const respJ = await playerJ.waitFor(m => m.type === 'event:ack' || m.type === 'error', 5000).catch(() => null)
  console.log(`  Large payload response: ${JSON.stringify(respJ)}`)

  // Test K: Event ordering - out of order delivery
  console.log('\n--- TEST K: Sequence number ordering ---')
  const masterK = new TestClient('MasterK')
  await masterK.connect()
  masterK.send({ type: 'host:create', campaignId: 'test-K', campaignTitle: 'TestK', projection: { session: { isActive: true } } })
  const readyK = await masterK.waitFor(m => m.type === 'host:ready')
  const codeK = readyK.code
  
  const playerK1 = new TestClient('PlayerK1')
  await playerK1.connect()
  playerK1.send({ type: 'player:join', code: codeK, playerName: 'PlayerK1' })
  const sK1 = await playerK1.waitFor(m => m.type === 'player:status')
  
  const playerK2 = new TestClient('PlayerK2')
  await playerK2.connect()
  playerK2.send({ type: 'player:join', code: codeK, playerName: 'PlayerK2' })
  const sK2 = await playerK2.waitFor(m => m.type === 'player:status')
  
  masterK.send({ type: 'participant:approve', participantId: sK1.participant.id, approved: true, characterId: 'char-1' })
  masterK.send({ type: 'participant:approve', participantId: sK2.participant.id, approved: true, characterId: 'char-2' })
  await playerK1.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await playerK2.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await playerK1.waitFor(m => m.type === 'session:resume')
  await playerK2.waitFor(m => m.type === 'session:resume')
  
  // Send multiple events rapidly
  for (let i = 0; i < 5; i++) {
    playerK1.send({ type: 'event:send', actionId: `seq-${i}`, event: { kind: 'dice', payload: { total: i }, audience: { kind: 'all' } } })
  }
  
  const events = []
  for (let i = 0; i < 5; i++) {
    const ev = await masterK.waitFor(m => m.type === 'event:new' && m.event.actionId === `seq-${i}`)
    events.push(ev)
  }
  console.log('  Sequence numbers:', events.map(e => e.seq).join(', '))
  const ordered = events.every((e, i) => i === 0 || e.seq > events[i-1].seq)
  console.log(`  Strictly increasing: ${ordered}`)

  // Summary
  console.log('\n=== ADDITIONAL TEST SUMMARY ===')
  const bySeverity = { BLOCKER: 0, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  for (const i of issues) bySeverity[i.severity]++
  console.log(`BLOCKER: ${bySeverity.BLOCKER}`)
  console.log(`CRITICAL: ${bySeverity.CRITICAL}`)
  console.log(`HIGH: ${bySeverity.HIGH}`)
  console.log(`MEDIUM: ${bySeverity.MEDIUM}`)
  console.log(`LOW: ${bySeverity.LOW}`)
  console.log(`TOTAL: ${issues.length}`)
}

runMoreTests().catch(console.error)
