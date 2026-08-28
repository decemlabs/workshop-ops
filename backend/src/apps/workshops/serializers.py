from rest_framework import serializers

from .models import Task, Worker, Workshop


class WorkshopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workshop
        fields = ['id', 'number', 'name', 'is_active', 'created_at', 'updated_at']


class WorkerSerializer(serializers.ModelSerializer):
    # добавляем поле с названием цеха
    workshop_name = serializers.CharField(source='workshop.name', read_only=True)

    class Meta:
        model = Worker
        fields = [
            'id',
            'name',
            'workshop',
            'workshop_name',
            'is_active',
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
