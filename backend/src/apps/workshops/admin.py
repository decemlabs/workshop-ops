from django.contrib import admin

from .models import Task, Worker, Workshop


@admin.register(Workshop)
class WorkshopAdmin(admin.ModelAdmin):
    # Колонки в списке объектов.
    list_display = ['number', 'name', 'is_active']

    # Панель фильтров справа.
    list_filter = ['is_active']

    search_fields = ['name', '=number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ['name', 'workshop', 'is_active']
    list_filter = ['is_active', 'workshop']
    search_fields = ['name']

    autocomplete_fields = ['workshop']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['code', 'title', 'workshop', 'worker', 'status', 'created_at']

    list_filter = ['status', 'workshop']
    search_fields = ['title', 'code']
    autocomplete_fields = ['workshop', 'worker', 'former_worker']
    readonly_fields = ['code', 'created_at', 'updated_at']
