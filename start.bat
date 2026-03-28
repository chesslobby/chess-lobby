@echo off
echo Starting Chess Lobby...
echo.

:: Start Backend Server
start "BACKEND - Chess Lobby Server" cmd /k "cd /d C:\Users\akash\Downloads\royal-chess-monorepo\royal-chess\apps\server && npx tsx src/index.ts"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak

:: Start Frontend
start "FRONTEND - Chess Lobby Web" cmd /k "cd /d C:\Users\akash\Downloads\royal-chess-monorepo\royal-chess\apps\web && npx next dev"

echo.
echo Both servers starting...
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
pause
