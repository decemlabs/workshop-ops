from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Кастомная модель пользователя.
    Заведена пустой на старте проекта, чтобы добавлять поля без миграции AUTH_USER_MODEL.
    """
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'пользователь'
        verbose_name_plural = 'пользователи'
