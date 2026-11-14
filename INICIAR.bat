@echo off
title Pipoquetas
cd /d "%~dp0"
echo Iniciando o Pipoquetas...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"
echo.
echo O servidor parou. Se apareceu algum erro acima, tire um print.
pause
