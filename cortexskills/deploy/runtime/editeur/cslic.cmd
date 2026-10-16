@echo off
rem Gestionnaire de licences CortexSkills (poste de signature, Windows). « cslic aide » pour la liste des commandes.
rem Cles, registre et licences dans CSLIC_HOME (par defaut %USERPROFILE%\.cortexskills-editeur), jamais sur un serveur.
setlocal
set "DIR=%~dp0"
if "%CSLIC_HOME%"=="" set "CSLIC_HOME=%USERPROFILE%\.cortexskills-editeur"
if not exist "%CSLIC_HOME%" mkdir "%CSLIC_HOME%"
"%DIR%runtime\node-windows\node.exe" --no-warnings "%DIR%app\tools\cslic.mjs" %*
exit /b %ERRORLEVEL%
