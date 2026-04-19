"""
Test suite for incidents API endpoints: permission, auth, and authorization.
"""

import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Incident, Organization, SIEMSettings, SIEMSettingsChangeLog
from .integration_config import IntegrationConfig
from .siem_connectors import SplunkConnector
from .serializers import IncidentSerializer, get_incident_priority


@pytest.fixture
def client():
    """REST API test client."""
    return APIClient()


@pytest.fixture
def auth_user(db):
    """Create and return an authenticated user."""
    user = User.objects.create_user(
        username='testanalyst',
        email='analyst@example.com',
        password='testpass123',
    )
    return user


@pytest.fixture
def org(db):
    """Create and return a test organization."""
    org, _ = Organization.objects.get_or_create(
        slug='test-org',
        defaults={'name': 'Test Organization', 'is_active': True},
    )
    return org


@pytest.fixture
def org2(db):
    """Create and return a second test organization."""
    org, _ = Organization.objects.get_or_create(
        slug='test-org-2',
        defaults={'name': 'Test Organization 2', 'is_active': True},
    )
    return org


@pytest.fixture
def test_incident(db, org):
    """Create and return a test incident."""
    incident = Incident.objects.create(
        organization=org,
        title='Test Incident',
        description='A test incident for permission testing',
        severity='high',
        status='open',
        category='malware',
        source_ip='192.168.1.1',
        target_ip='192.168.1.2',
    )
    return incident


