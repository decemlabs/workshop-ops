import pytest
from django.core.exceptions import ValidationError
from django.db import connection
from django.db.models import ProtectedError
from django.test.utils import CaptureQueriesContext
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


def test_task_code_is_generated_on_create(worker):
    task = Task.objects.create(title='Собрать раму', worker=worker)

    assert task.code == f'ЗН-{4800 + task.pk}'


def test_task_code_survives_updates(worker):
    task = Task.objects.create(title='Собрать раму', worker=worker)
    code = task.code

    task.status = Task.Status.DONE
    task.save()
    task.refresh_from_db()

    assert task.code == code


def test_task_code_does_not_bump_updated_at(worker):
    with CaptureQueriesContext(connection) as queries:
        Task.objects.create(title='Собрать раму', worker=worker)

    updates = [q['sql'] for q in queries.captured_queries if q['sql'].startswith('UPDATE')]

    assert len(updates) == 1
    assert 'updated_at' not in updates[0]


def test_api_searches_tasks_by_code(api, worker):
    task = Task.objects.create(title='Собрать раму', worker=worker)
    Task.objects.create(title='Заменить фильтр', worker=worker)

    response = api.get(f'/api/tasks/?search={task.code}')

    assert response.json()['count'] == 1
    assert response.json()['results'][0]['code'] == task.code


def test_api_delete_workshop_soft_deletes_cascade(api, shift):
    response = api.delete(f'/api/workshops/{shift["hot"].pk}/')

    assert response.status_code == 204
    assert not Workshop.objects.get(pk=shift['hot'].pk).is_active
    assert not Worker.objects.get(pk=shift['ivanov'].pk).is_active
    assert Task.objects.filter(worker=shift['ivanov'], is_active=True).count() == 0
    # Соседний цех не задет.
    assert Worker.objects.get(pk=shift['petrov'].pk).is_active


def test_soft_delete_marks_everything_with_one_batch(api, shift):
    api.delete(f'/api/workshops/{shift["hot"].pk}/')

    batches = {Workshop.objects.get(pk=shift['hot'].pk).deleted_batch}
    batches |= {Worker.objects.get(pk=shift['ivanov'].pk).deleted_batch}
    batches |= set(
        Task.objects.filter(worker=shift['ivanov']).values_list('deleted_batch', flat=True)
    )

    assert len(batches) == 1
    assert None not in batches


def test_restore_brings_back_the_whole_batch(api, shift):
    api.delete(f'/api/workshops/{shift["hot"].pk}/')

    response = api.post('/api/workshops/restore/', {'ids': [shift['hot'].pk]})

    assert response.status_code == 200
    assert response.json()['updated'] == 9  # цех + рабочий + 7 задач
    assert Workshop.objects.get(pk=shift['hot'].pk).is_active
    assert Worker.objects.get(pk=shift['ivanov'].pk).is_active
    assert Task.objects.filter(worker=shift['ivanov'], is_active=True).count() == 7
    assert Workshop.objects.get(pk=shift['hot'].pk).deleted_batch is None


def test_restore_does_not_revive_earlier_deactivations(api, shift):
    """Рабочий, выведенный из штата до удаления цеха, при откате не воскресает."""
    ivanov = shift['ivanov']
    ivanov.is_active = False
    ivanov.save()

    api.delete(f'/api/workshops/{shift["hot"].pk}/')
    api.post('/api/workshops/restore/', {'ids': [shift['hot'].pk]})

    assert Workshop.objects.get(pk=shift['hot'].pk).is_active
    assert not Worker.objects.get(pk=ivanov.pk).is_active


def test_restore_rejects_unknown_id(api, workshop):
    response = api.post('/api/workshops/restore/', {'ids': [workshop.pk, 9999]})

    assert response.status_code == 400
    assert 'ids' in response.json()


def test_api_hides_deactivated_tasks_by_default(api, worker):
    task = Task.objects.create(title='Собрать раму', worker=worker)

    api.delete(f'/api/tasks/{task.pk}/')

    assert api.get('/api/tasks/').json()['count'] == 0
    assert api.get('/api/tasks/?is_active=all').json()['count'] == 1


def test_workshop_stats_are_annotated(api, shift):
    by_name = {w['name']: w for w in api.get('/api/workshops/').json()['results']}

    assert by_name['Сборочный']['workers_count'] == 1
    assert by_name['Сборочный']['active_tasks'] == 7  # 5 в работе + 2 новых
    assert by_name['Сборочный']['done_tasks'] == 0
    assert by_name['Покрасочный']['done_tasks'] == 4
    assert by_name['Покрасочный']['active_tasks'] == 0


def test_workshop_stats_are_zero_not_null_without_workers(api, workshop):
    row = api.get('/api/workshops/').json()['results'][0]

    assert (row['workers_count'], row['active_tasks'], row['done_tasks']) == (0, 0, 0)


def test_workshop_stats_ignore_deactivated(api, shift):
    api.delete(f'/api/workers/{shift["ivanov"].pk}/')

    row = next(w for w in api.get('/api/workshops/').json()['results'] if w['number'] == 10)

    assert row['workers_count'] == 0
    assert row['active_tasks'] == 0


def test_workshop_card_carries_worker_load(api, shift):
    row = next(w for w in api.get('/api/workshops/').json()['results'] if w['number'] == 10)

    assert row['workers_load'] == [{'id': shift['ivanov'].pk, 'name': 'Иванов', 'active_tasks': 7}]


