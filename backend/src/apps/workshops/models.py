from django.core.exceptions import ValidationError
from django.db import models, transaction


class TimestampedModel(models.Model):
    created_at = models.DateTimeField('создана', auto_now_add=True)
    updated_at = models.DateTimeField('изменена', auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(TimestampedModel):
    is_active = models.BooleanField('работает', default=True)
    deleted_batch = models.UUIDField(null=True, blank=True, editable=False, db_index=True)

    class Meta(TimestampedModel.Meta):
        abstract = True


class Workshop(SoftDeleteModel):
    number = models.PositiveIntegerField('номер')
    name = models.CharField(max_length=100)

    class Meta(SoftDeleteModel.Meta):
        verbose_name = 'цех'
        verbose_name_plural = 'цеха'
        ordering = ['number']
        constraints = [
            # Номер занят только действующим цехом: после удаления его можно
            # выдать заново, иначе пользователь упирается в ошибку про цех,
            # которого не видит.
            models.UniqueConstraint(
                fields=['number'],
                condition=models.Q(is_active=True),
                name='unique_active_workshop_number',
            )
        ]

    def __str__(self) -> str:
        return f'Цех №{self.number} · {self.name}'


class Worker(SoftDeleteModel):
    name = models.CharField(max_length=100)
    workshop = models.ForeignKey(Workshop, on_delete=models.PROTECT, related_name='workers')

    class Meta(SoftDeleteModel.Meta):
        verbose_name = 'рабочий'
        verbose_name_plural = 'рабочие'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Task(SoftDeleteModel):
    class Status(models.TextChoices):
        NEW = 'new', 'Новая'
        IN_PROGRESS = 'in_progress', 'В работе'
        DONE = 'done', 'Выполнено'

    CODE_PREFIX = 'ЗН-'
    CODE_OFFSET = 4800

    code = models.CharField('код', max_length=20, unique=True, blank=True)
    title = models.CharField(max_length=100)
    workshop = models.ForeignKey(
        Workshop, on_delete=models.PROTECT, related_name='tasks', verbose_name='цех'
    )
    worker = models.ForeignKey(
        Worker, on_delete=models.PROTECT, related_name='tasks', null=True, blank=True
    )
    # Кому вернуть задачу, если рабочий вернётся в её цех, и кто её выполнил,
    # если она осталась ничьей.
    former_worker = models.ForeignKey(
        Worker,
        on_delete=models.PROTECT,
        related_name='released_tasks',
        null=True,
        blank=True,
        verbose_name='прежний исполнитель',
    )
    status = models.CharField('статус', max_length=20, choices=Status.choices, default=Status.NEW)

    class Meta(SoftDeleteModel.Meta):
        verbose_name = 'задача'
        verbose_name_plural = 'задачи'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.code} {self.title}' if self.code else self.title

    def save(self, *args, **kwargs) -> None:
        if self.code:
            return super().save(*args, **kwargs)

        with transaction.atomic():
            super().save(*args, **kwargs)
            self.code = f'{self.CODE_PREFIX}{self.CODE_OFFSET + self.pk}'
            super().save(update_fields=['code'])

    def clean(self) -> None:
        """Проверяет исполнителя: он в штате и из цеха задачи.

        Проверка на увольнение только при создании (pk is None): иначе перестанут
        сохраняться старые задачи уволенного, которые править разрешено.
        Не закрыто переназначение существующей задачи на уволенного через
        админку — для этого пришлось бы поднимать прежнее значение из БД
        на каждом сохранении.

        clean() вызывает ModelForm, то есть админка. Task.objects.create()
        в шелле её не вызывает — там ограничений нет намеренно, миграциям
        и фикстурам бизнес-правила мешают.
        """
        if self.worker_id is None:
            return  # задача лежит в цехе без исполнителя — это нормально

        if self.pk is None and not self.worker.is_active:
            raise ValidationError({'worker': f'Рабочий «{self.worker.name}» больше не работает.'})

        # workshop_id пуст, когда full_clean() уже отбраковал обязательное поле:
        # своя ошибка про «другой цех» тут только запутает.
        if self.workshop_id and self.worker.workshop_id != self.workshop_id:
            raise ValidationError({'worker': f'Рабочий «{self.worker.name}» из другого цеха.'})
