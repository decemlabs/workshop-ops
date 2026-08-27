from rest_framework import serializers

from .models import Task, Worker, Workshop


class WorkshopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workshop
        fields = ['id', 'name', 'is_active']


class WorkerSerializer(serializers.ModelSerializer):
    # добавляем поле с названием цеха
    workshop_name = serializers.CharField(source='workshop.name', read_only=True)

    class Meta:
        model = Worker
        fields = ['id', 'name', 'workshop', 'workshop_name', 'is_active']


class TaskSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.name', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'worker', 'worker_name', 'completed']

    def validate_worker(self, worker: Worker) -> Worker:
        if not worker.is_active:
            raise serializers.ValidationError(f'Рабочий «{worker.name}» больше не работает.')
        return worker
