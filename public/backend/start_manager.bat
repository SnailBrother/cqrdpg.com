@echo off
cd /d C:\cyywork\html\backend
echo Starting Server Manager...
start "ServerManager" cmd /c "node restart_manager.js"
echo Server Manager started, will restart server every hour
echo Close this window will not affect the manager