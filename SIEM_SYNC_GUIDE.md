# SIEM Sync Integration Guide

This guide documents the SIEM sync feature that enables manual and automated syncing of security incidents from Splunk and Elasticsearch into the Cogent Threat platform.

## Feature Overview

The SIEM sync feature provides:
- **Manual sync triggers** for on-demand incident ingestion from Splunk and Elasticsearch
- **Organization-scoped syncing** to ensure incidents are placed in the correct organizational context
- **Real-time incident creation** with full metadata preservation (severity, category, source IPs, affected assets)
- **Deduplication** to prevent duplicate incidents on retry
- **Error resilience** with graceful handling of connector failures

## Architecture

### Frontend Layer

#### React Query Hooks (`src/hooks/useIncidents.ts`)

Two custom hooks manage SIEM sync mutations:

```typescript
export const useSyncSplunkIncidents = () => {
  // POST to /sync/splunk/ with optional organization parameter
  // Invalidates: incidents, recent-incidents, incident-stats
}

export const useSyncElasticsearchIncidents = () => {
  // POST to /sync/elasticsearch/ with optional organization parameter
  // Invalidates: incidents, recent-incidents, incident-stats
}
```

**Usage in Components:**

```typescript
const { mutateAsync, isPending } = useSyncSplunkIncidents();

const handleSync = async () => {
  try {
    const result = await mutateAsync({ organization: 'org-slug' });
    console.log(`Created ${result.created_incidents} incidents`);
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
```

**Mutation Configuration:**
- **URL**: `/sync/splunk/` or `/sync/elasticsearch/`
- **Method**: POST
- **Auth**: Requires Bearer token from session context
- **Body**: `{ organization?: string | number }`
- **Response**: `{ success: boolean, created_incidents: number }`
- **Cache Invalidation**: Invalidates `incidents`, `recent-incidents`, and `incident-stats` queries on success

### UI Component

#### SIEMIntegrationSettings (`src/components/settings/SIEMIntegrationSettings.tsx`)

Displays SIEM integration status and provides manual sync buttons.

**Props:**
```typescript
interface Props {
  organization?: string | number;        // Optional org scope
  organizationLabel?: string;              // Display label for scope
}
```

**Features:**
- Shows integration status for Splunk, Elasticsearch, and planned platforms
- Manual sync buttons trigger mutations with organization context
- Loading states disable buttons during sync
- Success/error toast notifications
- Displays badges for "Planned" platforms (Microsoft Sentinel, CrowdStrike, Palo Alto)
- Shows last sync timestamp and event ingestion counts

**Example Usage:**

```typescript
<SIEMIntegrationSettings
  organization={selectedOrganization}
  organizationLabel={selectedOrganizationLabel}
/>
```

### Backend Layer

#### API Endpoints

**Splunk Sync Endpoint**
```
POST /api/v1/sync/splunk/
Authorization: Bearer {token}
Content-Type: application/json

{
  "organization_id": 123,
  "organization": "org-slug",
  "url": "https://splunk.example.com",
  "username": "admin",
  "password": "secret"
}
```

**Elasticsearch Sync Endpoint**
```
POST /api/v1/sync/elasticsearch/
Authorization: Bearer {token}
Content-Type: application/json

{
  "organization_id": 456,
  "organization": "org-slug",
  "url": "https://elasticsearch.example.com",
  "username": "elastic",
  "password": "secret"
}
```

**Response Format (Success):**
```json
{
  "success": true,
  "created_incidents": 5
}
```

**Response Format (Error):**
```json
{
  "success": false,
  "error": "Connection failed: ECONNREFUSED"
}
```

#### Implementation (`backend/incidents/webhooks.py`)

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_splunk_incidents(request):
    """Trigger manual sync from Splunk"""
    splunk_config = IntegrationConfig.get_splunk_config()
    
    # Merge request params with configured defaults
    config = {
        'url': request.data.get('url') or splunk_config.get('url'),
        'auth': {...},
        'organization_id': request.data.get('organization_id'),
        'organization': request.data.get('organization'),
    }
    
    # Call connector and create incidents
    created = sync_incidents_from_splunk(config)
    return Response({
        'success': True,
        'created_incidents': created
    })
