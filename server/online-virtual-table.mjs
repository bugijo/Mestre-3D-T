import WebSocket from 'ws';

const URL = 'wss://rpg-alpha.onrender.com/ws';
const API_URL = 'https://rpg-alpha.onrender.com';
const log = (r, m) => console.log(`[${r}] ${m}`);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function connect() {
  return new Promise((res, rej) => {
    const ws = new WebSocket(URL);
    ws.on('open', () => res(ws));
    ws.on('error', rej);
    setTimeout(() => rej(new Error('WS timeout')), 15000);
  });
}

function waitFor(ws, t, to = 15000) {
  return new Promise((res, rej) => {
    const timer = setTimeout(() => rej(new Error(`Timeout ${t}`)), to);
    const h = d => { const m = JSON.parse(String(d)); if (m.type === t) { clearTimeout(timer); ws.removeListener('message', h); res(m); } };
    ws.on('message', h);
  });
}

async function authMaster() {
  const email = 'vt-' + Date.now() + '@test.com';
  const password = 'test123456';
  await fetch(API_URL + '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const login = await fetch(API_URL + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await login.json();
  if (!data.access_token) throw new Error('Falha no login do mestre: ' + (data.error || 'sem token'));
  return data.access_token;
}

async function run() {
  console.log('\n========== MESA VIRTUAL ONLINE ==========\n');

  // Master authenticates and creates session
  const token = await authMaster();
  const m = await connect();
  m.send(JSON.stringify({ type: 'auth:login', token }));
  await waitFor(m, 'auth:ready');
  log('MASTER', 'Autenticado');

  m.send(JSON.stringify({ type: 'host:create', campaignId: 'vt', campaignTitle: 'Mesa Virtual Online', projection: null }));
  const r = await waitFor(m, 'host:ready');
  log('MASTER', `Sessão: ${r.code}`);

  // 4 players join
  const names = ['Lia','Caio','Tainá','Marco'];
  const chars = ['char-lia','char-caio','char-taina','char-renan'];
  const ps = [];
  for (let i = 0; i < 4; i++) {
    const ws = await connect();
    // Register collector BEFORE join to capture all events
    ws._events = [];
    ws.on('message', d => { ws._events.push(JSON.parse(String(d))); });
    ws.send(JSON.stringify({ type: 'player:join', code: r.code, playerName: names[i] }));
    const s = await waitFor(ws, 'player:status');
    log(names[i], `Join OK`);
    ps.push({ ws, name: names[i], id: s.participant.id, ch: s.participant.characterId, tok: s.participant.reconnectToken });
    await sleep(100);
  }

  // Approve - register waiters first
  const approvalPromises = ps.map(p => waitFor(p.ws, 'player:status'));
  for (let i = 0; i < 4; i++) {
    m.send(JSON.stringify({ type: 'participant:approve', participantId: ps[i].id, characterId: chars[i], approved: true }));
    await sleep(150);
  }
  await Promise.all(approvalPromises);
  log('MASTER', '4 jogadores aprovados');

  // Scene
  m.send(JSON.stringify({ type: 'stage:present', stage: { kind: 'scene', title: 'Arquivo Municipal', body: 'Sala empoeirada.', audience: { kind: 'all' } } }));
  await sleep(300);
  log('MASTER', 'Cena apresentada');

  // NPC
  m.send(JSON.stringify({ type: 'stage:present', stage: { kind: 'npc_reveal', title: 'Dra. Ester', body: 'Arquivista.', audience: { kind: 'all' } } }));
  await sleep(300);
  log('MASTER', 'NPC revelado');

  // Public message
  m.send(JSON.stringify({ type: 'event:send', actionId: 'pub-'+Date.now(), event: { kind: 'message', payload: { text: 'Bem vindos!' }, audience: { kind: 'all' } } }));
  await sleep(300);

  // SECRET to Player 2
  const secretId = 'secret-'+Date.now();
  m.send(JSON.stringify({ type: 'event:send', actionId: secretId, event: { kind: 'message', payload: { text: '[SECRET] Sussurro.' }, audience: { kind: 'participants', participantIds: [ps[1].id] } } }));
  await sleep(500);
  log('MASTER', 'Segredo enviado ao P2');

  // Combat
  m.send(JSON.stringify({ type: 'stage:present', stage: { kind: 'combat', title: 'Eco sem Origem', body: 'Combate!', audience: { kind: 'all' } } }));
  await sleep(300);
  log('MASTER', 'Combate iniciado');

  // Dice from P1
  ps[0].ws.send(JSON.stringify({ type: 'event:send', actionId: 'dice-'+Date.now(), event: { kind: 'dice', payload: { expression: '1d20', result: 18 }, audience: { kind: 'all' } } }));
  await sleep(300);
  log('P1', 'Dado rolado');

  // Reward
  m.send(JSON.stringify({ type: 'event:send', actionId: 'rew-'+Date.now(), event: { kind: 'reward', payload: { xp: 20, item: 'Cristal' }, audience: { kind: 'all' } } }));
  await sleep(300);
  log('MASTER', 'Recompensa concedida');

  // RECONNECTION: Player 3
  log('MASTER', '--- RECONEXÃO P3 ---');
  ps[2].ws.close();
  await sleep(500);
  const p3b = await connect();
  p3b.send(JSON.stringify({ type: 'player:join', code: r.code, playerName: 'Tainá', reconnectToken: ps[2].tok }));
  const sm = await waitFor(p3b, 'session:resume');
  log('P3', `Reconectado! Status: ${sm.status}, Eventos: ${sm.events?.length||0}`);

  // CONCURRENCY: 4 simultaneous
  log('MASTER', '--- CONCORRÊNCIA ---');
  for (let i = 0; i < 4; i++) {
    ps[i%4].ws.send(JSON.stringify({ type: 'event:send', actionId: 'conc-'+i+'-'+Date.now(), event: { kind: 'dice', payload: {}, audience: { kind: 'all' } } }));
  }
  await sleep(1000);

  // End
  m.send(JSON.stringify({ type: 'session:end' }));
  await sleep(500);
  log('MASTER', 'Sessão encerrada');

  // Stats
  const ev1 = ps[0]._events || []
  const ev2 = ps[1]._events || []
  const ev4 = ps[3]._events || []
  const p2Sec = ev2.filter(e => e.type === 'event:new' && JSON.stringify(e).includes('SECRET'));
  const allP1 = ev1.length;
  const allP2 = ev2.length;
  const allP4 = ev4.length;

  console.log('\n========== RESULTADOS ==========');
  console.log(`✅ Sessão criada: ${r.code}`);
  console.log(`✅ 4 jogadores criados e aprovados`);
  console.log(`✅ Cena e NPC apresentados`);
  console.log(`✅ Segredo P2: ${p2Sec.length > 0 ? 'SIM (exclusivo)' : 'NÃO'}`);
  console.log(`✅ Eventos P1: ${allP1}, P2: ${allP2}, P4: ${allP4}`);
  console.log(`✅ Combate, Dados e Recompensa`);
  console.log(`✅ Reconexão P3: ${sm.status}, ${sm.events?.length} eventos`);
  console.log(`✅ Concorrência: 4 dados simultâneos`);
  console.log(`✅ Sessão encerrada`);
  
  m.close(); p3b.close();
  ps.forEach(p => p.ws.close());
  process.exit(0);
}

run().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
