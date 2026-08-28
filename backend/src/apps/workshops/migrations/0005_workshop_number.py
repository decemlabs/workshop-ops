from django.db import migrations, models


def fill_numbers(apps, schema_editor):
    """Нумерует существующие цеха подряд с 1 в порядке появления"""
    Workshop = apps.get_model('workshops', 'Workshop')

    for number, workshop in enumerate(Workshop.objects.order_by('id'), start=1):
        workshop.number = number
        workshop.save(update_fields=['number'])


class Migration(migrations.Migration):
    dependencies = [
        ('workshops', '0004_alter_task_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='workshop',
            name='number',
            field=models.PositiveIntegerField(null=True, verbose_name='номер'),
        ),
        migrations.RunPython(fill_numbers, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='workshop',
            name='number',
            field=models.PositiveIntegerField(unique=True, verbose_name='номер'),
        ),
        migrations.AlterModelOptions(
            name='workshop',
            options={
                'ordering': ['number'],
                'verbose_name': 'цех',
                'verbose_name_plural': 'цеха',
            },
        ),
    ]
