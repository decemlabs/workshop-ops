from rest_framework import serializers

from .models import Task, Worker, Workshop


class WorkerLoadSerializer(serializers.ModelSerializer):
    """Столбик загрузки одного рабочего на карточке цеха."""

    active_tasks = serializers.IntegerField(read_only=True)

    class Meta:
        model = Worker
        fields = ['id', 'name', 'active_tasks']


class WorkshopSerializer(serializers.ModelSerializer):
    # Все счётчики приходят из annotate в WorkshopViewSet.get_queryset().
    workers_count = serializers.IntegerField(read_only=True)
    active_tasks = serializers.IntegerField(read_only=True)
    done_tasks = serializers.IntegerField(read_only=True)
    # Столбики на карточке. Идут через Prefetch, а не отдельным запросом на цех.
    workers_load = WorkerLoadSerializer(source='workers', many=True, read_only=True)

    class Meta:
        model = Workshop
        fields = [
            'id',
            'number',
            'name',
            'is_active',
            'workers_count',
            'active_tasks',
            'done_tasks',
            'workers_load',
            'created_at',
            'updated_at',
        ]


class WorkerSerializer(serializers.ModelSerializer):
    # добавляем поле с названием цеха
    workshop_name = serializers.CharField(source='workshop.name', read_only=True)
    workshop_number = serializers.IntegerField(source='workshop.number', read_only=True)
    tasks_total = serializers.IntegerField(read_only=True)
    active_tasks = serializers.IntegerField(read_only=True)
    done_tasks = serializers.IntegerField(read_only=True)
    last_task_title = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = Worker
        fields = [
            'id',
            'name',
            'workshop',
            'workshop_name',
            'workshop_number',
            'is_active',
            'tasks_total',
            'active_tasks',
            'done_tasks',
            'last_task_title',
            'created_at',
            'updated_at',
        ]


class TaskSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.name', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'code',
            'title',
            'worker',
            'worker_name',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['code']

    def validate_worker(self, worker: Worker) -> Worker:
        if not worker.is_active:
            raise serializers.ValidationError(f'Рабочий «{worker.name}» больше не работает.')
        return worker


class BulkIdsSerializer(serializers.Serializer):
    """Список id для операции над группой записей"""

    ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)


class BulkMoveSerializer(BulkIdsSerializer):
    """Перевод группы рабочих в другой цех"""

    # queryset ограничен активными: иначе рабочие уезжают в удалённый цех.
    workshop = serializers.PrimaryKeyRelatedField(queryset=Workshop.objects.filter(is_active=True))


class BulkStatusSerializer(BulkIdsSerializer):
    status = serializers.ChoiceField(choices=Task.Status.choices)
