from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from .models import Task, Worker, Workshop
from .serializers import TaskSerializer, WorkerSerializer, WorkshopSerializer


class ActiveFilterMixin:
    def get_queryset(self):
        queryset = super().get_queryset()  # pyright: ignore[reportAttributeAccessIssue]
        value = self.request.query_params.get('is_active', 'true').lower()  # pyright: ignore[reportAttributeAccessIssue]

        if value == 'all':
            return queryset
        if value in ('true', 'false'):
            return queryset.filter(is_active=value == 'true')

        raise ValidationError({'is_active': "Ожидается 'true', 'false' или 'all'."})


class WorkshopViewSet(ActiveFilterMixin, viewsets.ModelViewSet):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer


class WorkerViewSet(ActiveFilterMixin, viewsets.ModelViewSet):
    queryset = Worker.objects.select_related('workshop')
    serializer_class = WorkerSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('worker')
    serializer_class = TaskSerializer
