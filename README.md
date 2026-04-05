# best-hackaton

Демо-проєкт для хакатону: логістичний decision-support pipeline з AI-аналізом, оптимізацією та веб-інтерфейсом для перегляду сценаріїв.

## Requirements

- Python 3.11+
- Node.js 20+
- npm
- Windows

## Quick start

1. Створіть у корені проєкту файл `.env`:

```env
API_KEY=your_real_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

2. Для першого запуску виконайте:

```bat
run_all.bat
```

3. Відкрийте:

```text
http://localhost:5173
```

`run_all.bat` сам:

- створить `.venv`, якщо його ще немає
- поставить Python-залежності
- поставить frontend-залежності
- згенерує demo-дані
- запустить frontend

Для наступних запусків достатньо:

```bat
run.bat
```

## API key

Репозиторій публічний, тому ключ у git не зберігається. Я передам його окремо тим, хто буде перевіряти рішення.

Якщо `.env` не створювати, проєкт все одно стартує, але AI-частина перейде у fallback-режим.

## Manual run

```powershell
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd src\viewer\frontend
npm install
cd ..\..\..
node scripts\generate-viewer-data.js
cd src\viewer\frontend
npm run dev
```

## Scenarios

- `normal`
- `demand_spike`
- `blocked_route`

## CLI

```powershell
node src/cli/index.js list-scenarios
node src/cli/index.js run normal
node src/cli/index.js run demand_spike
node src/cli/index.js run blocked_route
node src/cli/index.js verify
```

## Structure

- `contracts/` - JSON contracts
- `scenarios/` - demo inputs
- `pipeline/` - generated artifacts
- `scripts/` - helper scripts
- `src/modules/ai/` - AI module
- `src/modules/optimizer/` - optimizer module
- `src/viewer/frontend/` - web UI
