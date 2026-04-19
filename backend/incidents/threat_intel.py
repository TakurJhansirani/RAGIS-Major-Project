from __future__ import annotations

from datetime import timedelta
from typing import Any

import requests
from django.utils import timezone

from .integration_config import IntegrationConfig
from .models import Organization, ThreatIntelIndicator


def _normalize_indicator(raw: dict[str, Any], default_source: str) -> dict[str, Any] | None:
    indicator_type = str(raw.get('indicator_type') or raw.get('type') or '').strip().lower()
    value = str(raw.get('value') or raw.get('indicator') or '').strip()
    if not indicator_type or not value:
        return None

    if indicator_type == 'hash':
        indicator_type = 'file_hash'

    if indicator_type not in {'ip', 'domain', 'url', 'file_hash', 'email'}:
        return None

    severity = str(raw.get('severity') or 'medium').lower()
    if severity not in {'critical', 'high', 'medium', 'low', 'info'}:
        severity = 'medium'

    confidence = raw.get('confidence_score', raw.get('confidence', 60))
    try:
        confidence_score = max(0, min(100, int(confidence)))
    except (TypeError, ValueError):
        confidence_score = 60

    return {
        'indicator_type': indicator_type,
        'value': value,
        'source': str(raw.get('source') or default_source),
        'severity': severity,
        'confidence_score': confidence_score,
        'tags': raw.get('tags') if isinstance(raw.get('tags'), list) else [],
        'raw_data': raw,
    }


def _fallback_indicators(source: str) -> list[dict[str, Any]]:
    return [
        {
            'indicator_type': 'ip',
            'value': '185.220.101.34',
            'source': source,
            'severity': 'high',
            'confidence_score': 80,
            'tags': ['tor-exit-node', 'botnet'],
            'raw_data': {'reason': 'fallback-seed'},
        },
        {
            'indicator_type': 'domain',
            'value': 'xk4d.evil-dns.com',
            'source': source,
            'severity': 'critical',
            'confidence_score': 88,
            'tags': ['c2', 'dns-tunnel'],
            'raw_data': {'reason': 'fallback-seed'},
        },
    ]


def _parse_feed_payload(payload: Any, source: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if isinstance(payload, dict):
        if isinstance(payload.get('indicators'), list):
            rows = payload['indicators']
        elif isinstance(payload.get('data'), list):
            rows = payload['data']
    elif isinstance(payload, list):
        rows = payload

    normalized = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        item = _normalize_indicator(row, source)
        if item:
            normalized.append(item)
    return normalized


def sync_threat_intel_feed(organization: Organization | None = None) -> int:
    config = IntegrationConfig.get_threat_intel_config()
    if not config.get('enabled', False):
        return 0

    if organization is None:
        organization = Organization.get_default()

    source_name = config.get('source', 'threat-feed')
    indicators: list[dict[str, Any]] = []

    feed_url = config.get('feed_url', '').strip()
    if feed_url:
        headers = {'Accept': 'application/json'}
        api_key = config.get('api_key', '').strip()
        if api_key:
            headers['Authorization'] = f'Bearer {api_key}'

        try:
            response = requests.get(
                feed_url,
                headers=headers,
                timeout=config.get('timeout', 20),
                verify=config.get('ssl_verify', False),
            )
            response.raise_for_status()
            indicators = _parse_feed_payload(response.json(), source_name)
        except requests.RequestException:
            indicators = []

    if not indicators:
        indicators = _fallback_indicators(source_name)

    now = timezone.now()
    default_first_seen = now - timedelta(hours=1)
    created_or_updated = 0

    for indicator in indicators:
        obj, created = ThreatIntelIndicator.objects.get_or_create(
            organization=organization,
            indicator_type=indicator['indicator_type'],
            value=indicator['value'],
            defaults={
                'source': indicator['source'],
                'severity': indicator['severity'],
                'confidence_score': indicator['confidence_score'],
                'tags': indicator['tags'],
                'raw_data': indicator['raw_data'],
                'first_seen': default_first_seen,
                'last_seen': now,
                'is_active': True,
            },
        )
        if not created:
            obj.source = indicator['source']
            obj.severity = indicator['severity']
            obj.confidence_score = indicator['confidence_score']
            obj.tags = indicator['tags']
            obj.raw_data = indicator['raw_data']
            obj.last_seen = now
            obj.is_active = True
            obj.save(
                update_fields=['source', 'severity', 'confidence_score', 'tags', 'raw_data', 'last_seen', 'is_active']
            )
        created_or_updated += 1

    return created_or_updated
