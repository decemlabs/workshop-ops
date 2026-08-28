# Сокращения для частых команд

COMPOSE_PROD = docker compose -f compose.prod.yaml

.DEFAULT_GOAL = help

.PHONY: help install db migrate back front test test-back test-front lint typecheck check e2e e2e-install up down logs superuser clean

help: ## показать этот список
	@grep -E '^[a-z0-9-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-11s %s\n", $$1, $$2}'

# --- разработка ---

install: ## поставить зависимости бэка и фронта
	cd backend && uv sync
	cd frontend && bun install

db: ## поднять Postgres для разработки
	docker compose up -d

migrate: ## накатить миграции локально
	cd backend && uv run manage.py migrate

back: ## Django на http://localhost:8000
	cd backend && uv run manage.py runserver

front: ## Vite на http://localhost:5173
	cd frontend && bun run dev

# --- проверки ---

test: test-back test-front ## все тесты

test-back: ## pytest
	cd backend && uv run pytest

test-front: ## vitest
	cd frontend && bun run test

lint: ## ruff и eslint
	cd backend && uv run ruff check src
	cd e2e && uv run ruff check .
	cd frontend && bun run lint

typecheck: ## tsc
	cd frontend && bun run typecheck

check: lint typecheck test ## линтеры, типы и тесты — как перед коммитом

e2e-install: ## поставить браузер для e2e (один раз, ~150 МБ)
	cd e2e && uv sync && uv run playwright install chromium

e2e: ## поднять связку и прогнать браузерные тесты
	$(COMPOSE_PROD) up -d --build
	cd e2e && uv run pytest

# --- прод-связка ---

up: ## собрать и поднять прод-связку на http://localhost:8080
	$(COMPOSE_PROD) up -d --build

down: ## остановить прод-связку, данные оставить
	$(COMPOSE_PROD) down

logs: ## смотреть логи прод-связки
	$(COMPOSE_PROD) logs -f

superuser: ## завести пользователя в прод-связке
	$(COMPOSE_PROD) exec backend python manage.py createsuperuser

clean: ## остановить прод-связку и удалить данные
	$(COMPOSE_PROD) down -v
