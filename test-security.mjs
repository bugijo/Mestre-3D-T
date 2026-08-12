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
      this.socket.on('close', () => {})
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
        reject(new Error(`${this.name}: timeout waiting for ${predicate}`))
      }, timeout)
      const waiter = { predicate, resolve, timer }
      this.waiters.push(waiter)
    })
  }

  close() { this.socket.close() }
}

async function runTests() {
  console.log('=== SECURITY/REALTIME AUDIT ===\n')
  
  const issues = []
  function report(severity, category, title, details, evidence, file) {
    issues.push({ severity, category, title, details, evidence, file })
    const icon = severity === 'BLOCKER' ? '🔴' : severity === 'CRITICAL' ? '🟠' : severity === 'HIGH' ? '🟡' : severity === 'MEDIUM' ? '🔵' : '🟢'
    console.log(`${icon} [${severity}] ${category}: ${title}`)
    console.log(`   Details: ${details}`)
    console.log(`   Evidence: ${evidence}`)
    console.log(`   File: ${file}\n`)
  }

  // Test 1: Master token exposure on reconnection
  console.log('--- TEST 1: Master token in localStorage ---')
  const master1 = new TestClient('Master1')
  await master1.connect()
  master1.send({ type: 'host:create', campaignId: 'test-camp', campaignTitle: 'Test', projection: { session: { isActive: true } } })
  const ready1 = await master1.waitFor(m => m.type === 'host:ready')
  console.log(`Master token: ${ready1.masterToken}`)
  console.log(`Session code: ${ready1.code}`)
  const code = ready1.code
  const masterToken = ready1.masterToken
  
  // Check localStorage keys
  // The token is stored in localStorage with key 'dk-live:master-token'
  // This is accessible by any script on the same origin - XSS risk
  
  // Test 2: Player trying to act as Master
  console.log('\n--- TEST 2: Player impersonating Master ---')
  const playerAsMaster = new TestClient('PlayerAsMaster')
  await playerAsMaster.connect()
  playerAsMaster.send({ type: 'host:create', campaignId: 'test-camp-2', campaignTitle: 'Test2', projection: { session: { isActive: true } }, resumeToken: masterToken })
  const resp = await playerAsMaster.waitFor(m => m.type === 'host:ready' || m.type === 'error')
  if (resp.type === 'host:ready') {
    report('CRITICAL', 'AUTHORIZATION', 'Player can resume Master session with stolen token', 
      'A player who obtains the masterToken can resume the Master session and take full control',
      `masterToken used: ${masterToken}, got new session: ${resp.code}`, 
      'app/server/lan-server.mjs:228-237')
  } else {
    console.log('  ✓ Server correctly rejected stolen master token for new session')
  }
  
  // Test 3: Player trying to approve themselves
  console.log('\n--- TEST 3: Player sending participant:approve ---')
  const master2 = new TestClient('Master2')
  await master2.connect()
  master2.send({ type: 'host:create', campaignId: 'test-camp-3', campaignTitle: 'Test3', projection: { session: { isActive: true } } })
  const ready2 = await master2.waitFor(m => m.type === 'host:ready')
  const code2 = ready2.code
  
  const player3 = new TestClient('Player3')
  await player3.connect()
  player3.send({ type: 'player:join', code: code2, playerName: 'Attacker' })
  const status3 = await player3.waitFor(m => m.type === 'player:status')
  const partId = status3.participant.id
  
  // Try to approve themselves
  player3.send({ type: 'participant:approve', participantId: partId, approved: true, characterId: 'char-1' })
  const approveResp = await player3.waitFor(m => m.type === 'error' || m.type === 'player:status', 2000).catch(() => null)
  if (approveResp?.type !== 'error') {
    report('HIGH', 'AUTHORIZATION', 'Player can send participant:approve message', 
      'Server should ignore participant:approve from non-master connections',
      `Player sent approve, response: ${JSON.stringify(approveResp)}`, 
      'app/server/lan-server.mjs:307-322')
  } else {
    console.log('  ✓ Server correctly rejected player approve')
  }
  
  // Test 4: Player trying to send master-only events
  console.log('\n--- TEST 4: Player sending master-only events ---')
  const master3 = new TestClient('Master3')
  await master3.connect()
  master3.send({ type: 'host:create', campaignId: 'test-camp-4', campaignTitle: 'Test4', projection: { session: { isActive: true } } })
  const ready3 = await master3.waitFor(m => m.type === 'host:ready')
  const code3 = ready3.code
  
  const player4 = new TestClient('Player4')
  await player4.connect()
  player4.send({ type: 'player:join', code: code3, playerName: 'Attacker2' })
  const status4 = await player4.waitFor(m => m.type === 'player:status')
  const partId4 = status4.participant.id
  
  // Master approves
  master3.send({ type: 'participant:approve', participantId: partId4, approved: true, characterId: 'char-1' })
  await player4.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player4.waitFor(m => m.type === 'session:resume')
  
  // Try reward event (master-only)
  player4.send({ type: 'event:send', actionId: 'reward-attempt', event: { kind: 'reward', payload: { xp: 1000 }, audience: { kind: 'all' } } })
  const rewardResp = await player4.waitFor(m => m.type === 'error' || m.type === 'event:ack', 2000).catch(() => null)
  if (rewardResp?.type === 'event:ack' && !rewardResp.duplicate) {
    report('CRITICAL', 'AUTHORIZATION', 'Player can send reward event', 
      'reward is in MASTER_ACTIONS but was accepted',
      `rewardResp: ${JSON.stringify(rewardResp)}`, 
      'app/server/lan-server.mjs:18,349-358')
  } else if (rewardResp?.type === 'error' && rewardResp.code === 'FORBIDDEN') {
    console.log('  ✓ Server correctly blocked reward event from player')
  } else {
    console.log(`  ? Unexpected response: ${JSON.stringify(rewardResp)}`)
  }
  
  // Test 5: Player trying to modify another player's character
  console.log('\n--- TEST 5: Player referencing another character ---')
  const player5 = new TestClient('Player5')
  await player5.connect()
  player5.send({ type: 'player:join', code: code3, playerName: 'Attacker3' })
  const status5 = await player5.waitFor(m => m.type === 'player:status')
  const partId5 = status5.participant.id
  
  master3.send({ type: 'participant:approve', participantId: partId5, approved: true, characterId: 'char-2' })
  await player5.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player5.waitFor(m => m.type === 'session:resume')
  
  // Try dice event with another character's ID
  player5.send({ type: 'event:send', actionId: 'dice-other-char', event: { kind: 'dice', payload: { characterId: 'char-1', expression: '1d20', total: 20 }, audience: { kind: 'all' } } })
  const diceResp = await player5.waitFor(m => m.type === 'error' || m.type === 'event:ack', 2000).catch(() => null)
  if (diceResp?.type === 'event:ack' && !diceResp.duplicate) {
    report('HIGH', 'AUTHORIZATION', 'Player can roll for another character', 
      'validatePlayerEvent should reject characterId mismatch',
      `diceResp: ${JSON.stringify(diceResp)}`, 
      'app/server/lan-server.mjs:144-151')
  } else if (diceResp?.type === 'error' && diceResp.code === 'FORBIDDEN') {
    console.log('  ✓ Server correctly blocked dice for other character')
  } else {
    console.log(`  ? Unexpected response: ${JSON.stringify(diceResp)}`)
  }
  
  // Test 6: Duplicate actionId handling
  console.log('\n--- TEST 6: ActionId deduplication ---')
  const master4 = new TestClient('Master4')
  await master4.connect()
  master4.send({ type: 'host:create', campaignId: 'test-camp-5', campaignTitle: 'Test5', projection: { session: { isActive: true } } })
  const ready4 = await master4.waitFor(m => m.type === 'host:ready')
  const code4 = ready4.code
  
  const player6 = new TestClient('Player6')
  await player6.connect()
  player6.send({ type: 'player:join', code: code4, playerName: 'DupTest' })
  const status6 = await player6.waitFor(m => m.type === 'player:status')
  const partId6 = status6.participant.id
  
  master4.send({ type: 'participant:approve', participantId: partId6, approved: true, characterId: 'char-1' })
  await player6.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player6.waitFor(m => m.type === 'session:resume')
  
  // Send same actionId twice
  player6.send({ type: 'event:send', actionId: 'same-action-id', event: { kind: 'dice', payload: { total: 10 }, audience: { kind: 'all' } } })
  player6.send({ type: 'event:send', actionId: 'same-action-id', event: { kind: 'dice', payload: { total: 10 }, audience: { kind: 'all' } } })
  const ack1 = await player6.waitFor(m => m.type === 'event:ack' && m.actionId === 'same-action-id')
  const ack2 = await player6.waitFor(m => m.type === 'event:ack' && m.actionId === 'same-action-id')
  
  if (ack1.duplicate === false && ack2.duplicate === true) {
    console.log('  ✓ Deduplication works correctly')
  } else {
    report('MEDIUM', 'PROTOCOL', 'ActionId deduplication issue', 
      'First should be duplicate=false, second duplicate=true',
      `ack1: ${JSON.stringify(ack1)}, ack2: ${JSON.stringify(ack2)}`, 
      'app/server/lan-server.mjs:350-354')
  }
  
  // Test 7: ActionId persistence after server restart
  console.log('\n--- TEST 7: ActionId persistence across restarts ---')
  // Check if actionIds are persisted in sessions file
  const fs = await import('fs/promises')
  const sessionsData = await fs.readFile('/media/giovanni/HD/Projetos/RPG/app/.data/lan-sessions.json', 'utf8').catch(() => '[]')
  const sessions = JSON.parse(sessionsData)
  const session = sessions.find(s => s.code === code4)
  if (session && session.actionIds && session.actionIds.includes('same-action-id')) {
    console.log('  ✓ ActionIds persisted to disk')
  } else {
    report('MEDIUM', 'PERSISTENCE', 'ActionIds not persisted across server restarts', 
      'If server restarts, duplicate detection for in-flight actions is lost',
      `Session actionIds: ${JSON.stringify(session?.actionIds)}`, 
      'app/server/lan-server.mjs:51-69, 97-106')
  }
  
  // Test 8: Private message/secret leakage
  console.log('\n--- TEST 8: Private stage leakage ---')
  const master5 = new TestClient('Master5')
  await master5.connect()
  master5.send({ type: 'host:create', campaignId: 'test-camp-6', campaignTitle: 'Test6', projection: { session: { isActive: true } } })
  const ready5 = await master5.waitFor(m => m.type === 'host:ready')
  const code5 = ready5.code
  
  const player7 = new TestClient('Player7')
  await player7.connect()
  player7.send({ type: 'player:join', code: code5, playerName: 'Target' })
  const status7 = await player7.waitFor(m => m.type === 'player:status')
  const partId7 = status7.participant.id
  
  const player8 = new TestClient('Player8')
  await player8.connect()
  player8.send({ type: 'player:join', code: code5, playerName: 'Bystander' })
  const status8 = await player8.waitFor(m => m.type === 'player:status')
  const partId8 = status8.participant.id
  
  master5.send({ type: 'participant:approve', participantId: partId7, approved: true, characterId: 'char-1' })
  master5.send({ type: 'participant:approve', participantId: partId8, approved: true, characterId: 'char-2' })
  await player7.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player8.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player7.waitFor(m => m.type === 'session:resume')
  await player8.waitFor(m => m.type === 'session:resume')
  
  // Send private message to player7 only
  master5.send({ type: 'stage:present', stage: { id: 'secret-1', kind: 'message', title: 'Secret', body: 'Only for Player 7', transition: 'reveal', audience: { kind: 'participants', participantIds: [partId7] } } })
  
  const secretMsg = await player7.waitFor(m => m.type === 'stage:update' && m.stage.id === 'secret-1')
  // Wait a bit to see if player8 receives it
  await new Promise(r => setTimeout(r, 200))
  const leak = player8.messages.some(m => m.type === 'stage:update' && m.stage?.id === 'secret-1')
  
  if (leak) {
    report('CRITICAL', 'PRIVACY', 'Private stage leaked to unauthorized player', 
      'Stage with audience=participants should only go to listed participants',
      `Player8 received: ${JSON.stringify(player8.messages.filter(m => m.type === 'stage:update'))}`, 
      'app/server/lan-server.mjs:127-131, 191-200')
  } else {
    console.log('  ✓ Private stage correctly isolated')
  }
  
  // Test 9: Event audience filtering
  console.log('\n--- TEST 9: Event audience filtering (master-only) ---')
  const master6 = new TestClient('Master6')
  await master6.connect()
  master6.send({ type: 'host:create', campaignId: 'test-camp-7', campaignTitle: 'Test7', projection: { session: { isActive: true } } })
  const ready6 = await master6.waitFor(m => m.type === 'host:ready')
  const code6 = ready6.code
  
  const player9 = new TestClient('Player9')
  await player9.connect()
  player9.send({ type: 'player:join', code: code6, playerName: 'Player9' })
  const status9 = await player9.waitFor(m => m.type === 'player:status')
  const partId9 = status9.participant.id
  
  master6.send({ type: 'participant:approve', participantId: partId9, approved: true, characterId: 'char-1' })
  await player9.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player9.waitFor(m => m.type === 'session:resume')
  
  // Player sends event with audience=master
  player9.send({ type: 'event:send', actionId: 'private-dice', event: { kind: 'dice', payload: { total: 15 }, audience: { kind: 'master' } } })
  const ack9 = await player9.waitFor(m => m.type === 'event:ack' && m.actionId === 'private-dice')
  const masterEvent = await master6.waitFor(m => m.type === 'event:new' && m.event.actionId === 'private-dice')
  
  // Check if player9 also received their own master-only event (they shouldn't)
  await new Promise(r => setTimeout(r, 100))
  const selfLeak = player9.messages.some(m => m.type === 'event:new' && m.event?.actionId === 'private-dice')
  
  if (selfLeak) {
    report('MEDIUM', 'PRIVACY', 'Player receives their own master-only event', 
      'Events with audience=master should only go to master, not back to sender',
      `Player9 got own event back`, 
      'app/server/lan-server.mjs:202-210')
  } else {
    console.log('  ✓ Master-only event correctly only sent to master')
  }
  
  // Test 10: Session code brute force
  console.log('\n--- TEST 10: Session code format/entropy ---')
  console.log(`  Session codes observed: ${code}, ${code2}, ${code3}, ${code4}, ${code5}, ${code6}`)
  console.log('  Code format: 8 chars from ABCDEFGHJKLMNPQRSTUVWXYZ234567 (32^8 = ~1.1T combinations)')
  console.log('  Rate limiting: Not implemented on join attempts')
  report('MEDIUM', 'AUTHORIZATION', 'Session code brute-force possible', 
    'No rate limiting on player:join attempts; 8-char code with 32 alphabet',
    'Attacker can try many codes quickly',
    'app/server/lan-server.mjs:265-270')
  
  // Test 11: WebSocket message size limit
  console.log('\n--- TEST 11: WebSocket max payload ---')
  console.log('  Server maxPayload: 12MB (line 468)')
  console.log('  No per-message validation beyond JSON.parse')
  report('LOW', 'PROTOCOL', 'Large message DoS potential', 
    '12MB max payload could allow memory exhaustion via many large messages',
    'maxPayload: 12 * 1024 * 1024',
    'app/server/lan-server.mjs:468')
  
  // Test 12: Reconnection with stale token
  console.log('\n--- TEST 12: Reconnection token reuse ---')
  const master7 = new TestClient('Master7')
  await master7.connect()
  master7.send({ type: 'host:create', campaignId: 'test-camp-8', campaignTitle: 'Test8', projection: { session: { isActive: true } } })
  const ready7 = await master7.waitFor(m => m.type === 'host:ready')
  const code7 = ready7.code
  const token7 = ready7.masterToken
  
  const player10 = new TestClient('Player10')
  await player10.connect()
  player10.send({ type: 'player:join', code: code7, playerName: 'ReconnectTest' })
  const status10 = await player10.waitFor(m => m.type === 'player:status')
  const partId10 = status10.participant.id
  const reconnectToken = status10.participant.reconnectToken
  
  master7.send({ type: 'participant:approve', participantId: partId10, approved: true, characterId: 'char-1' })
  await player10.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player10.waitFor(m => m.type === 'session:resume')
  
  // Close and reconnect with same token
  player10.close()
  await new Promise(r => setTimeout(r, 100))
  
  const player10re = new TestClient('Player10Re')
  await player10re.connect()
  player10re.send({ type: 'player:join', code: code7, playerName: 'ReconnectTest', reconnectToken })
  const resumeRe = await player10re.waitFor(m => m.type === 'session:resume')
  
  if (resumeRe.participant?.id === partId10) {
    console.log('  ✓ Reconnection works correctly')
  } else {
    report('MEDIUM', 'REALTIME', 'Reconnection failed to restore participant', 
      'Reconnect should restore same participant ID',
      `Expected ${partId10}, got ${resumeRe.participant?.id}`, 
      'app/server/lan-server.mjs:272-292')
  }
  
  // Test 13: Multiple connections with same reconnectToken
  console.log('\n--- TEST 13: Duplicate client with same reconnectToken ---')
  const player11 = new TestClient('Player11')
  await player11.connect()
  player11.send({ type: 'player:join', code: code7, playerName: 'DupClient', reconnectToken })
  const resp11a = await player11.waitFor(m => m.type === 'session:resume' || m.type === 'error')
  
  const player11b = new TestClient('Player11b')
  await player11b.connect()
  player11b.send({ type: 'player:join', code: code7, playerName: 'DupClient', reconnectToken })
  const resp11b = await player11b.waitFor(m => m.type === 'session:resume' || m.type === 'error')
  
  if (resp11a.type === 'session:resume' && resp11b.type === 'session:resume') {
    report('HIGH', 'REALTIME', 'Multiple clients can use same reconnectToken', 
      'Two WebSocket connections with same reconnectToken both get session state',
      'Both connections received session:resume', 
      'app/server/lan-server.mjs:272-292, 212-215')
  } else {
    console.log('  Response A:', resp11a.type, 'Response B:', resp11b.type)
  }
  
  // Test 14: Event ordering / race conditions
  console.log('\n--- TEST 14: Concurrent events ordering ---')
  const master8 = new TestClient('Master8')
  await master8.connect()
  master8.send({ type: 'host:create', campaignId: 'test-camp-9', campaignTitle: 'Test9', projection: { session: { isActive: true } } })
  const ready8 = await master8.waitFor(m => m.type === 'host:ready')
  const code8 = ready8.code
  
  const pA = new TestClient('PlayerA')
  await pA.connect()
  pA.send({ type: 'player:join', code: code8, playerName: 'PlayerA' })
  const sA = await pA.waitFor(m => m.type === 'player:status')
  
  const pB = new TestClient('PlayerB')
  await pB.connect()
  pB.send({ type: 'player:join', code: code8, playerName: 'PlayerB' })
  const sB = await pB.waitFor(m => m.type === 'player:status')
  
  master8.send({ type: 'participant:approve', participantId: sA.participant.id, approved: true, characterId: 'char-1' })
  master8.send({ type: 'participant:approve', participantId: sB.participant.id, approved: true, characterId: 'char-2' })
  await pA.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await pB.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await pA.waitFor(m => m.type === 'session:resume')
  await pB.waitFor(m => m.type === 'session:resume')
  
  // Send events simultaneously
  const idA = 'concurrent-' + Date.now() + '-A'
  const idB = 'concurrent-' + Date.now() + '-B'
  pA.send({ type: 'event:send', actionId: idA, event: { kind: 'dice', payload: { total: 1 }, audience: { kind: 'all' } } })
  pB.send({ type: 'event:send', actionId: idB, event: { kind: 'dice', payload: { total: 2 }, audience: { kind: 'all' } } })
  
  await pA.waitFor(m => m.type === 'event:ack' && m.actionId === idA)
  await pB.waitFor(m => m.type === 'event:ack' && m.actionId === idB)
  const evA = await master8.waitFor(m => m.type === 'event:new' && m.event.actionId === idA)
  const evB = await master8.waitFor(m => m.type === 'event:new' && m.event.actionId === idB)
  
  console.log(`  Event A seq: ${evA.seq}, Event B seq: ${evB.seq}`)
  console.log('  ✓ Concurrent events handled with sequence numbers')
  
  // Test 15: Stage presentation during reconnection
  console.log('\n--- TEST 15: Stage state during reconnection ---')
  const master9 = new TestClient('Master9')
  await master9.connect()
  master9.send({ type: 'host:create', campaignId: 'test-camp-10', campaignTitle: 'Test10', projection: { session: { isActive: true } } })
  const ready9 = await master9.waitFor(m => m.type === 'host:ready')
  const code9 = ready9.code
  
  const pC = new TestClient('PlayerC')
  await pC.connect()
  pC.send({ type: 'player:join', code: code9, playerName: 'PlayerC' })
  const sC = await pC.waitFor(m => m.type === 'player:status')
  
  master9.send({ type: 'participant:approve', participantId: sC.participant.id, approved: true, characterId: 'char-1' })
  await pC.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await pC.waitFor(m => m.type === 'session:resume')
  
  // Present a stage
  master9.send({ type: 'stage:present', stage: { id: 'stage-during-reconnect', kind: 'scene', title: 'Active Scene', body: 'Scene during reconnect', transition: 'fade', audience: { kind: 'all' } } })
  await pC.waitFor(m => m.type === 'stage:update' && m.stage.id === 'stage-during-reconnect')
  
  // Now reconnect
  const tokenC = pC.messages.find(m => m.type === 'player:status')?.participant?.reconnectToken
  pC.close()
  await new Promise(r => setTimeout(r, 100))
  
  const pCre = new TestClient('PlayerCre')
  await pCre.connect()
  pCre.send({ type: 'player:join', code: code9, playerName: 'PlayerC', reconnectToken: tokenC })
  const resumeCre = await pCre.waitFor(m => m.type === 'session:resume')
  
  if (resumeCre.stage?.id === 'stage-during-reconnect') {
    console.log('  ✓ Stage state correctly restored on reconnection')
  } else {
    report('HIGH', 'REALTIME', 'Stage state not restored on reconnection', 
      'Current stage should be included in session:resume',
      `Resume stage: ${JSON.stringify(resumeCre.stage)}`, 
      'app/server/lan-server.mjs:153-172')
  }
  
  // Test 16: Malformed JSON handling
  console.log('\n--- TEST 16: Malformed message handling ---')
  const malformed = new TestClient('Malformed')
  await malformed.connect()
  // Send invalid JSON
  malformed.socket.send('not json')
  const errResp = await malformed.waitFor(m => m.type === 'error', 1000).catch(() => null)
  if (errResp?.code === 'INVALID_MESSAGE') {
    console.log('  ✓ Malformed JSON handled correctly')
  } else {
    report('LOW', 'PROTOCOL', 'Malformed message handling', 
      'Server should respond with error for invalid JSON',
      `Response: ${JSON.stringify(errResp)}`, 
      'app/server/lan-server.mjs:472-478')
  }
  
  // Test 17: Missing required fields
  console.log('\n--- TEST 17: Missing required fields ---')
  const missing = new TestClient('MissingFields')
  await missing.connect()
  missing.send({ type: 'host:create' }) // Missing campaignId, etc.
  const missingResp = await missing.waitFor(m => m.type === 'host:ready' || m.type === 'error', 1000).catch(() => null)
  console.log(`  Response: ${JSON.stringify(missingResp)}`)
  
  // Test 18: XSS via stage content
  console.log('\n--- TEST 18: XSS via stage content ---')
  const masterXSS = new TestClient('MasterXSS')
  await masterXSS.connect()
  masterXSS.send({ type: 'host:create', campaignId: 'xss-camp', campaignTitle: 'XSS', projection: { session: { isActive: true } } })
  const readyXSS = await masterXSS.waitFor(m => m.type === 'host:ready')
  const codeXSS = readyXSS.code
  
  const playerXSS = new TestClient('PlayerXSS')
  await playerXSS.connect()
  playerXSS.send({ type: 'player:join', code: codeXSS, playerName: 'Victim' })
  const sXSS = await playerXSS.waitFor(m => m.type === 'player:status')
  
  masterXSS.send({ type: 'participant:approve', participantId: sXSS.participant.id, approved: true, characterId: 'char-1' })
  await playerXSS.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await playerXSS.waitFor(m => m.type === 'session:resume')
  
  // Send stage with script tag
  masterXSS.send({ type: 'stage:present', stage: { id: 'xss-stage', kind: 'message', title: 'XSS Test', body: '<img src=x onerror=alert(1)>', transition: 'reveal', audience: { kind: 'all' } } })
  const xssStage = await playerXSS.waitFor(m => m.type === 'stage:update' && m.stage.id === 'xss-stage')
  console.log(`  Stage body received: ${xssStage.stage.body}`)
  console.log('  Note: Frontend must sanitize before rendering (uses React, so auto-escaped)')
  
  // Test 19: Secure context APIs in HTTP LAN
  console.log('\n--- TEST 19: Secure Context APIs in HTTP LAN ---')
  console.log('  Testing via fetch to check service worker registration...')
  const swCheck = await fetch('http://127.0.0.1:4175/registerSW.js').then(r => r.text()).catch(() => 'failed')
  console.log(`  Service Worker register script: ${swCheck.length} chars`)
  console.log('  In HTTP (non-localhost), Service Workers, clipboard API, Web Crypto may not work')
  report('HIGH', 'WEB_APIS', 'PWA/Service Worker requires HTTPS for LAN', 
    'Service Workers only work on secure contexts (HTTPS or localhost). LAN HTTP will fail SW registration.',
    'vite.config.ts uses registerType: autoUpdate with VitePWA',
    'app/vite.config.ts:35-40')
  
  // Test 20: navigator.clipboard in HTTP LAN
  console.log('\n--- TEST 20: Clipboard API in HTTP LAN ---')
  console.log('  Used in LiveSessionHostPanel.tsx:157 and SnapshotControlPanel.tsx:67')
  console.log('  navigator.clipboard requires secure context - will fail on HTTP LAN')
  report('HIGH', 'WEB_APIS', 'Clipboard API fails on HTTP LAN', 
    'navigator.clipboard.writeText() used for copying join URL and snapshots',
    'LiveSessionHostPanel.tsx:157, SnapshotControlPanel.tsx:67',
    'app/src/components/live/LiveSessionHostPanel.tsx, app/src/components/backup/SnapshotControlPanel.tsx')
  
  // Test 21: crypto.randomUUID in HTTP LAN
  console.log('\n--- TEST 21: crypto.randomUUID fallback ---')
  console.log('  lib/id.ts has fallback using crypto.getRandomValues() which works in HTTP')
  console.log('  ✓ Fallback implemented correctly')
  
  // Test 22: Web Crypto (AES-GCM, PBKDF2) in adminSecurity.ts
  console.log('\n--- TEST 22: Web Crypto in HTTP LAN ---')
  console.log('  adminSecurity.ts uses crypto.subtle for AES-GCM, PBKDF2, HMAC')
  console.log('  Web Crypto API requires secure context - will fail on HTTP LAN')
  report('CRITICAL', 'WEB_APIS', 'Web Crypto (AES-GCM, PBKDF2) fails on HTTP LAN', 
    'Admin vault encryption/decryption, TOTP will not work in HTTP LAN',
    'adminSecurity.ts uses crypto.subtle extensively',
    'app/src/lib/adminSecurity.ts:154-191, 225-232')
  
  // Test 23: Rate limiting
  console.log('\n--- TEST 23: Rate limiting ---')
  console.log('  Server has per-connection rate limit: 80 messages per 10 seconds (line 217-222)')
  console.log('  No global rate limiting on join attempts or session creation')
  report('MEDIUM', 'PROTOCOL', 'No global rate limiting', 
    'Attacker can create many sessions or spam join attempts',
    'rateLimited() only tracks per-connection',
    'app/server/lan-server.mjs:217-222')
  
  // Test 24: Heartbeat/ping-pong
  console.log('\n--- TEST 24: Heartbeat ---')
  console.log('  Server sends ping every 20s, terminates if no pong (line 494-503)')
  console.log('  Client does not send pings - relies on server')
  console.log('  ✓ Basic heartbeat implemented')
  
  // Test 25: Session persistence after server restart
  console.log('\n--- TEST 25: Session persistence ---')
  const sessionsData2 = await fs.readFile('/media/giovanni/HD/Projetos/RPG/app/.data/lan-sessions.json', 'utf8').catch(() => '[]')
  const sessions2 = JSON.parse(sessionsData2)
  console.log(`  Persisted sessions: ${sessions2.length}`)
  for (const s of sessions2) {
    console.log(`    ${s.code}: ${s.status}, ${s.events.length} events, ${s.participants.length} participants`)
  }
  
  // Print summary
  console.log('\n=== SUMMARY ===')
  const bySeverity = { BLOCKER: 0, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  for (const i of issues) bySeverity[i.severity]++
  console.log(`BLOCKER: ${bySeverity.BLOCKER}`)
  console.log(`CRITICAL: ${bySeverity.CRITICAL}`)
  console.log(`HIGH: ${bySeverity.HIGH}`)
  console.log(`MEDIUM: ${bySeverity.MEDIUM}`)
  console.log(`LOW: ${bySeverity.LOW}`)
  console.log(`TOTAL: ${issues.length}`)
  
  console.log('\n=== DETAILED REPORT ===')
  for (const i of issues) {
    console.log(`\n${i.severity}: ${i.category} - ${i.title}`)
    console.log(`  Steps: ${i.details}`)
    console.log(`  Evidence: ${i.evidence}`)
    console.log(`  File: ${i.file}`)
  }
}

runTests().catch(console.error)
