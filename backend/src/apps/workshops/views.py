from uuid import UUID, uuid4

from django.db import transaction
from django.db.models import Case, Count, IntegerField, Prefetch, QuerySet, When
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Task, Worker, Workshop
from .querysets import with_worker_stats, with_workshop_stats, workers_for_card
from .serializers import (
    BulkIdsSerializer,
    BulkMoveSerializer,
    BulkStatusSerializer,
    TaskSerializer,
    WorkerSerializer,
    WorkshopSerializer,
)


class ActiveFilterMixin:
    def get_queryset(self):
        queryset = super().get_queryset()  # pyright: ignore[reportAttributeAccessIssue]
        value = self.request.query_params.get('is_active', 'true').lower()  # pyright: ignore[reportAttributeAccessIssue]

        if value == 'all':
            return queryset
        if value in ('true', 'false'):
            return queryset.filter(is_active=value == 'true')

        raise ValidationError({'is_active': "Ожидается 'true', 'false' или 'all'."})


class SoftDeleteMixin:
    def cascade(self, queryset: QuerySet, batch: UUID) -> int:
        return 0

    def deactivate(self, queryset: QuerySet) -> tuple[UUID, int]:
        batch = uuid4()

        with transaction.atomic():
            updated = self.cascade(queryset, batch)
            updated += queryset.filter(is_active=True).update(is_active=False, deleted_batch=batch)

        return batch, updated

    def selection(self, ids: list[int]) -> QuerySet:
        """Ищет записи по self.queryset, минуя get_queryset()"""
        queryset = self.queryset.filter(pk__in=ids)  # pyright: ignore[reportAttributeAccessIssue]
        missing = set(ids) - set(queryset.values_list('pk', flat=True))

        if missing:
            raise ValidationError({'ids': f'Не найдены: {sorted(missing)}.'})

        return queryset

    def perform_destroy(self, instance) -> None:
        self.deactivate(self.queryset.filter(pk=instance.pk))  # pyright: ignore[reportAttributeAccessIssue]

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        serializer = BulkIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        batch, updated = self.deactivate(self.selection(serializer.validated_data['ids']))
        return Response({'updated': updated, 'batch': batch})

    @action(detail=False, methods=['post'])
    def restore(self, request):
        serializer = BulkIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        batches = [
            batch
            for batch in self.selection(serializer.validated_data['ids'])
            .values_list('deleted_batch', flat=True)
            .distinct()
            if batch is not None
        ]

        if not batches:
            return Response({'updated': 0})

        with transaction.atomic():
            task_ids = set(
                Task.objects.filter(deleted_batch__in=batches).values_list('pk', flat=True)
            )
            worker_ids = set(
                Worker.objects.filter(deleted_batch__in=batches).values_list('pk', flat=True)
            )
            workshop_ids = set(
                Workshop.objects.filter(deleted_batch__in=batches).values_list('pk', flat=True)
            )

            worker_ids |= set(
                Task.objects.filter(pk__in=task_ids).values_list('worker_id', flat=True)
            )
            workshop_ids |= set(
                Worker.objects.filter(pk__in=worker_ids).values_list('workshop_id', flat=True)
            )

            # Номер цеха мог уйти новому цеху, пока этот лежал удалённым:
            # частичное ограничение уникальности иначе свалит запрос в 500.
            clash = sorted(
                Workshop.objects.filter(pk__in=workshop_ids, is_active=False)
                .filter(number__in=Workshop.objects.filter(is_active=True).values('number'))
                .values_list('number', flat=True)
            )

            if clash:
                raise ValidationError({'ids': f'Номера заняты действующими цехами: {clash}.'})

            # Порядок сверху вниз: цех, рабочие, задачи
            updated = sum(
                model.objects.filter(pk__in=ids, is_active=False).update(
                    is_active=True, deleted_batch=None
                )
                for model, ids in ((Workshop, workshop_ids), (Worker, worker_ids), (Task, task_ids))
            )

        return Response({'updated': updated})


class WorkshopViewSet(SoftDeleteMixin, ActiveFilterMixin, viewsets.ModelViewSet):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer
    filterset_fields = ['number']
    search_fields = ['name']
    ordering_fields = [
        'number',
        'name',
        'created_at',
        'workers_count',
        'active_tasks',
        'done_tasks',
    ]

    def get_queryset(self):
        # Prefetch иначе на список
        # цехов уходит по запросу на карточку.
        return with_workshop_stats(super().get_queryset()).prefetch_related(
            Prefetch('workers', queryset=workers_for_card())
        )

    def cascade(self, queryset, batch):
        worker_ids = list(
            Worker.objects.filter(workshop__in=queryset, is_active=True).values_list(
                'pk', flat=True
            )
        )
        updated = Task.objects.filter(worker_id__in=worker_ids, is_active=True).update(
            is_active=False, deleted_batch=batch
        )
        return updated + Worker.objects.filter(pk__in=worker_ids).update(
            is_active=False, deleted_batch=batch
        )


class WorkerViewSet(SoftDeleteMixin, ActiveFilterMixin, viewsets.ModelViewSet):
    queryset = Worker.objects.select_related('workshop')
    serializer_class = WorkerSerializer
    filterset_fields = ['workshop']
    search_fields = ['name']
    ordering_fields = [
        'name',
        'created_at',
        'workshop__name',
        'workshop__number',
        'tasks_total',
        'active_tasks',
        'done_tasks',
        'last_task_title',
    ]

    def get_queryset(self):
        return with_worker_stats(super().get_queryset())

    def cascade(self, queryset, batch):
        return Task.objects.filter(worker__in=queryset, is_active=True).update(
            is_active=False, deleted_batch=batch
        )

    @action(detail=False, methods=['post'], url_path='bulk-move')
    def bulk_move(self, request):
        serializer = BulkMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            updated = self.selection(serializer.validated_data['ids']).update(
                workshop=serializer.validated_data['workshop']
            )

        return Response({'updated': updated})


class TaskViewSet(SoftDeleteMixin, ActiveFilterMixin, viewsets.ModelViewSet):
    queryset = Task.objects.select_related('worker__workshop')
    serializer_class = TaskSerializer
    filterset_fields = ['status', 'worker', 'worker__workshop']
    search_fields = ['title', 'worker__name', 'code']
    ordering_fields = [
        'created_at',
        'updated_at',
        'title',
        'code',
        'status_order',
        'worker__name',
        'worker__workshop__name',
        'worker__workshop__number',
    ]

    def get_queryset(self):
        # По самому status сортировка алфавитная: done, in_progress, new.
        return (
            super()
            .get_queryset()
            .annotate(
                status_order=Case(
                    *[When(status=value, then=i) for i, value in enumerate(Task.Status.values)],
                    output_field=IntegerField(),
                )
            )
        )

    @action(detail=False, methods=['post'], url_path='bulk-status')
    def bulk_status(self, request):
        serializer = BulkStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            updated = self.selection(serializer.validated_data['ids']).update(
                status=serializer.validated_data['status']
            )

        return Response({'updated': updated})

    @action(detail=False)
    def summary(self, request):
        counts = dict(
            self.filter_queryset(self.get_queryset())
            .values_list('status')
            .annotate(count=Count('id'))
        )

        items = [
            {'status': value, 'label': label, 'count': counts.get(value, 0)}
            for value, label in Task.Status.choices
        ]
        return Response({'total': sum(counts.values()), 'by_status': items})
