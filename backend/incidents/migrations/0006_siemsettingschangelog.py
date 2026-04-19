from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('incidents', '0005_siemsettings_updated_by'),
    ]

    operations = [
        migrations.CreateModel(
            name='SIEMSettingsChangeLog',
            fields=[
                ('change_id', models.AutoField(primary_key=True, serialize=False)),
                ('connector', models.CharField(choices=[('splunk', 'Splunk'), ('elasticsearch', 'Elasticsearch')], max_length=32)),
                ('changed_at', models.DateTimeField(auto_now_add=True)),
                ('config_snapshot', models.JSONField(blank=True, default=dict)),
                ('changed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='siem_settings_change_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-changed_at'],
            },
        ),
        migrations.AddIndex(
            model_name='siemsettingschangelog',
            index=models.Index(fields=['connector', '-changed_at'], name='incidents_s_connector_4e0b87_idx'),
        ),
        migrations.AddIndex(
            model_name='siemsettingschangelog',
            index=models.Index(fields=['changed_at'], name='incidents_s_changed_2cb1f0_idx'),
        ),
    ]
