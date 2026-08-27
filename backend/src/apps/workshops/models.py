from django.db import models


class Workshop(models.Model):
    name = models.CharField(max_length=100)
    is_active = models.BooleanField('работает', default=True)

    class Meta:
        verbose_name = 'цех'
        verbose_name_plural = 'цеха'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Worker(models.Model):
    name = models.CharField(max_length=100)
    workshop = models.ForeignKey(Workshop, on_delete=models.PROTECT, related_name='workers')
    is_active = models.BooleanField('работает', default=True)

    class Meta:
        verbose_name = 'рабочий'
        verbose_name_plural = 'рабочие'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Task(models.Model):
    title = models.CharField(max_length=100)
    worker = models.ForeignKey(Worker, on_delete=models.PROTECT, related_name='tasks')
    completed = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'задача'
        verbose_name_plural = 'задачи'
        ordering = ['-id']  # свежие задачи сверху.

    def __str__(self) -> str:
        return self.title
