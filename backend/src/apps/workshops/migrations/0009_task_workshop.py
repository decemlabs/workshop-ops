import django.db.models.deletion
from django.db import migrations, models
from django.db.models import OuterRef, Subquery


def fill_workshop(apps, schema_editor):
    """Цех задачи = цех её рабочего: другого источника до этой миграции нет.

    Одним UPDATE через подзапрос: update() по JOIN Django не умеет, а цикл на
    питоне выгребал бы всю таблицу. worker_id здесь ещё NOT NULL, так что
    строк без цеха не остаётся, включая мягко удалённые задачи.
    """
    Task = apps.get_model('workshops', 'Task')
    Worker = apps.get_model('workshops', 'Worker')

    Task.objects.update(
        workshop_id=Subquery(
            Worker.objects.filter(pk=OuterRef('worker_id')).values('workshop_id')[:1]
        )
    )


class Migration(migrations.Migration):
    dependencies = [
        ('workshops', '0008_alter_workshop_number_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='workshop',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='tasks',
                to='workshops.workshop',
                verbose_name='цех',
            ),
        ),
        migrations.RunPython(fill_workshop, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='task',
            name='workshop',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='tasks',
                to='workshops.workshop',
                verbose_name='цех',
            ),
        ),
        migrations.AlterField(
            model_name='task',
            name='worker',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='tasks',
                to='workshops.worker',
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='former_worker',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='released_tasks',
                to='workshops.worker',
                verbose_name='прежний исполнитель',
            ),
        ),
    ]
