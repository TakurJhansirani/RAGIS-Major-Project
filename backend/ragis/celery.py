import os
from datetime import timedelta

from celery import Celery
from celery.schedules import crontab


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ragis.settings')

app = Celery('ragis')
app.config_from_object('django.conf:settings', namespace='CELERY')


def _parse_schedule(expression, default_minutes):
    if expression is None:
        return crontab(minute=f'*/{default_minutes}')

    value = str(expression).strip().lower()
    if value in {'', '0', 'off', 'disabled', 'false', 'none'}:
        return None

    if value.startswith('*/') and value[2:].isdigit():
        minutes = int(value[2:])
        if minutes <= 0:
            return None
        if minutes <= 59:
            return crontab(minute=f'*/{minutes}')
        return timedelta(minutes=minutes)

    if value.isdigit():
        minutes = int(value)
        if minutes <= 0:
            return None
        if minutes <= 59:
            return crontab(minute=f'*/{minutes}')
        return timedelta(minutes=minutes)

    cron_fields = value.split()
    if len(cron_fields) == 5:
        minute, hour, day_of_month, month_of_year, day_of_week = cron_fields
        return crontab(
            minute=minute,
            hour=hour,
            day_of_month=day_of_month,
            month_of_year=month_of_year,
            day_of_week=day_of_week,
        )

    return crontab(minute=f'*/{default_minutes}')


splunk_schedule = _parse_schedule(os.getenv('SPLUNK_SYNC_SCHEDULE', '60'), 60)
elasticsearch_schedule = _parse_schedule(os.getenv('ELASTICSEARCH_SYNC_SCHEDULE', '15'), 15)
threat_intel_schedule = _parse_schedule(os.getenv('THREAT_INTEL_SYNC_SCHEDULE', '30'), 30)

beat_schedule = {}
if splunk_schedule is not None:
    beat_schedule['sync-splunk-incidents'] = {
        'task': 'incidents.tasks.sync_splunk_incidents_task',
        'schedule': splunk_schedule,
    }

if elasticsearch_schedule is not None:
    beat_schedule['sync-elasticsearch-incidents'] = {
        'task': 'incidents.tasks.sync_elasticsearch_incidents_task',
        'schedule': elasticsearch_schedule,
    }

if threat_intel_schedule is not None:
    beat_schedule['sync-threat-intel'] = {
        'task': 'incidents.tasks.sync_threat_intel_task',
        'schedule': threat_intel_schedule,
    }

app.conf.beat_schedule = beat_schedule
app.autodiscover_tasks()