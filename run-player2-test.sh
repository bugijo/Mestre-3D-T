#!/bin/bash
cd /media/giovanni/HD/Projetos/RPG/app

# Iniciar MASTER-FULL-SIM em background
node server/virtual-table-master-full.mjs > master.log 2>&1 &
MASTER_PID=$!

# Aguardar MASTER criar sessão
sleep 5

# Extrair código da sessão do log
SESSION_CODE=$(grep "CÓDIGO DA SESSÃO:" master.log | tail -1 | sed 's/.*: //' | sed 's/ ===.*//')
echo "Session Code: $SESSION_CODE"

# Rodar PLAYER-2-SIM
if [ -n "$SESSION_CODE" ]; then
    SESSION_CODE=$SESSION_CODE node server/virtual-table-player-2-sim.mjs 2>&1
    PLAYER_EXIT=$?
else
    echo "Erro: Não conseguiu obter código da sessão"
    cat master.log
    PLAYER_EXIT=1
fi

# Matar MASTER
kill $MASTER_PID 2>/dev/null

exit $PLAYER_EXIT