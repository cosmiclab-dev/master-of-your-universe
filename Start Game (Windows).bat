@echo off
cd /d "%~dp0"
where python >nul 2>nul && (start "" http://localhost:8777 & python server.py --port 8777) || start "" index.html
