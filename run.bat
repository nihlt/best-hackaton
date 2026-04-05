@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required but was not found in PATH.
  exit /b 1
)

if not defined PYTHON_BIN (
  if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_BIN=%~dp0.venv\Scripts\python.exe"
  )
)

if not exist "src\viewer\frontend\node_modules" (
  echo Missing frontend dependencies.
  echo Run once: cd src\viewer\frontend ^&^& npm install
  exit /b 1
)

echo Generating viewer data...
node scripts\generate-viewer-data.js
if errorlevel 1 exit /b 1

echo Starting frontend at http://localhost:5173
pushd src\viewer\frontend
call npm run dev
set "EXIT_CODE=%ERRORLEVEL%"
popd

exit /b %EXIT_CODE%
