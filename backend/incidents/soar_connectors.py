from __future__ import annotations

from typing import Any

import requests
from django.utils import timezone

from .integration_config import IntegrationConfig
from .models import Incident, SoarPlaybookExecution


def _safe_json(response: requests.Response) -> dict[str, Any]:
    try:
        data = response.json()
        return data if isinstance(data, dict) else {'data': data}
    except ValueError:
        return {'text': response.text}


def trigger_soar_playbook(
    incident: Incident,
    playbook: str,
    payload: dict[str, Any] | None = None,
) -> SoarPlaybookExecution:
    payload = payload or {}
    config = IntegrationConfig.get_soar_config()

    execution = SoarPlaybookExecution.objects.create(
        organization=incident.organization,
        incident=incident,
        playbook=playbook,
        status='requested',
        request_payload=payload,
    )

    if not config.get('enabled', False):
        execution.status = 'failed'
        execution.error_message = 'SOAR integration is disabled'
        execution.completed_at = timezone.now()
        execution.save(update_fields=['status', 'error_message', 'completed_at'])
        return execution

    webhook_url = config.get('webhook_url')
    if not webhook_url:
        execution.status = 'failed'
        execution.error_message = 'SOAR webhook URL is not configured'
        execution.completed_at = timezone.now()
        execution.save(update_fields=['status', 'error_message', 'completed_at'])
        return execution

    body = {
        'playbook': playbook,
        'incident': {
            'incident_id': incident.incident_id,
            'title': incident.title,
            'description': incident.description,
            'severity': incident.severity,
            'status': incident.status,
            'category': incident.category,
            'source_ip': incident.source_ip,
            'target_ip': incident.target_ip,
            'risk_score': incident.risk_score,
            'confidence_score': incident.confidence_score,
            'affected_assets': incident.affected_assets,
            'organization': incident.organization.slug if incident.organization else None,
        },
        'payload': payload,
    }

    headers = {'Content-Type': 'application/json'}
    api_key = config.get('api_key')
    if api_key:
        headers['Authorization'] = f'Bearer {api_key}'

    try:
        response = requests.post(
            webhook_url,
            json=body,
            headers=headers,
            timeout=config.get('timeout', 20),
            verify=config.get('ssl_verify', False),
        )
        response_payload = _safe_json(response)

        if response.ok:
            execution.status = 'success'
            execution.response_payload = response_payload
            execution.external_execution_id = (
                str(response_payload.get('execution_id') or response_payload.get('id') or '')
            )
        else:
            execution.status = 'failed'
            execution.response_payload = response_payload
            execution.error_message = f'HTTP {response.status_code}'

    except requests.RequestException as exc:
        execution.status = 'failed'
        execution.error_message = str(exc)

    execution.completed_at = timezone.now()
    execution.save(
        update_fields=[
            'status',
            'response_payload',
            'external_execution_id',
            'error_message',
            'completed_at',
        ]
    )
    return execution
