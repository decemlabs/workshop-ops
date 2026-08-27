from django.contrib import admin

from .models import Task, Worker, Workshop


@admin.register(Workshop)
class WorkshopAdmin(admin.ModelAdmin):
    # Колонки в списке объектов.
    list_display = ['name', 'is_active']

    # Панель фильтров справа.
    list_filter = ['is_active']

    # Поле поиска над списком.
    search_fields = ['name']
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
    list_display = ['title', 'worker', 'status', 'created_at']

    list_filter = ['status', 'worker__workshop']
    search_fields = ['title']
    autocomplete_fields = ['worker']
    readonly_fields = ['created_at', 'updated_at']
