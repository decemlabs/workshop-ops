from django.db.models import Count, F, IntegerField, OuterRef, Q, QuerySet, Subquery, Window
from django.db.models.functions import Coalesce, RowNumber

from .models import Task, Worker

ACTIVE_TASK = Q(tasks__is_active=True)

#: Сколько столбиков загрузки помещается на карточку цеха.
WORKSHOP_CARD_WORKERS = 5


def _keep_default_ordering(queryset: QuerySet) -> QuerySet:
    return queryset.order_by(*queryset.model._meta.ordering)


def with_worker_stats(queryset: QuerySet) -> QuerySet:
    """Счётчики задач и заголовок последней задачи для каждого рабочего"""
    last_task = (
        Task.objects.filter(worker=OuterRef('pk'), is_active=True)
        .order_by('-created_at')
        .values('title')[:1]
    )

    return _keep_default_ordering(
        queryset.annotate(
            tasks_total=Count('tasks', filter=ACTIVE_TASK),
            active_tasks=Count('tasks', filter=ACTIVE_TASK & ~Q(tasks__status=Task.Status.DONE)),
            done_tasks=Count('tasks', filter=ACTIVE_TASK & Q(tasks__status=Task.Status.DONE)),
            last_task_title=Subquery(last_task),
        )
    )


def workers_for_card(limit: int = WORKSHOP_CARD_WORKERS) -> QuerySet:
    """Рабочие для столбиков карточки цеха: с каждого цеха только первые.

    На карточке рисуются пять столбиков, поэтому тянуть всех рабочих цеха
    незачем: ROW_NUMBER отрезает лишних в самом запросе.
    """
    return (
        with_worker_stats(Worker.objects.filter(is_active=True))
        .annotate(
            position=Window(
                expression=RowNumber(),
                partition_by='workshop',
                order_by=F('name').asc(),
            )
        )
        .filter(position__lte=limit)
    )


def _workshop_task_count(condition: Q) -> Coalesce:
    """Скалярный подзапрос со счётчиком задач цеха.

    Считаем по цеху самой задачи, а не по цеху её рабочего: работа принадлежит
    цеху и остаётся в загрузке, даже когда её некому делать.
    """
    counted = (
        Task.objects.filter(Q(workshop=OuterRef('pk'), is_active=True) & condition)
        .order_by()
        .values('workshop')
        .annotate(counted=Count('id'))
        .values('counted')
    )

    return Coalesce(Subquery(counted, output_field=IntegerField()), 0)


def with_workshop_stats(queryset: QuerySet) -> QuerySet:
    done = Q(status=Task.Status.DONE)

    return _keep_default_ordering(
        queryset.annotate(
            workers_count=Count('workers', filter=Q(workers__is_active=True)),
            active_tasks=_workshop_task_count(~done),
            done_tasks=_workshop_task_count(done),
        )
    )