```

#### Incident Creation Logic (`backend/incidents/siem_connectors.py`)

```python
def sync_incidents_from_splunk(config: Dict):
    """Background task to sync incidents from Splunk"""
    connector = SplunkConnector(config)
    incidents = connector.fetch_incidents()
    
    # Resolve organization
    organization = _resolve_organization(config)
    
    # Create incidents with deduplication
    created_count = 0
    for incident_data in incidents:
        incident, created = Incident.objects.get_or_create(
            organization=organization,
            external_id=incident_data.get('external_id'),
            source=incident_data.get('source'),
            defaults={...}
        )
        if created:
            created_count += 1
    
    return created_count
```

**Organization Resolution:**
Incidents are assigned to organizations in this priority order:
1. `config.get('organization_id')` → lookup by numeric org_id
2. `config.get('organization')` → lookup by slug string
3. Fallback to default organization if not found

## Testing

### Frontend Tests (`src/components/settings/SIEMIntegrationSettings.test.tsx`)

6 comprehensive tests covering:
- Sync button rendering and click behavior
- Organization parameter passing to mutations
- Success toast notifications
- Error toast notifications
- Loading state UI feedback
- Mutation pending states

```typescript
it('should call sync with correct organization scope', async () => {
  const mockMutation = vi.fn().mockResolvedValue({ created_incidents: 3 });
  useSyncSplunkIncidents = vi.fn(() => ({
    mutateAsync: mockMutation,
    isPending: false,
  }));
  
  // Component passes organization to mutation
  expect(mockMutation).toHaveBeenCalledWith({ organization: 'test-org' });
});
```

### Backend Tests (`backend/incidents/tests.py`)

**Permission Tests (4 tests):**
- Unauthenticated requests return 401/403
- Authenticated requests proceed regardless of backend state

**Integration Tests - Splunk (5 tests):**
- `test_splunk_sync_success_creates_incidents` - Incident creation from mock connector
- `test_splunk_sync_organization_slug_scoping` - Organization lookup by slug
- `test_splunk_sync_no_duplicates_on_retry` - Idempotency via external_id
- `test_splunk_sync_error_handling` - Exception handling
- `test_splunk_sync_empty_response` - Empty incident list

**Integration Tests - Elasticsearch (4 tests):**
- `test_elasticsearch_sync_success_creates_incidents` - Basic incident creation
- `test_elasticsearch_sync_organization_id_by_integer` - Numeric org_id lookup
- `test_elasticsearch_sync_error_handling` - Exception handling
- `test_elasticsearch_sync_bulk_incidents` - Processing 5 incidents

**Using Mocked Connectors:**

```python
@pytest.mark.django_db
def test_splunk_sync_success_creates_incidents(client, auth_user, org):
    client.force_authenticate(user=auth_user)
    mock_incidents = [
        {
            'title': 'Splunk Event 1',
            'severity': 'high',
            'source': 'splunk',
            'external_id': 'splunk-evt-001',
        }
    ]
    
    # Mock the connector to control fetch behavior
    with patch('incidents.siem_connectors.SplunkConnector') as mock_class:
        mock_instance = MagicMock()
        mock_instance.fetch_incidents.return_value = mock_incidents
        mock_class.return_value = mock_instance
        
        response = client.post(
            '/api/v1/sync/splunk/',
            {'organization_id': org.org_id},
            format='json'
        )
    
    assert response.status_code == 200
    assert response.data['created_incidents'] == 1
