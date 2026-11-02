#!/bin/bash
# Double-click to play. Starts the local game server and opens the game in your browser.
cd "$(dirname "$0")"
PORT=8777
if command -v python3 >/dev/null 2>&1; then
  (sleep 1.2; open "http://localhost:$PORT") &
  python3 server.py --port $PORT
else
  echo "Python 3 not found, opening the game without the server (AI edits from saved images need the server)."
  open index.html
fi
