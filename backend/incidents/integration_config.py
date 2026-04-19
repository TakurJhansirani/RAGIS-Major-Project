"""
Integration Service Configuration
Centralized configuration for all incident sources and SIEM systems
"""

import os
import json
from typing import Dict, Any
from django.db.utils import OperationalError, ProgrammingError

class IntegrationConfig:
    """Configuration manager for incident integrations"""

    @staticmethod
    def _resolve_password_update(incoming_config: Dict[str, Any], current_password: str) -> str:
        if 'password' not in incoming_config:
            return current_password

        incoming_password = incoming_config.get('password')
        if incoming_password is None:
            return current_password

        incoming_password_str = str(incoming_password)
        if incoming_password_str == '':
            return current_password

        return incoming_password_str

    @staticmethod
    def _redact_connector_config(config: Dict[str, Any]) -> Dict[str, Any]:
        auth = config.get('auth', {}) if isinstance(config.get('auth', {}), dict) else {}
        return {
            **config,
            'auth': {
                'username': auth.get('username', ''),
                'has_password': bool(auth.get('password')),
            },
        }

    @staticmethod
    def _summarize_change(connector: str, config: Dict[str, Any], updated_by=None) -> None:
        try:
            from .models import SIEMSettingsChangeLog

            SIEMSettingsChangeLog.objects.create(
                connector=connector,
                changed_by=updated_by if getattr(updated_by, 'is_authenticated', False) else None,
                config_snapshot=IntegrationConfig._redact_connector_config(config),
            )
        except (OperationalError, ProgrammingError):
            return

    @staticmethod
    def _merge_auth(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
        merged = dict(base)
        if 'auth' in override and isinstance(override['auth'], dict):
            merged_auth = dict(base.get('auth', {}))
            merged_auth.update(override['auth'])
            merged['auth'] = merged_auth
        for key, value in override.items():
            if key == 'auth':
                continue
            merged[key] = value
        return merged

    @staticmethod
    def _get_siem_settings_record():
        try:
            from .models import SIEMSettings
            record, _ = SIEMSettings.objects.get_or_create(singleton_id=1)
            return record
        except (OperationalError, ProgrammingError):
            return None

    @staticmethod
    def _get_persisted_connector_config(connector: str) -> Dict[str, Any]:
        record = IntegrationConfig._get_siem_settings_record()
        if record is None:
            return {}

        if connector == 'splunk':
            config = record.splunk_config
        elif connector == 'elasticsearch':
            config = record.elasticsearch_config
        else:
            return {}

        return config if isinstance(config, dict) else {}

    @staticmethod
    def _save_persisted_connector_config(connector: str, config: Dict[str, Any], updated_by=None) -> None:
        record = IntegrationConfig._get_siem_settings_record()
        if record is None:
            return

        if connector == 'splunk':
            record.splunk_config = config
            if updated_by is not None:
                record.updated_by = updated_by
            record.save(update_fields=['splunk_config', 'updated_by', 'updated_at'])
            IntegrationConfig._summarize_change('splunk', config, updated_by=updated_by)
        elif connector == 'elasticsearch':
            record.elasticsearch_config = config
            if updated_by is not None:
                record.updated_by = updated_by
            record.save(update_fields=['elasticsearch_config', 'updated_by', 'updated_at'])
            IntegrationConfig._summarize_change('elasticsearch', config, updated_by=updated_by)
    
    @staticmethod
    def get_splunk_config() -> Dict[str, Any]:
        """Get Splunk configuration from environment"""
        base = {
            'url': os.getenv('SPLUNK_URL', 'https://splunk.local:8089'),
            'auth': {
                'username': os.getenv('SPLUNK_USERNAME', 'admin'),
                'password': os.getenv('SPLUNK_PASSWORD', ''),
            },
            'ssl_verify': os.getenv('SPLUNK_SSL_VERIFY', 'false').lower() == 'true',
            'enabled': os.getenv('SPLUNK_ENABLED', 'false').lower() == 'true',
            'sync_schedule': os.getenv('SPLUNK_SYNC_SCHEDULE', '*/60'),
            'search_query': os.getenv('SPLUNK_SEARCH_QUERY', 'search index=notable earliest=-24h@h | head 200'),
        }
        override = IntegrationConfig._get_persisted_connector_config('splunk')
        return IntegrationConfig._merge_auth(base, override)
    
    @staticmethod
    def get_elasticsearch_config() -> Dict[str, Any]:
        """Get Elasticsearch configuration from environment"""
        base = {
            'url': os.getenv('ELASTICSEARCH_URL', 'https://elasticsearch.local:9200'),
            'auth': {
                'username': os.getenv('ELASTICSEARCH_USERNAME', 'elastic'),
                'password': os.getenv('ELASTICSEARCH_PASSWORD', ''),
            },
            'ssl_verify': os.getenv('ELASTICSEARCH_SSL_VERIFY', 'false').lower() == 'true',
            'enabled': os.getenv('ELASTICSEARCH_ENABLED', 'false').lower() == 'true',
            'detection_index': os.getenv('ELASTICSEARCH_DETECTION_INDEX', '.detections-default'),
            'sync_schedule': os.getenv('ELASTICSEARCH_SYNC_SCHEDULE', '*/15'),
        }
        override = IntegrationConfig._get_persisted_connector_config('elasticsearch')
        return IntegrationConfig._merge_auth(base, override)

    @staticmethod
    def set_splunk_config(config: Dict[str, Any], updated_by=None) -> Dict[str, Any]:
        """Persist Splunk configuration override."""
        current = IntegrationConfig.get_splunk_config()
        current_password = current.get('auth', {}).get('password', '')
        next_override: Dict[str, Any] = {
            'url': config.get('url', current['url']),
            'enabled': bool(config.get('enabled', current['enabled'])),
            'ssl_verify': bool(config.get('ssl_verify', current['ssl_verify'])),
            'sync_schedule': str(config.get('sync_schedule', current.get('sync_schedule', '*/60'))),
            'search_query': str(config.get('search_query', current.get('search_query', 'search index=notable earliest=-24h@h | head 200'))),
            'auth': {
                'username': config.get('username', current.get('auth', {}).get('username', 'admin')),
                'password': IntegrationConfig._resolve_password_update(config, current_password),
            },
        }
        IntegrationConfig._save_persisted_connector_config('splunk', next_override, updated_by=updated_by)
        return IntegrationConfig.get_splunk_config()

    @staticmethod
    def set_elasticsearch_config(config: Dict[str, Any], updated_by=None) -> Dict[str, Any]:
        """Persist Elasticsearch configuration override."""
        current = IntegrationConfig.get_elasticsearch_config()
        current_password = current.get('auth', {}).get('password', '')
        next_override: Dict[str, Any] = {
            'url': config.get('url', current['url']),
            'enabled': bool(config.get('enabled', current['enabled'])),
            'ssl_verify': bool(config.get('ssl_verify', current['ssl_verify'])),
            'detection_index': str(config.get('detection_index', current.get('detection_index', '.detections-default'))),
            'sync_schedule': str(config.get('sync_schedule', current.get('sync_schedule', '*/15'))),
            'auth': {
                'username': config.get('username', current.get('auth', {}).get('username', 'elastic')),
                'password': IntegrationConfig._resolve_password_update(config, current_password),
            },
        }
        IntegrationConfig._save_persisted_connector_config('elasticsearch', next_override, updated_by=updated_by)
        return IntegrationConfig.get_elasticsearch_config()

    @staticmethod
    def get_siem_settings() -> Dict[str, Any]:
        """Return current SIEM settings for API/UI configuration."""
        record = IntegrationConfig._get_siem_settings_record()
        splunk = IntegrationConfig.get_splunk_config()
        elasticsearch = IntegrationConfig.get_elasticsearch_config()
        history = IntegrationConfig.get_siem_change_history(limit=5)
        return {
            'splunk': IntegrationConfig._redact_connector_config(splunk),
            'elasticsearch': IntegrationConfig._redact_connector_config(elasticsearch),
            'audit': {
                'updated_at': record.updated_at.isoformat() if record and record.updated_at else None,
                'updated_by': record.updated_by.get_username() if record and record.updated_by else None,
            },
            'history': history,
        }

    @staticmethod
    def get_siem_change_history(limit: int = 5):
        try:
            from .models import SIEMSettingsChangeLog

            entries = SIEMSettingsChangeLog.objects.select_related('changed_by').all()[:limit]
        except (OperationalError, ProgrammingError):
            return []

        return [
            {
                'change_id': entry.change_id,
                'connector': entry.connector,
                'changed_at': entry.changed_at.isoformat() if entry.changed_at else None,
                'changed_by': entry.changed_by.get_username() if entry.changed_by else None,
                'config_snapshot': entry.config_snapshot,
            }
            for entry in entries
        ]

    @staticmethod
    def restore_siem_settings_from_history(connector: str, change_id: int, updated_by=None) -> Dict[str, Any]:
        try:
            from .models import SIEMSettingsChangeLog

            entry = SIEMSettingsChangeLog.objects.get(change_id=change_id, connector=connector)
        except (SIEMSettingsChangeLog.DoesNotExist, OperationalError, ProgrammingError):
            raise ValueError('History entry not found')

        snapshot = entry.config_snapshot if isinstance(entry.config_snapshot, dict) else {}
        redacted_auth = snapshot.get('auth', {}) if isinstance(snapshot.get('auth', {}), dict) else {}

        restore_payload: Dict[str, Any] = {
            'url': snapshot.get('url'),
            'enabled': snapshot.get('enabled'),
            'ssl_verify': snapshot.get('ssl_verify'),
            'sync_schedule': snapshot.get('sync_schedule'),
            'username': redacted_auth.get('username'),
        }

        if connector == 'elasticsearch':
            restore_payload['detection_index'] = snapshot.get('detection_index')

        if connector == 'splunk':
            return IntegrationConfig.set_splunk_config(restore_payload, updated_by=updated_by)

        return IntegrationConfig.set_elasticsearch_config(restore_payload, updated_by=updated_by)
    
    @staticmethod
    def get_webhook_config() -> Dict[str, Any]:
        """Get webhook configuration"""
        return {
            'secret': os.getenv('WEBHOOK_SECRET', ''),
            'timeout': int(os.getenv('WEBHOOK_TIMEOUT', '30')),
            'enabled': os.getenv('WEBHOOK_ENABLED', 'true').lower() == 'true',
        }

    @staticmethod
    def get_soar_config() -> Dict[str, Any]:
        """Get SOAR integration configuration"""
        return {
            'enabled': os.getenv('SOAR_ENABLED', 'false').lower() == 'true',
            'webhook_url': os.getenv('SOAR_WEBHOOK_URL', ''),
            'api_key': os.getenv('SOAR_API_KEY', ''),
            'timeout': int(os.getenv('SOAR_TIMEOUT', '20')),
            'ssl_verify': os.getenv('SOAR_SSL_VERIFY', 'false').lower() == 'true',
        }

    @staticmethod
    def get_threat_intel_config() -> Dict[str, Any]:
        """Get threat intelligence feed configuration"""
        return {
            'enabled': os.getenv('THREAT_INTEL_ENABLED', 'false').lower() == 'true',
            'feed_url': os.getenv('THREAT_INTEL_FEED_URL', ''),
            'api_key': os.getenv('THREAT_INTEL_API_KEY', ''),
            'source': os.getenv('THREAT_INTEL_SOURCE', 'threat-feed'),
            'timeout': int(os.getenv('THREAT_INTEL_TIMEOUT', '20')),
            'ssl_verify': os.getenv('THREAT_INTEL_SSL_VERIFY', 'false').lower() == 'true',
            'sync_schedule': os.getenv('THREAT_INTEL_SYNC_SCHEDULE', '*/30'),
        }
    
    @staticmethod
    def get_sync_schedule() -> Dict[str, str]:
        """Get sync schedule for background tasks"""
        return {
            'splunk': IntegrationConfig.get_splunk_config().get('sync_schedule', '*/60'),  # Every hour
            'elasticsearch': IntegrationConfig.get_elasticsearch_config().get('sync_schedule', '*/15'),  # Every 15 minutes
            'threat_intel': os.getenv('THREAT_INTEL_SYNC_SCHEDULE', '*/30'),  # Every 30 minutes
        }

    @staticmethod
    def get_ai_model_catalog() -> Dict[str, Any]:
        """Get AI model settings and catalog from environment with safe defaults."""
        default_models = [
            {
                'id': 'ragis-core',
                'name': 'RAGIS Core v3.2',
                'description': 'Primary threat classification and triage model',
                'accuracy': 94.2,
                'latency': '120ms',
                'active': True,
            },
            {
                'id': 'anomaly-det',
                'name': 'Anomaly Detector v2.1',
                'description': 'Behavioral anomaly detection using UEBA signals',
                'accuracy': 89.7,
                'latency': '85ms',
                'active': True,
            },
            {
                'id': 'nlp-summarizer',
                'name': 'NLP Summarizer v1.8',
                'description': 'Incident narrative generation and executive summaries',
                'accuracy': 91.3,
                'latency': '200ms',
                'active': True,
            },
            {
                'id': 'fp-filter',
                'name': 'False Positive Filter v4.0',
                'description': 'Reduces alert fatigue by identifying benign alerts',
                'accuracy': 96.1,
                'latency': '45ms',
                'active': False,
            },
            {
                'id': 'threat-intel',
                'name': 'Threat Intel Enricher v2.5',
                'description': 'IOC enrichment from OSINT and commercial feeds',
                'accuracy': 88.5,
                'latency': '350ms',
                'active': False,
            },
        ]

        raw_catalog = os.getenv('AI_MODELS_CATALOG_JSON', '')
        models = default_models
        if raw_catalog:
            try:
                parsed = json.loads(raw_catalog)
                if isinstance(parsed, list):
                    models = parsed
            except json.JSONDecodeError:
                models = default_models

        return {
            'confidence_threshold': int(os.getenv('AI_CONFIDENCE_THRESHOLD', '75')),
            'auto_triage': os.getenv('AI_AUTO_TRIAGE', 'true').lower() == 'true',
            'models': models,
        }

# Example .env file content for easy setup:
EXAMPLE_ENV = """
# ============================================
# SPLUNK CONFIGURATION
# ============================================
SPLUNK_ENABLED=true
SPLUNK_URL=https://splunk.local:8089
SPLUNK_USERNAME=admin
SPLUNK_PASSWORD=your_password_here
SPLUNK_SSL_VERIFY=false
SPLUNK_SYNC_SCHEDULE=*/60  # Every hour

# ============================================
# ELASTICSEARCH CONFIGURATION
# ============================================
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_URL=https://elasticsearch.local:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password_here
ELASTICSEARCH_SSL_VERIFY=false
ELASTICSEARCH_DETECTION_INDEX=.detections-default
ELASTICSEARCH_SYNC_SCHEDULE=*/15  # Every 15 minutes

# ============================================
# WEBHOOK CONFIGURATION
# ============================================
WEBHOOK_ENABLED=true
WEBHOOK_SECRET=your-webhook-secret-key
WEBHOOK_TIMEOUT=30

# ============================================
# API CONFIGURATION
# ============================================
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
"""
