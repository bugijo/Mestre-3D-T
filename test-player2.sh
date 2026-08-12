#!/bin/bash
cd /media/giovanni/HD/Projetos/RPG/app

# Start master in background
node server/virtual-table-master-full.mjs > master.log 2>&1 &
MASTER_PID=$!

# Wait for master to create session
sleep 5

# Get session code from log
SESSION_CODE=$(grep "CÓDIGO DA SESSÃO:" master.log | tail -1 | sed 's/.*: //' | sed 's/ ===.*//')
echo "Session Code: $SESSION_CODE"

# Run player
if [ -n "$SESSION_CODE" ]; then
    SESSION_CODE=$SESSION_CODE node server/virtual-table-player-2-sim.mjs 2>&1
    PLAYER_EXIT=$?
else
    echo "Error: Could not get session code"
    cat master.log
    PLAYER_EXIT=1
fi

# Kill master
kill $MASTER_PID 2>/dev/null

exit $PLAYER_EXIT