"""Корневой роутер REST API.

Приложения регистрируют здесь свои ViewSet'ы:

    from apps.users.views import UserViewSet
    router.register('users', UserViewSet, basename='user')
"""

from rest_framework.routers import DefaultRouter

router = DefaultRouter()

app_name = 'api'
urlpatterns = router.urls