```

## Integration Examples

### Manual Sync from Settings Panel

**Frontend:**
1. User navigates to Settings → SIEM Integration
2. Selects organization from dropdown (if available)
3. Clicks "Sync Splunk" button
4. Component calls `useSyncSplunkIncidents().mutateAsync({organization: 'selected-org'})`
5. Toast notification shows success/error
6. Incident list auto-refreshes via query invalidation

**Backend Flow:**
1. POST `/sync/splunk/` endpoint receives org scope
2. Loads Splunk config from `IntegrationConfig.get_splunk_config()`
3. Instantiates `SplunkConnector` with merged config
4. Calls `connector.fetch_incidents()` to retrieve events
5. Calls `sync_incidents_from_splunk()` to create/deduplicate incidents
6. Returns count of new incidents created
7. Frontend queries are invalidated, incident list updates automatically

### Programmatic Sync (via Tasks)

Background synchronization via Celery tasks (`backend/incidents/tasks.py`):

```python
@shared_task
def sync_splunk_incidents_task():
    """Periodic background sync (runs every N minutes)"""
    from .siem_connectors import sync_incidents_from_splunk
    splunk_config = IntegrationConfig.get_splunk_config()
    
    if splunk_config.get('enabled'):
        created = sync_incidents_from_splunk(splunk_config)
        logger.info(f"Splunk sync created {created} incidents")
```

Scheduled via Celery Beat configuration.

### Webhook Integration

For systems that can't query SIEM platforms directly, use webhook endpoint:

```
POST /api/v1/webhooks/incident/
Content-Type: application/json

{
  "title": "Unauthorized SSH Access",
  "description": "Multiple failed SSH logins detected",
  "severity": "high",
  "category": "brute-force",
  "source_ip": "192.168.1.100",
  "target_ip": "10.0.0.5",
  "affected_assets": ["server-prod-01"],
  "source": "custom-siem",
  "external_id": "webhook-evt-12345"
}
```

## Configuration

### Environment Setup

Set SIEM configuration in `.env` or through `IntegrationConfig.set_config()`:

```bash
# Backend SIEM Configuration
SPLUNK_URL=https://splunk.example.com:8089
SPLUNK_USERNAME=admin
SPLUNK_PASSWORD=secret
SPLUNK_ENABLED=true
SPLUNK_SSL_VERIFY=false

ELASTICSEARCH_URL=https://elasticsearch.example.com:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=secret
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_SSL_VERIFY=false
```

### Programmatic Configuration

```python
from incidents.integration_config import IntegrationConfig

# Set Splunk config
IntegrationConfig.set_splunk_config({
    'enabled': True,
    'url': 'https://splunk.company.com:8089',
    'auth': {
        'username': 'incident_sync_user',
        'password': 'api_token_here'
    },
    'ssl_verify': False
})

# Set Elasticsearch config
IntegrationConfig.set_elasticsearch_config({
    'enabled': True,
    'url': 'https://elasticsearch.company.com:9200',
    'auth': {
        'username': 'elastic',
        'password': 'api_key_here'
    },
    'ssl_verify': False
})
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|-----------|
| `Connection refused` | SIEM endpoint unreachable | Check URL, firewall, network connectivity |
| `Authentication failed` | Invalid credentials | Verify username/password in config |
| `SSL certificate verify failed` | Self-signed SIEM certs | Set `ssl_verify: false` in config |
| `Organization not found` | Invalid org_id/slug | Verify organization exists in database |
| `Rate limit exceeded` | Too many requests to SIEM | Increase sync interval, add backoff logic |

### Error Response Example

```json
{
  "success": false,
  "error": "HTTPError: 401 Client Error: Unauthorized for url: https://splunk.example.com:8089/services/search/jobs"
}
```

Frontend catches these and displays toast:
```typescript
catch (error) {
  toast.error(error instanceof Error ? error.message : 'Sync failed');
}
```

## Performance Considerations

### Batch Processing
- Elasticsearch syncs handle 100+ incidents efficiently
- `get_or_create()` with `external_id` enables safe retries

