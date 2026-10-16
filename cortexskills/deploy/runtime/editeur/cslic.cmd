@echo off
rem Gestionnaire de licences CortexSkills (poste de signature, Windows). « cslic aide » pour la liste des commandes.
rem Cles, registre et licences dans CSLIC_HOME (par defaut %USERPROFILE%\.cortexskills-editeur), jamais sur un serveur.
setlocal
set "DIR=%~dp0"
set "NODE=%CORTEXSKILLS_NODE%"
if "%NODE%"=="" for %%N in (node.exe) do set "NODE=%%~$PATH:N"
if "%NODE%"=="" (echo   ERROR / ERREUR : Node.js 22 not found / introuvable. Install Node.js 22 LTS from https://nodejs.org. & exit /b 1)
if "%CSLIC_HOME%"=="" set "CSLIC_HOME=%USERPROFILE%\.cortexskills-editeur"
if not exist "%CSLIC_HOME%" mkdir "%CSLIC_HOME%"
"%NODE%" --no-warnings "%DIR%app\tools\cslic.mjs" %*
exit /b %ERRORLEVEL%