def test_worker_stats_are_annotated(api, shift):
    row = next(w for w in api.get('/api/workers/').json()['results'] if w['name'] == 'Иванов')

    assert row['tasks_total'] == 7
    assert row['active_tasks'] == 7
    assert row['done_tasks'] == 0
    assert row['workshop_number'] == 10


def test_worker_last_task_is_the_freshest(api, worker):
    Task.objects.create(title='Старая', worker=worker)
    Task.objects.create(title='Свежая', worker=worker)

    row = api.get('/api/workers/').json()['results'][0]

    assert row['last_task_title'] == 'Свежая'


def test_worker_last_task_is_null_without_tasks(api, worker):
    assert api.get('/api/workers/').json()['results'][0]['last_task_title'] is None


def test_worker_list_does_not_scale_queries_with_rows(api, shift):
    with CaptureQueriesContext(connection) as before:
        api.get('/api/workers/')

    for extra in range(5):
        worker = Worker.objects.create(name=f'Сидоров {extra}', workshop=shift['hot'])
        Task.objects.create(title=f'Задача {extra}', worker=worker)

    with CaptureQueriesContext(connection) as after:
        api.get('/api/workers/')

    assert len(after) == len(before)


def test_workshop_list_does_not_scale_queries_with_rows(api, shift):
    """Prefetch для workers_load: карточки не должны стоить по запросу каждая"""
    with CaptureQueriesContext(connection) as before:
        api.get('/api/workshops/')

    for extra in range(5):
        Workshop.objects.create(number=100 + extra, name=f'Цех {extra}')

    with CaptureQueriesContext(connection) as after:
        api.get('/api/workshops/')

    assert len(after) == len(before)


def test_bulk_delete_workers_reports_count(api, shift):
    response = api.post('/api/workers/bulk-delete/', {'ids': [shift['ivanov'].pk]})

    assert response.status_code == 200
    assert response.json()['updated'] == 8  # рабочий + 7 его задач
    assert api.get('/api/workers/').json()['count'] == 1


def test_bulk_delete_shares_one_batch_and_one_restore(api, shift):
    ids = [shift['ivanov'].pk, shift['petrov'].pk]
    api.post('/api/workers/bulk-delete/', {'ids': ids})

    assert api.post('/api/workers/restore/', {'ids': ids[:1]}).json()['updated'] == 13
    assert api.get('/api/workers/').json()['count'] == 2


def test_bulk_move_transfers_workers(api, shift):
    response = api.post(
        '/api/workers/bulk-move/',
        {'ids': [shift['ivanov'].pk], 'workshop': shift['cold'].pk},
    )

    assert response.json()['updated'] == 1
    assert Worker.objects.get(pk=shift['ivanov'].pk).workshop == shift['cold']


def test_bulk_move_rejects_deleted_workshop(api, shift):
    api.delete(f'/api/workshops/{shift["cold"].pk}/')

    response = api.post(
        '/api/workers/bulk-move/',
        {'ids': [shift['ivanov'].pk], 'workshop': shift['cold'].pk},
    )

    assert response.status_code == 400
    assert Worker.objects.get(pk=shift['ivanov'].pk).workshop == shift['hot']


def test_bulk_status_changes_tasks(api, shift):
    ids = list(Task.objects.filter(worker=shift['ivanov']).values_list('pk', flat=True))

    response = api.post('/api/tasks/bulk-status/', {'ids': ids, 'status': 'done'})

    assert response.json()['updated'] == 7
    assert Task.objects.filter(worker=shift['ivanov'], status='done').count() == 7


def test_bulk_status_rejects_unknown_status(api, shift):
    task = Task.objects.filter(worker=shift['ivanov']).first()

    response = api.post('/api/tasks/bulk-status/', {'ids': [task.pk], 'status': 'готово'})

    assert response.status_code == 400
    assert 'status' in response.json()


def test_bulk_operation_rolls_back_on_unknown_id(api, shift):
    ids = list(Task.objects.filter(worker=shift['ivanov']).values_list('pk', flat=True))

    response = api.post('/api/tasks/bulk-status/', {'ids': [*ids, 9999], 'status': 'done'})

    assert response.status_code == 400
    assert Task.objects.filter(status='done').count() == 4


def test_bulk_rejects_empty_ids(api, shift):
    assert api.post('/api/workers/bulk-delete/', {'ids': []}).status_code == 400


def test_page_size_is_requested_by_client(api, shift):
    for extra in range(20):
        Workshop.objects.create(number=100 + extra, name=f'Цех {extra}')

    body = api.get('/api/workshops/?page_size=12').json()

    assert len(body['results']) == 12
    assert body['count'] == 22
    assert body['next'] is not None


def test_page_size_is_capped(api, shift):
    assert api.get('/api/workshops/?page_size=1000').status_code == 200


def test_ordering_workers_by_load(api, shift):
    names = [w['name'] for w in api.get('/api/workers/?ordering=-active_tasks').json()['results']]

    assert names == ['Иванов', 'Петров']


def test_ordering_workers_by_workshop_number(api, shift):
    rows = api.get('/api/workers/?ordering=-workshop__number').json()['results']

    assert [w['workshop_number'] for w in rows] == [20, 10]


def test_ordering_tasks_by_status_follows_lifecycle(api, shift):
    statuses = [t['status'] for t in api.get('/api/tasks/?ordering=status_order').json()['results']]

    assert statuses == sorted(statuses, key=['new', 'in_progress', 'done'].index)


def test_ordering_tasks_by_workshop_number(api, shift):
    rows = api.get('/api/tasks/?ordering=worker__workshop__number&page_size=1').json()['results']

    assert rows[0]['worker_name'] == 'Иванов'
