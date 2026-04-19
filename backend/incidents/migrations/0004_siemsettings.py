from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('incidents', '0003_notification_analystnote_ailearninghistory'),
    ]

    operations = [
        migrations.CreateModel(
            name='SIEMSettings',
            fields=[
                ('singleton_id', models.PositiveSmallIntegerField(default=1, editable=False, primary_key=True, serialize=False)),
                ('splunk_config', models.JSONField(blank=True, default=dict)),
                ('elasticsearch_config', models.JSONField(blank=True, default=dict)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'SIEM Settings',
                'verbose_name_plural': 'SIEM Settings',
            },
        ),
    ]
