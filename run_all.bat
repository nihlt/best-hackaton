@echo off
setlocal

cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python is required but was not found in PATH.
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required but was not found in PATH.
  exit /b 1
)

if not exist ".venv" (
  echo Creating Python virtual environment...
  python -m venv .venv
)

call ".venv\Scripts\activate.bat"
if errorlevel 1 exit /b 1

echo Installing Python dependencies...
python -m pip install --upgrade pip
if errorlevel 1 exit /b 1
python -m pip install -r requirements.txt
if errorlevel 1 exit /b 1

echo Installing frontend dependencies...
pushd src\viewer\frontend
call npm install
if errorlevel 1 (
  popd
  exit /b 1
)
popd

echo Generating pipeline outputs for all scenarios...
node scripts\generate-viewer-data.js
if errorlevel 1 exit /b 1

echo Starting frontend at http://localhost:5173
pushd src\viewer\frontend
call npm run dev
popd

endlocal
