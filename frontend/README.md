# Frontend

SPA на React 19 + TypeScript + Vite. Данные берёт из REST API Django (`../backend`).

## Запуск

```bash
bun install
bun run dev        # http://localhost:5173
```

Дев-сервер проксирует `/api`, `/api-auth`, `/admin` и `/static` на Django
(`http://127.0.0.1:8000`, переопределяется переменной `BACKEND_URL` — см. `.env.example`).
Благодаря прокси браузер видит фронт и бэк как один origin: не нужны ни CORS,
ни `CSRF_TRUSTED_ORIGINS`, сессионная кука ставится обычным способом.

Скрипты: `dev`, `build`, `preview`, `typecheck`, `lint`.

## Структура

```
src/
  api/
    client.ts       fetch-обёртка: базовый URL, X-CSRFToken, ApiError с разбором ошибок DRF
    types.ts        типы моделей, входных данных и query-параметров
    resources.ts    CRUD по /workshops/, /workers/, /tasks/ (+ /tasks/summary/)
  hooks/
    createResourceHooks.ts  фабрика react-query хуков (список, деталь, create/update/delete)
    useWorkshops.ts / useWorkers.ts / useTasks.ts
  app/
    App.tsx         провайдеры (react-query + роутер)
    router.tsx      маршруты
    queryClient.ts  настройки кэша и ретраев
  components/       Layout, QueryState (загрузка/ошибка)
  pages/            заготовки страниц под будущие шаблоны
```

Алиас `@/` указывает на `src/` (настроен в `vite.config.ts` и `tsconfig.app.json`).

## Маршруты

| Путь          | Страница         |
| ------------- | ---------------- |
| `/`           | редирект на `/tasks` |
| `/workshops`  | цеха             |
| `/workers`    | рабочие          |
| `/tasks`      | задачи           |
| остальное     | 404              |

## Куда класть готовые шаблоны

Разметка страниц в `src/pages/*` — временная заготовка: она только показывает,
что данные доходят. Готовый html переносим в JSX соответствующей страницы,
его css — рядом с компонентом (`Тasks.css` + `import './Tasks.css'`) или в
`src/index.css`, если стили общие. Хуки данных и API-слой при этом не меняются.

## Авторизация

API отдаёт данные только авторизованным (`IsAuthenticated` + `SessionAuthentication`).
Пока на фронте нет формы входа: залогиниться можно через `/admin/` или `/api-auth/login/`
(они проксируются), после чего SPA работает по той же сессионной куке.
Изменяющие запросы шлют `X-CSRFToken` из куки `csrftoken`, если она уже выставлена Django.