### Cache Invalidation Strategy
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['incidents'] });
  queryClient.invalidateQueries({ queryKey: ['recent-incidents'] });
  queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
}
```
This ensures:
- Incident list refreshes immediately
- Dashboard stats update
- Recent incidents tab shows new entries

### Scheduled Syncs
Use Celery Beat for periodic background syncing:
```python
# celery.py
app.conf.beat_schedule = {
    'sync-splunk-every-15-minutes': {
        'task': 'incidents.tasks.sync_splunk_incidents_task',
        'schedule': crontab(minute='*/15'),
    },
    'sync-elasticsearch-every-15-minutes': {
        'task': 'incidents.tasks.sync_elasticsearch_incidents_task',
        'schedule': crontab(minute='*/15'),
    },
}
```

## Future Enhancements

### Planned SIEM Platforms
- **Microsoft Sentinel** - Planned connector for Azure cloud security
- **CrowdStrike** - Cloud-native threat detection and response
- **Palo Alto Networks** - Enterprise firewall and XDR platform

### Planned Features
- **Sync scheduling UI** - Configure automatic sync intervals per SIEM
- **Advanced filtering** - Filter incidents by severity, time range, pattern
- **Credential management** - Secure credential storage with encryption
- **Sync history** - Audit trail of sync operations and created incidents
- **Custom field mapping** - Map SIEM custom fields to incident properties

## Testing Guide

### Running Frontend Tests
```bash
npm run test -- src/components/settings/SIEMIntegrationSettings.test.tsx
```

### Running Backend Tests
```bash
# All SIEM tests
pytest backend/incidents/tests.py::TestSyncSplunkIntegration -v
pytest backend/incidents/tests.py::TestSyncElasticsearchIntegration -v

# Permission tests
pytest backend/incidents/tests.py::TestSyncEndpointsPermissions -v

# Full backend test suite
pytest backend/incidents/tests.py -v
```

### Manual Testing Checklist

- [ ] Manual sync from Settings panel creates incidents
- [ ] Toast notification shows success/error
- [ ] Incident list refreshes after sync
- [ ] Organization scoping works (incidents go to correct org)
- [ ] Duplicate sync doesn't create duplicate incidents
- [ ] Error handling shows message when SIEM unavailable
- [ ] Loading spinner shows during sync
- [ ] Dashboard stats update after sync

## Troubleshooting

### Sync button disabled but not loading
- **Cause**: `isPending` state not updating from mutation hook
- **Fix**: Verify hook dependency array in `useIncidents.ts`

### Organization incidents appearing in wrong org
- **Cause**: organization_id/slug not passed or invalid
- **Fix**: Check SIEMIntegrationSettings component is receiving org props

### Duplicate incidents created on retry
- **Cause**: `external_id` field missing from SIEM incident data
- **Fix**: Verify connector populates `external_id` from source event

### Timeout when syncing many incidents
- **Cause**: Elasticsearch timeout for large result sets
- **Fix**: Add pagination to connector, increase task timeout

## Related Files

- **Frontend**: [src/hooks/useIncidents.ts](src/hooks/useIncidents.ts)
- **Component**: [src/components/settings/SIEMIntegrationSettings.tsx](src/components/settings/SIEMIntegrationSettings.tsx)
- **Frontend Tests**: [src/components/settings/SIEMIntegrationSettings.test.tsx](src/components/settings/SIEMIntegrationSettings.test.tsx)
- **Backend Endpoints**: [backend/incidents/webhooks.py](backend/incidents/webhooks.py)
- **Connectors**: [backend/incidents/siem_connectors.py](backend/incidents/siem_connectors.py)
- **Backend Tests**: [backend/incidents/tests.py](backend/incidents/tests.py) - Classes: `TestSyncSplunkIntegration`, `TestSyncElasticsearchIntegration`, `TestSyncEndpointsPermissions`
- **Configuration**: [backend/incidents/integration_config.py](backend/incidents/integration_config.py)
- **Background Tasks**: [backend/incidents/tasks.py](backend/incidents/tasks.py)
