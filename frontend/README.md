# Frontend

SPA на React 19 + TypeScript + Vite. Данные — REST API Django (`../backend`).
Раскладка проекта и переменные окружения — в корневом README.

## Команды

Зависимости:

```bash
bun install
```

Дев-сервер на http://localhost:5173, вход `master` / `1234`. Запросы `/api`,
`/api-auth`, `/admin` и `/static` проксируются на Django (`BACKEND_URL`, см. `.env.example`):

```bash
bun run dev
```

Тесты — Vitest в jsdom, бэкенд не нужен:

```bash
bun run test
```

Один файл или один тест по имени:

```bash
bun run test src/api/client.test.ts
```

Типы и линтер:

```bash
bun run typecheck
```

```bash
bun run lint
```

Сборка в `dist/` и просмотр собранного:

```bash
bun run build
```

```bash
bun run preview
```

Прод-связка целиком (Caddy с этой сборкой + Django + Postgres) на http://localhost:8080:

```bash
docker compose -f ../compose.prod.yaml up -d --build
```
