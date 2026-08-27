from django.db import migrations, models


def completed_to_status(apps, schema_editor):
    # apps.get_model, а не импорт модели: нужна историческая версия на момент
    # этой миграции. Импортированная Task уже не знает про поле completed.
    Task = apps.get_model('workshops', 'Task')
    Task.objects.filter(completed=True).update(status='done')


def status_to_completed(apps, schema_editor):
    Task = apps.get_model('workshops', 'Task')
    Task.objects.filter(status='done').update(completed=True)


class Migration(migrations.Migration):
    dependencies = [
        ('workshops', '0002_alter_task_options_task_created_at_task_updated_at_and_more'),
    ]

    # Порядок важен: сначала добавить новое поле, потом перенести данные,
    # и только потом удалить старое. Сгенерированный Django вариант удалял
    # completed первым и терял отметки о выполнении.
    operations = [
        migrations.AddField(
            model_name='task',
            name='status',
            field=models.CharField(
                choices=[('new', 'новая'), ('in_progress', 'в работе'), ('done', 'выполнена')],
                default='new',
                max_length=20,
                verbose_name='статус',
            ),
        ),
        migrations.RunPython(completed_to_status, status_to_completed),
        migrations.RemoveField(model_name='task', name='completed'),
    ]