@pytest.mark.django_db
class TestIncidentAPIPermissions:
    """Test permission enforcement on Incident API endpoints."""

    def test_get_incidents_without_auth_allowed(self, client):
        """GET /incidents/ should work without authentication (read-only access)."""
        response = client.get('/api/v1/incidents/')
        assert response.status_code == status.HTTP_200_OK

    def test_get_incident_detail_without_auth_allowed(self, client, test_incident):
        """GET /incidents/{id}/ should work without authentication."""
        response = client.get(f'/api/v1/incidents/{test_incident.incident_id}/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_incident_without_auth_denied(self, client):
        """POST /incidents/ should deny unauthenticated requests."""
        response = client.post(
            '/api/v1/incidents/',
            {
                'title': 'Unauthorized Incident',
                'description': 'Should fail',
                'severity': 'high',
                'status': 'open',
                'category': 'phishing',
            },
            format='json',
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_create_incident_with_auth_allowed(self, client, auth_user):
        """POST /incidents/ should work with authentication."""
        client.force_authenticate(user=auth_user)
        response = client.post(
            '/api/v1/incidents/',
            {
                'title': 'Authorized Incident',
                'description': 'Should succeed',
                'severity': 'high',
                'status': 'open',
                'category': 'phishing',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Authorized Incident'

    def test_update_incident_without_auth_denied(self, client, test_incident):
        """PATCH /incidents/{id}/ should deny unauthenticated requests."""
        response = client.patch(
            f'/api/v1/incidents/{test_incident.incident_id}/',
            {'status': 'resolved'},
            format='json',
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_update_incident_with_auth_allowed(self, client, auth_user, test_incident):
        """PATCH /incidents/{id}/ should work with authentication."""
        client.force_authenticate(user=auth_user)
        response = client.patch(
            f'/api/v1/incidents/{test_incident.incident_id}/',
            {'status': 'resolved'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'resolved'

    def test_delete_incident_without_auth_denied(self, client, test_incident):
        """DELETE /incidents/{id}/ should deny unauthenticated requests."""
        response = client.delete(f'/api/v1/incidents/{test_incident.incident_id}/')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_delete_incident_with_auth_allowed(self, client, auth_user, test_incident):
        """DELETE /incidents/{id}/ should work with authentication."""
        client.force_authenticate(user=auth_user)
        response = client.delete(f'/api/v1/incidents/{test_incident.incident_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_update_status_action_without_auth_denied(self, client, test_incident):
        """PATCH /incidents/{id}/update_status/ should deny unauthenticated requests."""
        response = client.patch(
            f'/api/v1/incidents/{test_incident.incident_id}/update_status/',
            {'status': 'investigating'},
            format='json',
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_update_status_action_with_auth_allowed(self, client, auth_user, test_incident):
        """PATCH /incidents/{id}/update_status/ should work with authentication."""
        client.force_authenticate(user=auth_user)
        response = client.patch(
            f'/api/v1/incidents/{test_incident.incident_id}/update_status/',
            {'status': 'investigating'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'investigating'

    def test_mark_false_positive_without_auth_denied(self, client, test_incident):
        """PATCH /incidents/{id}/mark_false_positive/ should deny unauthenticated requests."""
        response = client.patch(
            f'/api/v1/incidents/{test_incident.incident_id}/mark_false_positive/',
            format='json',
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_mark_false_positive_with_auth_allowed(self, client, auth_user, test_incident):
        """PATCH /incidents/{id}/mark_false_positive/ should work with authentication."""
        client.force_authenticate(user=auth_user)
        response = client.patch(
            f'/api/v1/incidents/{test_incident.incident_id}/mark_false_positive/',
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_false_positive'] is True

    def test_trigger_soar_without_auth_allowed(self, client, test_incident):
        """POST /incidents/{id}/trigger_soar/ should work without authentication."""
        response = client.post(
            f'/api/v1/incidents/{test_incident.incident_id}/trigger_soar/',
            {'playbook': 'isolate-and-contain', 'payload': {}},
            format='json',
        )
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_202_ACCEPTED]

    def test_trigger_soar_with_auth_allowed(self, client, auth_user, test_incident):
        """POST /incidents/{id}/trigger_soar/ should work with authentication."""
        client.force_authenticate(user=auth_user)
        response = client.post(
            f'/api/v1/incidents/{test_incident.incident_id}/trigger_soar/',
            {'playbook': 'isolate-and-contain', 'payload': {}},
            format='json',
        )
        # Should succeed even if SOAR trigger fails (we're testing API auth, not SOAR functionality)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_202_ACCEPTED]


@pytest.mark.django_db
class TestIncidentPriority:
    """Test risk-score-based incident priority behavior."""

    def test_serializer_exposes_priority_from_risk_score(self, org):
        incident = Incident.objects.create(
            organization=org,
            title='Priority Test Incident',
            description='Priority test',
            severity='medium',
            status='open',
            category='malware',
            risk_score=92,
        )

        data = IncidentSerializer(incident).data

        assert data['priority'] == 'critical'

    def test_priority_helper_uses_risk_score_thresholds(self):
        assert get_incident_priority(95) == 'critical'
        assert get_incident_priority(78) == 'high'
        assert get_incident_priority(55) == 'medium'
        assert get_incident_priority(12) == 'low'
        assert get_incident_priority(0) == 'info'

    def test_incident_list_orders_highest_risk_first(self, client, org):
        Incident.objects.create(
            organization=org,
            title='Low Risk',
            description='Low risk',
            severity='low',
            status='open',
            category='reconnaissance',
            risk_score=10,
        )
        high_risk = Incident.objects.create(
            organization=org,
            title='High Risk',
            description='High risk',
            severity='critical',
            status='open',
            category='data-exfiltration',
            risk_score=95,
        )

        response = client.get('/api/v1/incidents/')

        assert response.status_code == status.HTTP_200_OK
        results = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        assert results[0]['incident_id'] == high_risk.incident_id
        assert results[0]['priority'] == 'critical'

    def test_counterfactual_simulate_without_auth_allowed(self, client, test_incident):
        """POST /incidents/{id}/counterfactual_simulate/ should be allowed without authentication."""
        response = client.post(
            f'/api/v1/incidents/{test_incident.incident_id}/counterfactual_simulate/',
            {'actions': ['host_isolation']},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'recommended_action' in response.data


@pytest.mark.django_db
class TestNotificationAPIPermissions:
    """Test permission enforcement on Notification API endpoints."""

    def test_get_notifications_without_auth_allowed(self, client):
        """GET /notifications/ should work without authentication."""
        response = client.get('/api/v1/notifications/')
        assert response.status_code == status.HTTP_200_OK

    def test_mark_notification_read_without_auth_denied(self, client):
        """PATCH /notifications/{id}/mark_read/ should deny unauthenticated requests."""
        response = client.patch('/api/v1/notifications/1/mark_read/', format='json')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_mark_all_notifications_read_without_auth_denied(self, client):
        """POST /notifications/mark_all_read/ should deny unauthenticated requests."""
        response = client.post('/api/v1/notifications/mark_all_read/', format='json')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestThreatIntelAPIPermissions:
    """Test permission enforcement on Threat Intelligence API endpoints."""

    def test_get_threat_intel_without_auth_allowed(self, client):
        """GET /threat-intel/ should work without authentication."""
        response = client.get('/api/v1/threat-intel/')
        assert response.status_code == status.HTTP_200_OK

    def test_sync_threat_intel_without_auth_allowed(self, client):
        """POST /threat-intel/sync_live/ should work without authentication in demo mode."""
        response = client.post('/api/v1/threat-intel/sync_live/', format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_sync_threat_intel_with_auth_allowed(self, client, auth_user):
        """POST /threat-intel/sync_live/ should work with authentication."""
        client.force_authenticate(user=auth_user)
        response = client.post('/api/v1/threat-intel/sync_live/', format='json')
        # Should succeed (or fail gracefully due to missing config, but not 401)
        assert response.status_code != status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestSoarAPIPermissions:
    """Test permission enforcement on SOAR Playbook API endpoints."""

    def test_get_soar_executions_without_auth_allowed(self, client):
        """GET /soar-executions/ should work without authentication."""
        response = client.get('/api/v1/soar-executions/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAnalystNotesAPIPermissions:
    """Test permission enforcement on Analyst Notes API endpoints."""

    def test_create_analyst_note_without_auth_allowed(self, client, test_incident):
        """POST /analyst-notes/ should work without authentication in demo mode."""
        response = client.post(
            '/api/v1/analyst-notes/',
            {
                'incident': test_incident.incident_id,
                'author': 'Demo Analyst',
                'role': 'SOC Analyst',
                'content': 'Added from unauthenticated demo flow',
                'note_type': 'observation',
                'ai_relevant': True,
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestSyncEndpointsPermissions:
    """Test permission enforcement on sync endpoints."""

    def test_sync_splunk_without_auth_denied(self, client):
        """POST /sync/splunk/ should deny unauthenticated requests."""
        response = client.post('/api/v1/sync/splunk/', format='json')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_sync_elasticsearch_without_auth_denied(self, client):
        """POST /sync/elasticsearch/ should deny unauthenticated requests."""
        response = client.post('/api/v1/sync/elasticsearch/', format='json')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_sync_splunk_with_auth_allowed(self, client, auth_user):
        """POST /sync/splunk/ should work with authentication."""
        client.force_authenticate(user=auth_user)
        response = client.post('/api/v1/sync/splunk/', format='json')
        # Should succeed or fail gracefully, but not 401
        assert response.status_code != status.HTTP_401_UNAUTHORIZED

    def test_sync_elasticsearch_with_auth_allowed(self, client, auth_user):
        """POST /sync/elasticsearch/ should work with authentication."""
        client.force_authenticate(user=auth_user)
        response = client.post('/api/v1/sync/elasticsearch/', format='json')
        # Should succeed or fail gracefully, but not 401
        assert response.status_code != status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestSyncSplunkIntegration:
    """Integration tests for Splunk sync endpoint."""

    def test_splunk_sync_success_creates_incidents(self, client, auth_user, org):
        """Splunk sync should create incidents from connector."""
        client.force_authenticate(user=auth_user)
        mock_incidents = [
            {
                'title': 'Splunk Event 1',
                'description': 'Suspicious activity',
                'severity': 'high',
                'category': 'malware',
                'source': 'splunk',
                'external_id': 'splunk-evt-001',
                'source_ip': '10.0.0.1',
                'target_ip': '10.0.0.2',
                'affected_assets': ['server-1'],
            }
        ]
        
        with patch('incidents.siem_connectors.SplunkConnector') as mock_connector_class:
            mock_instance = MagicMock()
            mock_instance.fetch_incidents.return_value = mock_incidents
            mock_connector_class.return_value = mock_instance
            
            response = client.post(
                '/api/v1/sync/splunk/',
                {'organization_id': org.org_id},
                format='json'
            )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['created_incidents'] == 1
        
        # Verify incident was created in correct organization
        incident = Incident.objects.get(external_id='splunk-evt-001')
        assert incident.organization == org
        assert incident.title == 'Splunk Event 1'
        assert incident.source == 'splunk'

    def test_splunk_sync_organization_slug_scoping(self, client, auth_user, org, org2):
        """Splunk sync should respect organization slug parameter."""
        client.force_authenticate(user=auth_user)
        mock_incidents = [
            {
                'title': 'Incident for Org2',
                'description': 'Should go to org2',
                'severity': 'medium',
                'category': 'phishing',
                'source': 'splunk',
                'external_id': 'splunk-evt-002',
            }
        ]
        
        with patch('incidents.siem_connectors.SplunkConnector') as mock_connector_class:
            mock_instance = MagicMock()
            mock_instance.fetch_incidents.return_value = mock_incidents
            mock_connector_class.return_value = mock_instance
            
            response = client.post(
                '/api/v1/sync/splunk/',
                {'organization': 'test-org-2'},
                format='json'
            )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['created_incidents'] == 1
        
        # Verify incident belongs to org2
        incident = Incident.objects.get(external_id='splunk-evt-002')
        assert incident.organization == org2

    def test_splunk_sync_no_duplicates_on_retry(self, client, auth_user, org):
        """Splunk sync should not create duplicate incidents with same external_id."""
        client.force_authenticate(user=auth_user)
        mock_incidents = [
            {
                'title': 'Duplicate Test',
                'description': 'First sync',
                'severity': 'high',
                'category': 'malware',
                'source': 'splunk',
                'external_id': 'splunk-dup-001',
            }
        ]
        
        with patch('incidents.siem_connectors.SplunkConnector') as mock_connector_class:
            mock_instance = MagicMock()
            mock_instance.fetch_incidents.return_value = mock_incidents
            mock_connector_class.return_value = mock_instance
            
            # First sync
            response1 = client.post(
                '/api/v1/sync/splunk/',
                {'organization_id': org.org_id},
                format='json'
            )
            assert response1.data['created_incidents'] == 1
            
            # Second sync with same data
            response2 = client.post(
                '/api/v1/sync/splunk/',
                {'organization_id': org.org_id},
                format='json'
            )
            assert response2.data['created_incidents'] == 0
        
        # Verify only one incident exists
        assert Incident.objects.filter(external_id='splunk-dup-001').count() == 1

    def test_splunk_sync_error_handling(self, client, auth_user, org):
        """Splunk sync should handle connector errors gracefully."""
        client.force_authenticate(user=auth_user)
        
        with patch('incidents.siem_connectors.SplunkConnector') as mock_connector_class:
            mock_instance = MagicMock()
            mock_instance.fetch_incidents.side_effect = Exception('Connection failed')
            mock_connector_class.return_value = mock_instance
            
            response = client.post(
                '/api/v1/sync/splunk/',
                {'organization_id': org.org_id},
                format='json'
            )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False
        assert 'error' in response.data

    def test_splunk_sync_empty_response(self, client, auth_user, org):
        """Splunk sync should handle empty incident list."""
        client.force_authenticate(user=auth_user)
        
        with patch('incidents.siem_connectors.SplunkConnector') as mock_connector_class:
            mock_instance = MagicMock()
            mock_instance.fetch_incidents.return_value = []
            mock_connector_class.return_value = mock_instance
            
            response = client.post(
                '/api/v1/sync/splunk/',
                {'organization_id': org.org_id},
                format='json'
            )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['created_incidents'] == 0


@pytest.mark.django_db
class TestSyncElasticsearchIntegration:
    """Integration tests for Elasticsearch sync endpoint."""

    def test_elasticsearch_sync_success_creates_incidents(self, client, auth_user, org):
        """Elasticsearch sync should create incidents from connector."""
        client.force_authenticate(user=auth_user)
        mock_incidents = [
            {
                'title': 'Elasticsearch Alert 1',
                'description': 'Security event detected',
                'severity': 'critical',
                'category': 'malware',
                'source': 'elasticsearch',
                'external_id': 'elastic-evt-001',
                'source_ip': '192.168.1.100',
                'target_ip': '192.168.1.1',
                'affected_assets': ['workstation-1'],
            }
        ]
        
        with patch('incidents.siem_connectors.ElasticsearchConnector') as mock_connector_class:
            mock_instance = MagicMock()
            mock_instance.fetch_incidents.return_value = mock_incidents
            mock_connector_class.return_value = mock_instance
            
            response = client.post(
                '/api/v1/sync/elasticsearch/',
                {'organization_id': org.org_id},
                format='json'
            )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['created_incidents'] == 1
        
        # Verify incident was created in correct organization
        incident = Incident.objects.get(external_id='elastic-evt-001')
        assert incident.organization == org
        assert incident.title == 'Elasticsearch Alert 1'
        assert incident.source == 'elasticsearch'

    def test_elasticsearch_sync_organization_id_by_integer(self, client, auth_user, org):
        """Elasticsearch sync should accept organization_id as integer."""
        client.force_authenticate(user=auth_user)
        mock_incidents = [
            {
                'title': 'Integer Org Test',
                'description': 'Org lookup by ID',
                'severity': 'medium',
                'category': 'phishing',
                'source': 'elasticsearch',
                'external_id': 'elastic-int-001',
            }
        ]
        
        with patch('incidents.siem_connectors.ElasticsearchConnector') as mock_connector_class:
            mock_instance = MagicMock()
            mock_instance.fetch_incidents.return_value = mock_incidents
            mock_connector_class.return_value = mock_instance
            
            response = client.post(
                '/api/v1/sync/elasticsearch/',
                {'organization_id': org.org_id},
                format='json'
            )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['created_incidents'] == 1
        
        incident = Incident.objects.get(external_id='elastic-int-001')
        assert incident.organization == org

    def test_elasticsearch_sync_error_handling(self, client, auth_user, org):
        """Elasticsearch sync should handle connector errors gracefully."""
        client.force_authenticate(user=auth_user)
        
        with patch('incidents.siem_connectors.ElasticsearchConnector') as mock_connector_class:
            mock_instance = MagicMock()
            mock_instance.fetch_incidents.side_effect = Exception('ES unavailable')
            mock_connector_class.return_value = mock_instance
            
            response = client.post(
                '/api/v1/sync/elasticsearch/',
                {'organization_id': org.org_id},
                format='json'
            )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False

    def test_elasticsearch_sync_bulk_incidents(self, client, auth_user, org):
        """Elasticsearch sync should handle multiple incidents."""
        client.force_authenticate(user=auth_user)
        mock_incidents = [
            {
                'title': f'Alert {i}',
                'description': f'Event {i}',
                'severity': 'high',
                'category': 'malware',
                'source': 'elasticsearch',
                'external_id': f'elastic-bulk-{i:03d}',
            }
            for i in range(1, 6)
        ]
        
        with patch('incidents.siem_connectors.ElasticsearchConnector') as mock_connector_class:
            mock_instance = MagicMock()
            mock_instance.fetch_incidents.return_value = mock_incidents
            mock_connector_class.return_value = mock_instance
            
            response = client.post(
                '/api/v1/sync/elasticsearch/',
                {'organization_id': org.org_id},
                format='json'
            )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['created_incidents'] == 5
        assert Incident.objects.filter(organization=org, source='elasticsearch').count() == 5


@pytest.mark.django_db
class TestSIEMSettingsAPI:
    """Test SIEM settings API endpoint behavior."""

    def setup_method(self):
        SIEMSettings.objects.all().delete()
        SIEMSettingsChangeLog.objects.all().delete()

    def test_get_siem_settings_allowed_without_auth(self, client):
        """GET /settings/siem/ should be readable without authentication."""
        response = client.get('/api/v1/settings/siem/')
        assert response.status_code == status.HTTP_200_OK
        assert 'splunk' in response.data
        assert 'elasticsearch' in response.data

    def test_put_siem_settings_requires_auth(self, client):
        """PUT /settings/siem/ should reject unauthenticated requests."""
        response = client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {'enabled': True},
            },
            format='json',
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_put_siem_settings_updates_runtime_config(self, client, auth_user):
        """PUT /settings/siem/ should update persisted settings and return redacted auth payload."""
        client.force_authenticate(user=auth_user)

        response = client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {
                    'enabled': True,
                    'url': 'https://splunk.example.local:8089',
                    'username': 'splunk-user',
                    'password': 'splunk-pass',
                    'ssl_verify': True,
                    'sync_schedule': '*/10',
                    'search_query': 'search index=notable sourcetype=notable earliest=-2h | head 50',
                },
                'elasticsearch': {
                    'enabled': True,
                    'url': 'https://elastic.example.local:9200',
                    'username': 'elastic-user',
                    'password': 'elastic-pass',
                    'ssl_verify': True,
                    'sync_schedule': '*/5',
                    'detection_index': '.detections-custom',
                },
            },
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['splunk']['enabled'] is True
        assert response.data['splunk']['url'] == 'https://splunk.example.local:8089'
        assert response.data['splunk']['auth']['username'] == 'splunk-user'
        assert response.data['splunk']['auth']['has_password'] is True
        assert 'password' not in response.data['splunk']['auth']
        assert response.data['splunk']['sync_schedule'] == '*/10'
        assert response.data['splunk']['search_query'] == 'search index=notable sourcetype=notable earliest=-2h | head 50'

        assert response.data['elasticsearch']['enabled'] is True
        assert response.data['elasticsearch']['url'] == 'https://elastic.example.local:9200'
        assert response.data['elasticsearch']['auth']['username'] == 'elastic-user'
        assert response.data['elasticsearch']['auth']['has_password'] is True
        assert 'password' not in response.data['elasticsearch']['auth']
        assert response.data['elasticsearch']['sync_schedule'] == '*/5'
        assert response.data['elasticsearch']['detection_index'] == '.detections-custom'
        assert response.data['audit']['updated_by'] == auth_user.username
        assert response.data['audit']['updated_at'] is not None

        schedules = IntegrationConfig.get_sync_schedule()
        assert schedules['splunk'] == '*/10'
        assert schedules['elasticsearch'] == '*/5'

    def test_put_siem_settings_rejects_unknown_top_level_keys(self, client, auth_user):
        """PUT /settings/siem/ should reject unknown top-level payload keys."""
        client.force_authenticate(user=auth_user)

        response = client.put(
            '/api/v1/settings/siem/',
            {
                'sentinel': {'enabled': True},
            },
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'non_field_errors' in response.data

    def test_put_siem_settings_rejects_invalid_connector_shape(self, client, auth_user):
        """PUT /settings/siem/ should reject non-object connector payloads."""
        client.force_authenticate(user=auth_user)

        response = client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': 'invalid',
            },
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'splunk' in response.data

    def test_put_siem_settings_rejects_unknown_connector_fields(self, client, auth_user):
        """PUT /settings/siem/ should reject unknown fields within connector payload."""
        client.force_authenticate(user=auth_user)

        response = client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {
                    'enabled': True,
                    'unexpected_flag': True,
                },
            },
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'splunk' in response.data

    def test_put_siem_settings_allows_partial_connector_update(self, client, auth_user):
        """PUT /settings/siem/ should allow updating only one connector partially."""
        client.force_authenticate(user=auth_user)

        response = client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {
                    'enabled': True,
                },
            },
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['splunk']['enabled'] is True
        assert 'elasticsearch' in response.data

    def test_get_siem_settings_redacts_passwords(self, client, auth_user):
        """GET /settings/siem/ should not expose connector passwords."""
        client.force_authenticate(user=auth_user)
        client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {
                    'password': 'secret-one',
                },
                'elasticsearch': {
                    'password': 'secret-two',
                },
            },
            format='json',
        )

        response = client.get('/api/v1/settings/siem/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['splunk']['auth']['has_password'] is True
        assert response.data['elasticsearch']['auth']['has_password'] is True
        assert 'password' not in response.data['splunk']['auth']
        assert 'password' not in response.data['elasticsearch']['auth']
        assert response.data['audit']['updated_by'] == auth_user.username
        assert response.data['audit']['updated_at'] is not None

    def test_put_siem_settings_blank_password_preserves_existing_secret(self, client, auth_user):
        """Blank password updates should preserve the previously stored secret."""
        client.force_authenticate(user=auth_user)

        client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {
                    'password': 'initial-secret',
                    'username': 'splunk-user',
                },
            },
            format='json',
        )

        response = client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {
                    'password': '',
                    'username': 'splunk-user-updated',
                },
            },
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        config = IntegrationConfig.get_splunk_config()
        assert config['auth']['username'] == 'splunk-user-updated'
        assert config['auth']['password'] == 'initial-secret'

    def test_put_siem_settings_updates_audit_actor_on_each_save(self, client, auth_user):
        """Audit metadata should reflect the authenticated user performing the latest update."""
        client.force_authenticate(user=auth_user)

        response_one = client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {
                    'enabled': True,
                },
            },
            format='json',
        )
        assert response_one.status_code == status.HTTP_200_OK
        assert response_one.data['audit']['updated_by'] == auth_user.username

        response_two = client.put(
            '/api/v1/settings/siem/',
            {
                'elasticsearch': {
                    'enabled': True,
                },
            },
            format='json',
        )
        assert response_two.status_code == status.HTTP_200_OK
        assert response_two.data['audit']['updated_by'] == auth_user.username

    def test_put_siem_settings_records_change_history(self, client, auth_user):
        """Each SIEM settings save should append a change log entry."""
        client.force_authenticate(user=auth_user)

        response = client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {
                    'enabled': True,
                    'url': 'https://splunk.history.local:8089',
                    'username': 'history-user',
                    'password': 'history-secret',
                },
            },
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        history = response.data['history']
        assert len(history) >= 1
        assert history[0]['connector'] == 'splunk'
        assert history[0]['changed_by'] == auth_user.username
        assert history[0]['config_snapshot']['auth']['has_password'] is True
        assert 'password' not in history[0]['config_snapshot']['auth']

        assert SIEMSettingsChangeLog.objects.filter(connector='splunk').count() == 1

    def test_get_siem_settings_returns_recent_change_history(self, client, auth_user):
        """GET /settings/siem/ should include the latest change log entries."""
        client.force_authenticate(user=auth_user)

        client.put(
            '/api/v1/settings/siem/',
            {
                'elasticsearch': {
                    'enabled': True,
                    'url': 'https://elastic.history.local:9200',
                    'username': 'elastic-history',
                    'password': 'elastic-history-secret',
                },
            },
            format='json',
        )

        response = client.get('/api/v1/settings/siem/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['history'][0]['connector'] == 'elasticsearch'
        assert response.data['history'][0]['changed_by'] == auth_user.username
        assert response.data['history'][0]['change_id'] is not None

    def test_post_restore_siem_settings_from_history(self, client, auth_user):
        """POST /settings/siem/restore/ should restore a connector from history while preserving secrets."""
        client.force_authenticate(user=auth_user)

        save_response = client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {
                    'enabled': True,
                    'url': 'https://splunk.restore.local:8089',
                    'username': 'restore-user',
                    'password': 'restore-secret',
                    'sync_schedule': '*/20',
                },
            },
            format='json',
        )
        change_id = save_response.data['history'][0]['change_id']

        update_response = client.put(
            '/api/v1/settings/siem/',
            {
                'splunk': {
                    'enabled': False,
                    'url': 'https://splunk.changed.local:8089',
                    'username': 'changed-user',
                    'password': '',
                    'sync_schedule': '*/5',
                },
            },
            format='json',
        )
        assert update_response.status_code == status.HTTP_200_OK

        restore_response = client.post(
            '/api/v1/settings/siem/restore/',
            {
                'connector': 'splunk',
                'change_id': change_id,
            },
            format='json',
        )

        assert restore_response.status_code == status.HTTP_200_OK
        assert restore_response.data['splunk']['enabled'] is True
        assert restore_response.data['splunk']['url'] == 'https://splunk.restore.local:8089'
        assert restore_response.data['splunk']['auth']['username'] == 'restore-user'
        assert restore_response.data['splunk']['auth']['has_password'] is True
        assert restore_response.data['audit']['updated_by'] == auth_user.username

    def test_post_restore_siem_settings_rejects_missing_history_entry(self, client, auth_user):
        """POST /settings/siem/restore/ should return 404 for missing entries."""
        client.force_authenticate(user=auth_user)

        response = client.post(
            '/api/v1/settings/siem/restore/',
            {
                'connector': 'splunk',
                'change_id': 99999,
            },
            format='json',
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestSplunkConnectorParsing:
    """Ensure Splunk connector maps events into meaningful incidents."""

    def test_parse_splunk_incidents_builds_meaningful_fields(self):
        connector = SplunkConnector({'url': 'https://splunk.local:8089', 'auth': {'username': 'u', 'password': 'p'}})

        parsed = connector._parse_splunk_incidents([
            {
                'rule_name': 'Brute Force Detection',
                'message': 'Multiple failed auth attempts observed',
                'severity': 'high',
                'src': '10.10.10.10',
                'dest': '172.16.1.10',
                'src_host': 'workstation-22',
                'event_id': 'evt-123',
            }
        ])

        assert len(parsed) == 1
        incident = parsed[0]
        assert incident['title'] == 'Brute Force Detection'
        assert 'failed auth attempts' in incident['description']
        assert incident['severity'] == 'high'
        assert incident['category'] == 'brute-force'
        assert incident['source_ip'] == '10.10.10.10'
        assert incident['target_ip'] == '172.16.1.10'
        assert 'workstation-22' in incident['affected_assets']
        assert incident['external_id'] == 'evt-123'

    def test_parse_splunk_incidents_skips_non_security_internal_noise(self):
        connector = SplunkConnector({'url': 'https://splunk.local:8089', 'auth': {'username': 'u', 'password': 'p'}})

        parsed = connector._parse_splunk_incidents([
            {
                'host': 'splunk-indexer-1',
                '_raw': 'metrics.log INFO Pipeline throughput=1200 EPS',
                'sourcetype': 'splunkd',
            }
        ])

        assert parsed == []
