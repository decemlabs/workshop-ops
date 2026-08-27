import pytest
from django.db.models import ProtectedError
from rest_framework.test import APIClient

from apps.users.models import User

from .models import Task, Worker, Workshop

"""
pytest-django позволяет использовать функции с фикстурами,
поэтому используем их т.к. это проще и без self.
"""


@pytest.fixture
def workshop(db):
    return Workshop.objects.create(name='Сборочный')


@pytest.fixture
def worker(workshop):
    return Worker.objects.create(name='Иванов', workshop=workshop)


@pytest.fixture
def api(db):
    client = APIClient()
    client.force_authenticate(
        User.objects.create_user('master')
    )  # force_authenticate подставляет пользователя напрямую, минуя логин и проверку пароля

    return client


def test_protect_forbids_deleting_workshop_with_workers(workshop, worker):
    with pytest.raises(ProtectedError):
        workshop.delete()


def test_deactivated_worker_keeps_tasks(worker):
    Task.objects.create(title='Покрасить раму', worker=worker)
    worker.is_active = False
    worker.save()

    assert worker.tasks.count() == 1  # история цела
    assert Worker.objects.filter(is_active=True).count() == 0  # из списков исчез


def test_api_requires_authentication():
    response = APIClient().get('/api/workshops/')

    assert response.status_code == 403  # pyright: ignore[reportAttributeAccessIssue]


def test_api_lists_workshops_paginated(api, workshop):
    response = api.get('/api/workshops/')

    assert response.status_code == 200
    assert response.json()['count'] == 1
    assert response.json()['results'][0]['name'] == 'Сборочный'


def test_api_creates_task(api, worker):
    response = api.post('/api/tasks/', {'title': 'Заменить фильтр', 'worker': worker.pk})

    assert response.status_code == 201
    assert response.json()['worker_name'] == 'Иванов'
    assert Task.objects.count() == 1


def test_api_hides_deactivated_workers_by_default(api, worker):
    worker.is_active = False
    worker.save()

    response = api.get('/api/workers/')

    assert response.json()['count'] == 0


def test_api_returns_deactivated_workers_on_request(api, worker):
    worker.is_active = False
    worker.save()

    assert api.get('/api/workers/?is_active=false').json()['count'] == 1
    assert api.get('/api/workers/?is_active=all').json()['count'] == 1


def test_api_rejects_unknown_is_active_value(api, worker):
    response = api.get('/api/workers/?is_active=да')

    assert response.status_code == 400
    assert 'is_active' in response.json()


def test_api_forbids_assigning_task_to_deactivated_worker(api, worker):
    worker.is_active = False
    worker.save()

    response = api.post('/api/tasks/', {'title': 'Заменить фильтр', 'worker': worker.pk})

    assert response.status_code == 400
    assert 'worker' in response.json()
    assert Task.objects.count() == 0


def test_api_allows_editing_task_of_deactivated_worker(api, worker):
    """Уволенный не мешает править старые задачи: worker в PATCH не приходит,
    поэтому validate_worker не срабатывает.
    """
    task = Task.objects.create(title='Собрать раму', worker=worker)
    worker.is_active = False
    worker.save()

    response = api.patch(f'/api/tasks/{task.pk}/', {'completed': True})

    assert response.status_code == 200
    assert response.json()['completed'] is True
