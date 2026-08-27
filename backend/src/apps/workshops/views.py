from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

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
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']


class WorkerViewSet(ActiveFilterMixin, viewsets.ModelViewSet):
    queryset = Worker.objects.select_related('workshop')
    serializer_class = WorkerSerializer
    filterset_fields = ['workshop']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('worker')
    serializer_class = TaskSerializer
    filterset_fields = ['status', 'worker', 'worker__workshop']
    search_fields = ['title', 'worker__name']
    ordering_fields = ['created_at', 'updated_at', 'title']

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
