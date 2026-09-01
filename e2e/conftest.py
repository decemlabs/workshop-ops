"""
Фикстуры браузерных тестов.

Тесты идут в уже поднятую связку (`compose.prod.yaml`) по http, как обычный
пользователь. Данные готовятся через REST API — тем же способом, что и во фронте:
сначала GET /api/auth/me/ за csrftoken, дальше заголовок X-CSRFToken на каждый
изменяющий запрос.
"""

import os
import subprocess
import time
from collections.abc import Iterator
from pathlib import Path
from uuid import uuid4

import pytest
import requests
from playwright.sync_api import Page, expect

ROOT = Path(__file__).resolve().parent.parent
COMPOSE = ['docker', 'compose', '-f', str(ROOT / 'compose.prod.yaml')]

USER = os.environ.get('E2E_USER', 'e2e')
PASSWORD = os.environ.get('E2E_PASSWORD', 'e2e-Passw0rd')
BOOTSTRAP = os.environ.get('E2E_BOOTSTRAP', '1') != '0'
# Браузер по умолчанию видно. E2E_HEADLESS=1 — для запуска без экрана (CI, ssh).
HEADLESS = os.environ.get('E2E_HEADLESS', '0') == '1'

# Свой диапазон номеров цехов, чтобы не спорить с данными, заведёнными руками.
NUMBERS = iter(range(900, 999))


@pytest.fixture(scope='session')
def browser_type_launch_args(browser_type_launch_args: dict) -> dict:
    """Окно браузера на экране: за прогоном видно, что происходит."""
    return {**browser_type_launch_args, 'headless': HEADLESS}


@pytest.fixture(scope='session')
def base_url() -> str:
    """Адрес связки. Переопределяет фикстуру pytest-playwright: page.goto('/') идёт сюда."""
    return os.environ.get('E2E_BASE_URL', 'http://localhost:8080')


@pytest.fixture(scope='session', autouse=True)
def stack(base_url: str) -> None:
    """Ждёт связку: на старте контейнера идут миграции и collectstatic."""
    deadline = time.monotonic() + 90

    while time.monotonic() < deadline:
        try:
            requests.get(f'{base_url}/api/auth/me/', timeout=3)
            return
        except requests.RequestException:
            time.sleep(2)

    raise pytest.UsageError(
        f'{base_url} не отвечает. Поднимите связку: make up (или укажите E2E_BASE_URL).'
    )


@pytest.fixture(scope='session')
def credentials() -> tuple[str, str]:
    """Пользователь для входа. Заводит его в связке, если его там ещё нет."""
    if BOOTSTRAP:
        subprocess.run(
            [
                *COMPOSE,
                'exec',
                '-T',
                '-e',
                f'DJANGO_SUPERUSER_PASSWORD={PASSWORD}',
                'backend',
                'python',
                'manage.py',
                'createsuperuser',
                '--noinput',
                '--username',
                USER,
            ],
            capture_output=True,  # «username is already taken» — ожидаемо на втором прогоне
            check=False,
        )

    return USER, PASSWORD


class Api:
    """Клиент REST API для подготовки данных."""

    def __init__(self, base_url: str, credentials: tuple[str, str]) -> None:
        self.base_url = base_url
        self.session = requests.Session()

        self.session.get(f'{base_url}/api/auth/me/', timeout=10)  # ставит csrftoken
        username, password = credentials
        response = self.post('/auth/login/', {'username': username, 'password': password})
        response.raise_for_status()

    def post(self, path: str, payload: dict) -> requests.Response:
        return self.session.post(
            f'{self.base_url}/api{path}',
            json=payload,
            # Куку читаем заново на каждый запрос: Django ротирует токен при входе.
            headers={'X-CSRFToken': self.session.cookies.get('csrftoken', '')},
            timeout=10,
        )

    def create(self, resource: str, payload: dict) -> dict:
        response = self.post(f'/{resource}/', payload)
        assert response.status_code == 201, f'{resource}: {response.status_code} {response.text}'
        return response.json()


@pytest.fixture(scope='session')
def api(base_url: str, credentials: tuple[str, str]) -> Api:
    return Api(base_url, credentials)


class Data:
    """
    Фабрика записей с уборкой.

    Имена уникальны, поэтому прогоны не мешают друг другу и чужим данным на стенде.
    """

    def __init__(self, api: Api) -> None:
        self.api = api
        self.created: dict[str, list[int]] = {'tasks': [], 'workers': [], 'workshops': []}

    def workshop(self, name: str | None = None) -> dict:
        row = self.api.create(
            'workshops',
            {'name': name or f'Цех {uuid4().hex[:6]}', 'number': next(NUMBERS)},
        )
        self.created['workshops'].append(row['id'])
        return row

    def worker(self, workshop: dict | None = None, name: str | None = None) -> dict:
        row = self.api.create(
            'workers',
            {
                'name': name or f'Рабочий {uuid4().hex[:6]}',
                'workshop': (workshop or self.workshop())['id'],
            },
        )
        self.created['workers'].append(row['id'])
        return row

    def task(self, worker: dict, title: str | None = None, status: str = 'new') -> dict:
        row = self.api.create(
            'tasks',
            {
                'title': title or f'Задача {uuid4().hex[:6]}',
                # Цех у задачи свой: берём его у рабочего, чтобы вызовы не менялись.
                'workshop': worker['workshop'],
                'worker': worker['id'],
                'status': status,
            },
        )
        self.created['tasks'].append(row['id'])
        return row

    def free_number(self) -> int:
        return next(NUMBERS)

    def adopt(self, resource: str, search: str) -> None:
        """Берёт на уборку записи, созданные не через API, а руками в интерфейсе."""
        response = self.api.session.get(
            f'{self.api.base_url}/api/{resource}/', params={'search': search}, timeout=10
        )
        self.created[resource].extend(row['id'] for row in response.json()['results'])

    def cleanup(self) -> None:
        # Задачи первыми: удаление цеха каскадом гасит и рабочих, и их задачи.
        for resource, ids in self.created.items():
            if ids:
                self.api.post(f'/{resource}/bulk-delete/', {'ids': ids})


@pytest.fixture
def data(api: Api) -> Iterator[Data]:
    factory = Data(api)
    yield factory
    factory.cleanup()


def field(page: Page, caption: str):
    """
    Поле модалки по его подписи.

    Подписи там — обычные div без label и aria-label, поэтому берём соседний элемент:
    так селектор переживает смену placeholder и порядка полей.
    """
    label = page.get_by_text(caption, exact=True)
    return label.locator('xpath=following-sibling::input | following-sibling::select')


def select_with_option(page: Page, option: str):
    """
    Фильтр по его первому пункту («Все рабочие», «Все цеха», «Все статусы»).

    У фильтров нет ни label, ни aria-label, а брать их по порядку на экране хрупко:
    порядок полей меняется чаще, чем подписи.
    """
    return page.locator(f'select:has(option:text-is("{option}"))')


def rows(page: Page, kind: str):
    """Строки списка. Нужны, чтобы «В работе» из сводки и из <option> не считались за строку."""
    return page.locator(f'[data-row="{kind}"]')


def sign_in(page: Page, credentials: tuple[str, str]) -> None:
    username, password = credentials

    page.goto('/workshops')
    page.get_by_label('ЛОГИН').fill(username)
    page.get_by_label('ПАРОЛЬ').fill(password)
    page.get_by_role('button', name='Войти').click()
    expect(page.get_by_text('Вход в систему')).to_have_count(0)


@pytest.fixture
def signed_in(page: Page, credentials: tuple[str, str]) -> Page:
    sign_in(page, credentials)
    return page
