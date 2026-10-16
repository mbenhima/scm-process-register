@echo off
rem CortexSkills (executable, Windows) : cortexskills start ^| admin ^<commande^> ^| secrets ^| backup ^| restore [fichier] ^| version
rem Node.js 22.13 ou plus recent est necessaire (installeur officiel nodejs.org) ; reglages dans .env, donnees dans data\.
setlocal
set "DIR=%~dp0"
set "NODE=%CORTEXSKILLS_NODE%"
if "%NODE%"=="" for %%N in (node.exe) do set "NODE=%%~$PATH:N"
if "%NODE%"=="" (echo   ERROR / ERREUR : Node.js 22 not found / introuvable. Install Node.js 22 LTS from https://nodejs.org, then reopen the command prompt. & exit /b 1)
"%NODE%" --no-warnings "%DIR%app\server\tools\launcher.js" %*
exit /b %ERRORLEVEL%
