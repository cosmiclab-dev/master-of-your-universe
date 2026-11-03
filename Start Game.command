#!/bin/bash
# Double-click to play. Starts the local game server and opens the game in your browser.
cd "$(dirname "$0")"
PORT=8777
if [ ! -f keys.env ]; then cp keys.example.env keys.env; chmod 600 keys.env; echo "Created keys.env. Paste your Google AI Studio key into it, save, and run Start Game again."; open -e keys.env; fi
chmod 600 keys.env 2>/dev/null
if command -v python3 >/dev/null 2>&1; then
  (sleep 1.2; open "http://localhost:$PORT") &
  python3 server.py --port $PORT
else
  echo "Python 3 not found, opening the game without the server (AI edits from saved images need the server)."
  open index.html
fi
