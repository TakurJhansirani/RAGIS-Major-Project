import logging

from celery import shared_task

from .integration_config import IntegrationConfig
from .siem_connectors import sync_incidents_from_elasticsearch, sync_incidents_from_splunk
from .models import Organization
from .threat_intel import sync_threat_intel_feed


logger = logging.getLogger(__name__)


@shared_task(name='incidents.tasks.sync_splunk_incidents_task')
def sync_splunk_incidents_task():
    config = IntegrationConfig.get_splunk_config()
    if not config.get('enabled'):
        logger.info('Splunk sync skipped because SPLUNK_ENABLED=false')
        return 0

    created_count = sync_incidents_from_splunk(config)
    logger.info('Splunk sync completed with %s new incidents', created_count)
    return created_count


@shared_task(name='incidents.tasks.sync_elasticsearch_incidents_task')
def sync_elasticsearch_incidents_task():
    config = IntegrationConfig.get_elasticsearch_config()
    if not config.get('enabled'):
        logger.info('Elasticsearch sync skipped because ELASTICSEARCH_ENABLED=false')
        return 0

    created_count = sync_incidents_from_elasticsearch(config)
    logger.info('Elasticsearch sync completed with %s new incidents', created_count)
    return created_count


@shared_task(name='incidents.tasks.sync_threat_intel_task')
def sync_threat_intel_task():
    config = IntegrationConfig.get_threat_intel_config()
    if not config.get('enabled'):
        logger.info('Threat intel sync skipped because THREAT_INTEL_ENABLED=false')
        return 0

    total = 0
    organizations = Organization.objects.filter(is_active=True)
    if not organizations.exists():
        organizations = [Organization.get_default()]

    for organization in organizations:
        processed = sync_threat_intel_feed(organization=organization)
        total += processed

    logger.info('Threat intel sync completed with %s indicators processed', total)
    return total