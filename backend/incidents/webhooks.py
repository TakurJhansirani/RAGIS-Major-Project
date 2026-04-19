from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .siem_connectors import HTTPWebhookReceiver
from .serializers import IncidentSerializer
from .integration_config import IntegrationConfig


def _payload_value(payload, *keys, default=None):
    for key in keys:
        if key in payload and payload[key] is not None:
            return payload[key]
    return default


def _normalize_webhook_payload(payload):
    assets = _payload_value(payload, 'affected_assets', 'affectedAssets', default=[])
    if isinstance(assets, str):
        assets = [item.strip() for item in assets.split(',') if item.strip()]
    if not isinstance(assets, list):
        assets = []

    return {
        'title': _payload_value(payload, 'title', default='Webhook Incident'),
        'description': _payload_value(payload, 'description', default=''),
        'severity': _payload_value(payload, 'severity', default='medium'),
        'status': _payload_value(payload, 'status', default='open'),
        'category': _payload_value(payload, 'category', default='reconnaissance'),
        'source_ip': _payload_value(payload, 'source_ip', 'sourceIP'),
        'target_ip': _payload_value(payload, 'target_ip', 'targetIP'),
        'affected_assets': assets,
        'source': _payload_value(payload, 'source', default='webhook'),
        'external_id': _payload_value(payload, 'external_id', 'externalId', default=''),
        'organization_id': _payload_value(payload, 'organization_id'),
        'organization': _payload_value(payload, 'organization', 'organization_slug'),
    }

@api_view(['POST'])
@permission_classes([AllowAny])  # Webhook endpoints often don't require auth
def webhook_incident(request):
    """
    Webhook endpoint to receive incidents from external systems
    
    POST /api/v1/webhooks/incident/
    
    Body:
    {
        "title": "Suspicious login detected",
        "description": "Multiple failed SSH login attempts",
        "severity": "high",
        "category": "brute-force",
        "source_ip": "192.168.1.100",
        "target_ip": "10.0.0.5",
        "affected_assets": ["server-01"],
        "source": "custom-siem",
        "external_id": "evt-12345"
    }
    """
    try:
        webhook_config = IntegrationConfig.get_webhook_config()
        if not webhook_config.get('enabled', True):
            return Response(
                {
                    'success': False,
                    'error': 'Webhook ingestion is disabled'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        expected_secret = webhook_config.get('secret', '')
        if expected_secret:
            provided_secret = request.headers.get('X-Webhook-Secret') or request.data.get('webhook_secret')
            if provided_secret != expected_secret:
                return Response(
                    {
                        'success': False,
                        'error': 'Invalid webhook secret'
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )

        payload = _normalize_webhook_payload(request.data)
        incident = HTTPWebhookReceiver.create_incident_from_webhook(payload)
        serializer = IncidentSerializer(incident)
        return Response(
            {
                'success': True,
                'incident': serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'error': str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_splunk_incidents(request):
    """Trigger manual sync from Splunk"""
    from .siem_connectors import sync_incidents_from_splunk
    splunk_config = IntegrationConfig.get_splunk_config()

    config = {
        'url': request.data.get('url') or splunk_config.get('url'),
        'auth': {
            'username': request.data.get('username') or splunk_config.get('auth', {}).get('username'),
            'password': request.data.get('password') or splunk_config.get('auth', {}).get('password')
        },
        'ssl_verify': splunk_config.get('ssl_verify', False),
        'organization_id': request.data.get('organization_id'),
        'organization': request.data.get('organization'),
    }
    
    try:
        created = sync_incidents_from_splunk(config)
        return Response({
            'success': True,
            'created_incidents': created
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_elasticsearch_incidents(request):
    """Trigger manual sync from Elasticsearch"""
    from .siem_connectors import sync_incidents_from_elasticsearch
    elasticsearch_config = IntegrationConfig.get_elasticsearch_config()

    config = {
        'url': request.data.get('url') or elasticsearch_config.get('url'),
        'auth': {
            'username': request.data.get('username') or elasticsearch_config.get('auth', {}).get('username'),
            'password': request.data.get('password') or elasticsearch_config.get('auth', {}).get('password')
        },
        'ssl_verify': elasticsearch_config.get('ssl_verify', False),
        'organization_id': request.data.get('organization_id'),
        'organization': request.data.get('organization'),
    }
    
    try:
        created = sync_incidents_from_elasticsearch(config)
        return Response({
            'success': True,
            'created_incidents': created
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
