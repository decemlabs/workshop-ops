"""
Корневой роутер REST API.
"""

from rest_framework.routers import DefaultRouter

from apps.workshops.views import TaskViewSet, WorkerViewSet, WorkshopViewSet

router = DefaultRouter()

router.register('workshops', WorkshopViewSet)
router.register('workers', WorkerViewSet)
router.register('tasks', TaskViewSet)

app_name = 'api'
urlpatterns = router.urls
