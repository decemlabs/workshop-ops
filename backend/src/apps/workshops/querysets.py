from django.db.models import Count, IntegerField, OuterRef, Q, QuerySet, Subquery
from django.db.models.functions import Coalesce

from .models import Task

ACTIVE_TASK = Q(tasks__is_active=True)


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


def _workshop_task_count(condition: Q) -> Coalesce:
    """Скалярный подзапрос со счётчиком задач цеха"""
    counted = (
        Task.objects.filter(
            Q(worker__workshop=OuterRef('pk'), worker__is_active=True, is_active=True) & condition
        )
        .order_by()
        .values('worker__workshop')
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
