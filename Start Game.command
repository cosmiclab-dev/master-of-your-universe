#!/bin/bash
# Starts the game. If macOS blocks a double-click, open Terminal, type "bash " (with a space), drag this file in, press Enter.
cd "$(dirname "$0")"
PORT=8777
ENVFILE="$HOME/Desktop/master-of-your-universe.env"
if [ ! -f "$ENVFILE" ] && [ ! -f keys.env ]; then cp keys.example.env "$ENVFILE"; echo "Created $ENVFILE. Paste your keys into it, save, and start the game again."; open -e "$ENVFILE"; fi
chmod 600 "$ENVFILE" keys.env 2>/dev/null
xattr -dr com.apple.quarantine . 2>/dev/null
if command -v python3 >/dev/null 2>&1; then
  (sleep 1.2; open "http://localhost:$PORT") &
  python3 server.py --port $PORT
else
  echo "Python 3 is needed. Install it from python.org, then run this again."
  open index.html
fi
