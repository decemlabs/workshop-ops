"""Корневая конфигурация URL проекта."""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('config.api')),
]

if settings.DEBUG:
    # Логин/логаут для браузерного интерфейса DRF (только в разработке).
    urlpatterns += [path('api-auth/', include('rest_framework.urls'))]
