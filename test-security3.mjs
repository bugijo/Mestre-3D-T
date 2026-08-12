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
  console.log('=== DEEP DIVE TESTS ===\n')
  
  const issues = []
  function report(severity, category, title, details, evidence, file) {
    issues.push({ severity, category, title, details, evidence, file })
    const icon = severity === 'BLOCKER' ? '🔴' : severity === 'CRITICAL' ? '🟠' : severity === 'HIGH' ? '🟡' : severity === 'MEDIUM' ? '🔵' : '🟢'
    console.log(`${icon} [${severity}] ${category}: ${title}`)
    console.log(`   ${details}`)
    console.log(`   Evidence: ${evidence}`)
    console.log(`   File: ${file}\n`)
  }

  // Test 1: participant:approve from player - detailed investigation
  console.log('--- TEST 1: participant:approve from player (deep dive) ---')
  const master1 = new TestClient('Master1')
  await master1.connect()
  master1.send({ type: 'host:create', campaignId: 'test-1', campaignTitle: 'Test1', projection: { session: { isActive: true } } })
  const ready1 = await master1.waitFor(m => m.type === 'host:ready')
  const code1 = ready1.code
  
  const player1a = new TestClient('Player1a')
  await player1a.connect()
  player1a.send({ type: 'player:join', code: code1, playerName: 'Attacker' })
  const s1a = await player1a.waitFor(m => m.type === 'player:status')
  const partId1a = s1a.participant.id
  
  const player1b = new TestClient('Player1b')
  await player1b.connect()
  player1b.send({ type: 'player:join', code: code1, playerName: 'Victim' })
  const s1b = await player1b.waitFor(m => m.type === 'player:status')
  const partId1b = s1b.participant.id
  
  console.log(`  Attacker ID: ${partId1a}`)
  console.log(`  Victim ID: ${partId1b}`)
  
  // Attacker tries to approve victim
  player1a.send({ type: 'participant:approve', participantId: partId1b, approved: true, characterId: 'char-1' })
  await new Promise(r => setTimeout(r, 300))
  
  // Check master's participant list
  const list1 = await master1.waitFor(m => m.type === 'participant:list')
  console.log(`  Master's list: ${JSON.stringify(list1.participants.map(p => ({ id: p.id, name: p.playerName, status: p.status })))}`)
  
  // Check victim's status messages
  console.log(`  Victim messages: ${player1b.messages.filter(m => m.type === 'player:status').map(m => JSON.stringify(m.participant)).join(' | ')}`)
  console.log(`  Attacker messages: ${player1a.messages.filter(m => m.type === 'player:status').map(m => JSON.stringify(m.participant)).join(' | ')}`)
  
  const victimInList = list1.participants.find(p => p.id === partId1b)
  if (victimInList && victimInList.status === 'approved') {
    report('CRITICAL', 'AUTHORIZATION', 'Player can approve other participants', 
      'participant:approve from non-master was processed',
      `Victim status: ${victimInList.status}`, 
      'app/server/lan-server.mjs:307-322')
  } else if (victimInList && victimInList.status === 'pending') {
    console.log('  ✓ Server correctly ignored approve (victim still pending)')
  } else {
    report('HIGH', 'AUTHORIZATION', 'Participant disappeared from list after unauthorized approve', 
      'Unauthorized approve caused participant to be removed or corrupted',
      `Victim in list: ${!!victimInList}`, 
      'app/server/lan-server.mjs:307-322')
  }

  // Test 2: Event audience validation - player sending to specific participants
  console.log('\n--- TEST 2: Event audience=participants from player ---')
  const master2 = new TestClient('Master2')
  await master2.connect()
  master2.send({ type: 'host:create', campaignId: 'test-2', campaignTitle: 'Test2', projection: { session: { isActive: true } } })
  const ready2 = await master2.waitFor(m => m.type === 'host:ready')
  const code2 = ready2.code
  
  const player2a = new TestClient('Player2a')
  await player2a.connect()
  player2a.send({ type: 'player:join', code: code2, playerName: 'PlayerA' })
  const s2a = await player2a.waitFor(m => m.type === 'player:status')
  
  const player2b = new TestClient('Player2b')
  await player2b.connect()
  player2b.send({ type: 'player:join', code: code2, playerName: 'PlayerB' })
  const s2b = await player2b.waitFor(m => m.type === 'player:status')
  
  master2.send({ type: 'participant:approve', participantId: s2a.participant.id, approved: true, characterId: 'char-1' })
  master2.send({ type: 'participant:approve', participantId: s2b.participant.id, approved: true, characterId: 'char-2' })
  await player2a.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player2b.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player2a.waitFor(m => m.type === 'session:resume')
  await player2b.waitFor(m => m.type === 'session:resume')
  
  // PlayerA sends event to PlayerB only
  player2a.send({ type: 'event:send', actionId: 'targeted-event', event: { kind: 'message', payload: { text: 'secret' }, audience: { kind: 'participants', participantIds: [s2b.participant.id] } } })
  const ack2a = await player2a.waitFor(m => m.type === 'event:ack' && m.actionId === 'targeted-event')
  console.log(`  PlayerA ack: ${JSON.stringify(ack2a)}`)
  
  // Check who received it
  await new Promise(r => setTimeout(r, 200))
  const playerAReceived = player2a.messages.some(m => m.type === 'event:new' && m.event?.actionId === 'targeted-event')
  const playerBReceived = player2b.messages.some(m => m.type === 'event:new' && m.event?.actionId === 'targeted-event')
  const masterReceived = master2.messages.some(m => m.type === 'event:new' && m.event?.actionId === 'targeted-event')
  
  console.log(`  PlayerA received own event: ${playerAReceived}`)
  console.log(`  PlayerB received targeted event: ${playerBReceived}`)
  console.log(`  Master received event: ${masterReceived}`)
  
  if (!playerBReceived) {
    report('HIGH', 'PRIVACY', 'Player cannot send targeted events to specific participants', 
      'audience={kind:participants, participantIds:[...]} from player is converted to audience=all',
      `PlayerB received: ${playerBReceived}, Master received: ${masterReceived}`, 
      'app/server/lan-server.mjs:366')
  } else {
    console.log('  ✓ Targeted events work for players')
  }

  // Test 3: Master sending targeted event
  console.log('\n--- TEST 3: Master sending targeted event ---')
  const master3 = new TestClient('Master3')
  await master3.connect()
  master3.send({ type: 'host:create', campaignId: 'test-3', campaignTitle: 'Test3', projection: { session: { isActive: true } } })
  const ready3 = await master3.waitFor(m => m.type === 'host:ready')
  const code3 = ready3.code
  
  const player3a = new TestClient('Player3a')
  await player3a.connect()
  player3a.send({ type: 'player:join', code: code3, playerName: 'PlayerA' })
  const s3a = await player3a.waitFor(m => m.type === 'player:status')
  
  const player3b = new TestClient('Player3b')
  await player3b.connect()
  player3b.send({ type: 'player:join', code: code3, playerName: 'PlayerB' })
  const s3b = await player3b.waitFor(m => m.type === 'player:status')
  
  master3.send({ type: 'participant:approve', participantId: s3a.participant.id, approved: true, characterId: 'char-1' })
  master3.send({ type: 'participant:approve', participantId: s3b.participant.id, approved: true, characterId: 'char-2' })
  await player3a.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player3b.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player3a.waitFor(m => m.type === 'session:resume')
  await player3b.waitFor(m => m.type === 'session:resume')
  
  // Master sends event to PlayerA only
  master3.send({ type: 'event:send', actionId: 'master-targeted', event: { kind: 'message', payload: { text: 'for A only' }, audience: { kind: 'participants', participantIds: [s3a.participant.id] } } })
  await new Promise(r => setTimeout(r, 200))
  
  const p3aGot = player3a.messages.some(m => m.type === 'event:new' && m.event?.actionId === 'master-targeted')
  const p3bGot = player3b.messages.some(m => m.type === 'event:new' && m.event?.actionId === 'master-targeted')
  console.log(`  PlayerA got master event: ${p3aGot}`)
  console.log(`  PlayerB got master event: ${p3bGot}`)
  
  if (p3aGot && !p3bGot) {
    console.log('  ✓ Master targeted events work correctly')
  } else {
    report('HIGH', 'PRIVACY', 'Master targeted events not working', 
      'Master event with audience=participants should only go to listed participants',
      `PlayerA: ${p3aGot}, PlayerB: ${p3bGot}`, 
      'app/server/lan-server.mjs:366, 202-210')
  }

  // Test 4: Player sending event with audience=master (should work)
  console.log('\n--- TEST 4: Player sending to master only ---')
  const master4 = new TestClient('Master4')
  await master4.connect()
  master4.send({ type: 'host:create', campaignId: 'test-4', campaignTitle: 'Test4', projection: { session: { isActive: true } } })
  const ready4 = await master4.waitFor(m => m.type === 'host:ready')
  const code4 = ready4.code
  
  const player4 = new TestClient('Player4')
  await player4.connect()
  player4.send({ type: 'player:join', code: code4, playerName: 'Player4' })
  const s4 = await player4.waitFor(m => m.type === 'player:status')
  master4.send({ type: 'participant:approve', participantId: s4.participant.id, approved: true, characterId: 'char-1' })
  await player4.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player4.waitFor(m => m.type === 'session:resume')
  
  // Player sends to master only
  player4.send({ type: 'event:send', actionId: 'to-master', event: { kind: 'dice', payload: { total: 20 }, audience: { kind: 'master' } } })
  const ack4 = await player4.waitFor(m => m.type === 'event:ack' && m.actionId === 'to-master')
  console.log(`  Player ack: ${JSON.stringify(ack4)}`)
  
  await new Promise(r => setTimeout(r, 200))
  const masterGot = master4.messages.some(m => m.type === 'event:new' && m.event?.actionId === 'to-master')
  const playerGotOwn = player4.messages.some(m => m.type === 'event:new' && m.event?.actionId === 'to-master')
  console.log(`  Master got event: ${masterGot}`)
  console.log(`  Player got own event back: ${playerGotOwn}`)
  
  if (masterGot && !playerGotOwn) {
    console.log('  ✓ Player-to-master events work correctly')
  } else {
    report('MEDIUM', 'PRIVACY', 'Player-to-master event leakage', 
      'Event with audience=master should not return to sender',
      `Master: ${masterGot}, Player: ${playerGotOwn}`, 
      'app/server/lan-server.mjs:366, 202-210')
  }

  // Test 5: Reconnection token - can two players use same token simultaneously?
  console.log('\n--- TEST 5: Duplicate reconnectToken usage ---')
  const master5 = new TestClient('Master5')
  await master5.connect()
  master5.send({ type: 'host:create', campaignId: 'test-5', campaignTitle: 'Test5', projection: { session: { isActive: true } } })
  const ready5 = await master5.waitFor(m => m.type === 'host:ready')
  const code5 = ready5.code
  
  const player5 = new TestClient('Player5')
  await player5.connect()
  player5.send({ type: 'player:join', code: code5, playerName: 'Player5' })
  const s5 = await player5.waitFor(m => m.type === 'player:status')
  const token5 = s5.participant.reconnectToken
  console.log(`  Reconnect token: ${token5}`)
  
  master5.send({ type: 'participant:approve', participantId: s5.participant.id, approved: true, characterId: 'char-1' })
  await player5.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player5.waitFor(m => m.type === 'session:resume')
  
  // First reconnection
  const player5re1 = new TestClient('Player5re1')
  await player5re1.connect()
  player5re1.send({ type: 'player:join', code: code5, playerName: 'Player5', reconnectToken: token5 })
  const resume1 = await player5re1.waitFor(m => m.type === 'session:resume')
  console.log(`  First reconnect participant ID: ${resume1.participant?.id}`)
  
  // Second reconnection (simultaneous)
  const player5re2 = new TestClient('Player5re2')
  await player5re2.connect()
  player5re2.send({ type: 'player:join', code: code5, playerName: 'Player5', reconnectToken: token5 })
  const resume2 = await player5re2.waitFor(m => m.type === 'session:resume')
  console.log(`  Second reconnect participant ID: ${resume2.participant?.id}`)
  
  // Check master's participant list
  await new Promise(r => setTimeout(r, 200))
  const list5 = await master5.waitFor(m => m.type === 'participant:list')
  console.log(`  Master list: ${JSON.stringify(list5.participants.map(p => ({ id: p.id, name: p.playerName, connected: p.connected })))}`)
  
  if (resume1.participant?.id === resume2.participant?.id) {
    report('HIGH', 'REALTIME', 'Same reconnectToken allows multiple simultaneous connections', 
      'Two WebSocket connections with same token both receive full session state',
      `Both got participant ID: ${resume1.participant?.id}`, 
      'app/server/lan-server.mjs:272-292, 212-215')
  }

  // Test 6: ActionId deduplication race condition
  console.log('\n--- TEST 6: ActionId race condition (parallel sends) ---')
  const master6 = new TestClient('Master6')
  await master6.connect()
  master6.send({ type: 'host:create', campaignId: 'test-6', campaignTitle: 'Test6', projection: { session: { isActive: true } } })
  const ready6 = await master6.waitFor(m => m.type === 'host:ready')
  const code6 = ready6.code
  
  const player6 = new TestClient('Player6')
  await player6.connect()
  player6.send({ type: 'player:join', code: code6, playerName: 'Player6' })
  const s6 = await player6.waitFor(m => m.type === 'player:status')
  master6.send({ type: 'participant:approve', participantId: s6.participant.id, approved: true, characterId: 'char-1' })
  await player6.waitFor(m => m.type === 'player:status' && m.participant.status === 'approved')
  await player6.waitFor(m => m.type === 'session:resume')
  
  // Send two events with same actionId PARALLEL (no await between)
  player6.send({ type: 'event:send', actionId: 'race-action', event: { kind: 'dice', payload: { total: 1 }, audience: { kind: 'all' } } })
  player6.send({ type: 'event:send', actionId: 'race-action', event: { kind: 'dice', payload: { total: 2 }, audience: { kind: 'all' } } })
  
  const ack6a = await player6.waitFor(m => m.type === 'event:ack' && m.actionId === 'race-action')
  const ack6b = await player6.waitFor(m => m.type === 'event:ack' && m.actionId === 'race-action')
  console.log(`  Parallel ack1: ${JSON.stringify(ack6a)}`)
  console.log(`  Parallel ack2: ${JSON.stringify(ack6b)}`)
  
  if (!ack6a.duplicate && ack6b.duplicate) {
    console.log('  ✓ Race condition handled correctly')
  } else if (!ack6a.duplicate && !ack6b.duplicate) {
    report('HIGH', 'PROTOCOL', 'ActionId deduplication race condition', 
      'Parallel sends with same actionId both accepted',
      `Both duplicate=false`, 
      'app/server/lan-server.mjs:350-354')
  }

  // Test 7: Session code case sensitivity
  console.log('\n--- TEST 7: Session code case sensitivity ---')
  const master7 = new TestClient('Master7')
  await master7.connect()
  master7.send({ type: 'host:create', campaignId: 'test-7', campaignTitle: 'Test7', projection: { session: { isActive: true } } })
  const ready7 = await master7.waitFor(m => m.type === 'host:ready')
  const code7 = ready7.code
  console.log(`  Code: ${code7}`)
  console.log(`  Lowercase: ${code7.toLowerCase()}`)
  
  const player7 = new TestClient('Player7')
  await player7.connect()
  player7.send({ type: 'player:join', code: code7.toLowerCase(), playerName: 'Player7' })
  const s7 = await player7.waitFor(m => m.type === 'player:status' || m.type === 'error')
  console.log(`  Lowercase join: ${JSON.stringify(s7)}`)
  
  // Test 8: WebSocket connection without origin check
  console.log('\n--- TEST 8: Origin validation ---')
  console.log('  Server does not validate Origin header on WebSocket upgrade')
  console.log('  This allows cross-site WebSocket hijacking (CSWSH)')
  report('HIGH', 'SECURITY', 'Missing Origin validation on WebSocket upgrade', 
    'Server accepts WebSocket connections from any origin',
    'No origin check in WebSocketServer connection handler',
    'app/server/lan-server.mjs:468-492')

  // Test 9: Secure flag on cookies (not applicable - no cookies used)
  console.log('\n--- TEST 9: Transport security ---')
  console.log('  WebSocket uses ws:// not wss:// in LAN')
  console.log('  No TLS in LAN mode - traffic is unencrypted')
  report('MEDIUM', 'SECURITY', 'No TLS for LAN WebSocket', 
    'All LAN traffic including tokens, events, stages sent in cleartext',
    'WebSocket URL uses ws:// protocol',
    'app/src/realtime/LiveSessionContext.tsx:46-47')

  // Test 10: localStorage token exposure
  console.log('\n--- TEST 10: Token storage in localStorage ---')
  console.log('  Master token stored in localStorage: dk-live:master-token')
  console.log('  Player token stored in localStorage: dk-live:player-token:<CODE>')
  console.log('  Vulnerable to XSS - any script on same origin can steal tokens')
  report('HIGH', 'SECURITY', 'Tokens stored in localStorage vulnerable to XSS', 
    'masterToken and reconnectToken accessible via document.cookie/localStorage',
    'LiveSessionContext.tsx:105-106, 114-116',
    'app/src/realtime/LiveSessionContext.tsx:105-116')

  // Test 11: Input sanitization - safeText function
  console.log('\n--- TEST 11: Input sanitization ---')
  console.log('  safeText() only removes control chars and truncates (line 123-125)')
  console.log('  No validation of campaignId, campaignTitle, playerName beyond length')
  console.log('  No sanitization of projection, stage content, event payloads')
  report('MEDIUM', 'SECURITY', 'Insufficient input validation', 
    'Only basic truncation and control char removal; no schema validation',
    'safeText() at line 123-125, no validation of complex objects',
    'app/server/lan-server.mjs:123-125')

  // Summary
  console.log('\n=== DEEP DIVE SUMMARY ===')
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
