@echo off
rem CortexSkills (executable, Windows) : cortexskills start ^| admin ^<commande^> ^| backup ^| restore [fichier] ^| version
rem Utilise le Node.js livre dans runtime\node-windows ; reglages dans .env, donnees dans data\ (a cote de ce fichier).
setlocal
set "DIR=%~dp0"
if not exist "%DIR%runtime\node-windows\node.exe" (echo   ERREUR : Node.js livre introuvable ^(%DIR%runtime\node-windows^). & exit /b 1)
"%DIR%runtime\node-windows\node.exe" --no-warnings "%DIR%app\server\tools\launcher.js" %*
exit /b %ERRORLEVEL%
