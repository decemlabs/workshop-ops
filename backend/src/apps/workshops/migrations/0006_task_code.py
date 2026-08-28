from django.db import migrations, models


def fill_codes(apps, schema_editor):
    Task = apps.get_model('workshops', 'Task')

    for task in Task.objects.all():
        task.code = f'ЗН-{4800 + task.pk}'
        task.save(update_fields=['code'])


class Migration(migrations.Migration):
    dependencies = [
        ('workshops', '0005_workshop_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='code',
            field=models.CharField(max_length=20, null=True, verbose_name='код'),
        ),
        migrations.RunPython(fill_codes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='task',
            name='code',
            field=models.CharField(blank=True, max_length=20, unique=True, verbose_name='код'),
        ),
    ]
