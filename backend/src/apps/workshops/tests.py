import pytest
from django.core.exceptions import ValidationError
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
    return Workshop.objects.create(number=10, name='Сборочный')


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
    task = Task.objects.create(title='Собрать раму', worker=worker)
    worker.is_active = False
    worker.save()

    response = api.patch(f'/api/tasks/{task.pk}/', {'status': Task.Status.DONE})

    assert response.status_code == 200
    assert response.json()['status'] == 'done'


def test_task_status_defaults_to_new(worker):
    assert Task.objects.create(title='Собрать раму', worker=worker).status == Task.Status.NEW


def test_timestamps_are_filled_and_updated(worker):
    task = Task.objects.create(title='Собрать раму', worker=worker)
    created, updated = task.created_at, task.updated_at

    task.status = Task.Status.DONE
    task.save()
    task.refresh_from_db()

    assert task.created_at == created
    assert task.updated_at > updated


def test_clean_forbids_new_task_for_deactivated_worker(worker):
    """Уровень модели: то же правило, что в сериализаторе, но для админки."""
    worker.is_active = False
    worker.save()

    with pytest.raises(ValidationError):
        Task(title='Заменить фильтр', worker=worker).full_clean()


def test_clean_allows_saving_existing_task_of_deactivated_worker(worker):
    task = Task.objects.create(title='Собрать раму', worker=worker)
    worker.is_active = False
    worker.save()

    task.status = Task.Status.DONE
    task.full_clean()  # не должно бросить
    task.save()

    assert task.status == Task.Status.DONE


def test_api_serialises_timestamps(api, workshop):
    fields = api.get('/api/workshops/').json()['results'][0]

    assert 'created_at' in fields
    assert 'updated_at' in fields


@pytest.fixture
def shift(db):
    """Смена как на макете сводки: 5 в работе, 2 новых, 4 выполненных."""
    hot = Workshop.objects.create(number=10, name='Сборочный')
    cold = Workshop.objects.create(number=20, name='Покрасочный')
    ivanov = Worker.objects.create(name='Иванов', workshop=hot)
    petrov = Worker.objects.create(name='Петров', workshop=cold)

    for i in range(5):
        Task.objects.create(title=f'В работе {i}', worker=ivanov, status=Task.Status.IN_PROGRESS)
    for i in range(2):
        Task.objects.create(title=f'Новая {i}', worker=ivanov, status=Task.Status.NEW)
    for i in range(4):
        Task.objects.create(title=f'Выполнена {i}', worker=petrov, status=Task.Status.DONE)
    return {'hot': hot, 'cold': cold, 'ivanov': ivanov, 'petrov': petrov}


def test_summary_counts_by_status(api, shift):
    body = api.get('/api/tasks/summary/').json()

    assert body['total'] == 11
    assert {i['status']: i['count'] for i in body['by_status']} == {
        'new': 2,
        'in_progress': 5,
        'done': 4,
    }


def test_summary_includes_statuses_without_tasks(api, worker):
    Task.objects.create(title='Одна', worker=worker, status=Task.Status.NEW)

    body = api.get('/api/tasks/summary/').json()

    assert len(body['by_status']) == 3
    assert {i['status']: i['count'] for i in body['by_status']}['done'] == 0


def test_summary_respects_filters(api, shift):
    body = api.get(f'/api/tasks/summary/?worker__workshop={shift["cold"].pk}').json()

    assert body['total'] == 4
    assert {i['status']: i['count'] for i in body['by_status']}['done'] == 4


def test_filter_tasks_by_status(api, shift):
    assert api.get('/api/tasks/?status=in_progress').json()['count'] == 5


def test_filter_workers_by_workshop(api, shift):
    response = api.get(f'/api/workers/?workshop={shift["hot"].pk}')

    assert response.json()['count'] == 1
    assert response.json()['results'][0]['name'] == 'Иванов'


def test_search_workers_by_name(api, shift):
    assert api.get('/api/workers/?search=Петр').json()['count'] == 1


def test_search_tasks_by_worker_name(api, shift):
    assert api.get('/api/tasks/?search=Петров').json()['count'] == 4


def test_ordering_tasks_by_title(api, shift):
    titles = [t['title'] for t in api.get('/api/tasks/?ordering=title').json()['results']]

    assert titles == sorted(titles)


def test_summary_labels_match_design(api, shift):
    """Подписи статусов приходят с бэкенда"""
    body = api.get('/api/tasks/summary/').json()

    assert {i['status']: i['label'] for i in body['by_status']} == {
        'new': 'Новая',
        'in_progress': 'В работе',
        'done': 'Выполнено',
    }


def test_api_serialises_workshop_number(api, workshop):
    assert api.get('/api/workshops/').json()['results'][0]['number'] == 10


def test_api_rejects_duplicate_workshop_number(api, workshop):
    response = api.post('/api/workshops/', {'number': 10, 'name': 'Ещё один'})

    assert response.status_code == 400
    assert 'number' in response.json()


def test_api_filters_workshops_by_number(api, shift):
    response = api.get('/api/workshops/?number=20')

    assert response.json()['count'] == 1
    assert response.json()['results'][0]['name'] == 'Покрасочный'


def test_api_orders_workshops_by_number(api, shift):
    numbers = [w['number'] for w in api.get('/api/workshops/?ordering=-number').json()['results']]

    assert numbers == [20, 10]
