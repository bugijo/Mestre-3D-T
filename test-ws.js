const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4173/ws');

ws.on('open', () => {
  console.log('Connected to WebSocket');
  
  // Test host:create
  ws.send(JSON.stringify({
    type: 'host:create',
    campaignId: 'test-campaign',
    campaignTitle: 'Teste Sessão',
    projection: null
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('Received:', msg.type);
  
  if (msg.type === 'host:ready') {
    console.log('Session created with code:', msg.code);
    console.log('Master token:', msg.masterToken);
    
    // Test player:join
    const ws2 = new WebSocket('ws://localhost:4173/ws');
    ws2.on('open', () => {
      ws2.send(JSON.stringify({
        type: 'player:join',
        code: msg.code,
        playerName: 'Jogador Teste'
      }));
    });
    ws2.on('message', (data2) => {
      const msg2 = JSON.parse(data2.toString());
      console.log('Player received:', msg2.type);
      if (msg2.type === 'player:status') {
        console.log('Player status:', msg2.participant.status);
      }
    });
    ws2.on('error', (err) => console.error('Player WS error:', err));
  }
});

ws.on('error', (err) => console.error('WS error:', err));
ws.on('close', () => console.log('WS closed'));

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
