from django.core.exceptions import ValidationError
from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField('создана', auto_now_add=True)
    updated_at = models.DateTimeField('изменена', auto_now=True)

    class Meta:
        abstract = True


class Workshop(TimestampedModel):
    name = models.CharField(max_length=100)
    is_active = models.BooleanField('работает', default=True)

    class Meta(TimestampedModel.Meta):
        verbose_name = 'цех'
        verbose_name_plural = 'цеха'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Worker(TimestampedModel):
    name = models.CharField(max_length=100)
    workshop = models.ForeignKey(Workshop, on_delete=models.PROTECT, related_name='workers')
    is_active = models.BooleanField('работает', default=True)

    class Meta(TimestampedModel.Meta):
        verbose_name = 'рабочий'
        verbose_name_plural = 'рабочие'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Task(TimestampedModel):
    class Status(models.TextChoices):
        NEW = 'new', 'Новая'
        IN_PROGRESS = 'in_progress', 'В работе'
        DONE = 'done', 'Выполнено'

    title = models.CharField(max_length=100)
    worker = models.ForeignKey(Worker, on_delete=models.PROTECT, related_name='tasks')
    status = models.CharField('статус', max_length=20, choices=Status.choices, default=Status.NEW)

    class Meta(TimestampedModel.Meta):
        verbose_name = 'задача'
        verbose_name_plural = 'задачи'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.title

    def clean(self) -> None:
        """Не даёт завести задачу на выведенного из штата рабочего.

        Проверка только при создании (pk is None): иначе перестанут
        сохраняться старые задачи уволенного, которые править разрешено.
        Не закрыто переназначение существующей задачи на уволенного через
        админку — для этого пришлось бы поднимать прежнее значение из БД
        на каждом сохранении.

        clean() вызывает ModelForm, то есть админка. Task.objects.create()
        в шелле её не вызывает — там ограничений нет намеренно, миграциям
        и фикстурам бизнес-правила мешают.
        """
        if self.pk is None and not self.worker.is_active:
            raise ValidationError({'worker': f'Рабочий «{self.worker.name}» больше не работает.'})
