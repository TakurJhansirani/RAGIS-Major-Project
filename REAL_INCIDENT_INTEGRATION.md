# Real Incident Integration Guide

This guide explains how to integrate real incidents from security systems into Cogent-Threat.

## Quick Start - 3 Integration Methods

### Method 1: Direct API (Recommended for Testing)

**Webhook POST to create incident manually:**

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/incident/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Suspicious login detected",
    "description": "Multiple failed SSH login attempts from external IP",
    "severity": "high",
    "category": "brute-force",
    "status": "open",
    "source_ip": "192.168.1.100",
    "target_ip": "10.0.0.5",
    "affected_assets": ["server-01", "server-02"],
    "source": "api",
    "external_id": "ext-12345"
  }'
```

### Method 2: Splunk Integration

**Setup Splunk REST API credentials:**

```python
# backend/settings.py (or environment variables)
SPLUNK_CONFIG = {
    'url': 'https://splunk.example.com:8089',
    'auth': {
        'username': 'admin',
        'password': 'your_password'
    }
}
```

**Trigger sync:**

```bash
curl -X POST http://localhost:8000/api/v1/sync/splunk/ \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://splunk.example.com:8089",
    "username": "admin",
    "password": "your_password"
  }'
```

### Method 3: Elasticsearch Integration

**Setup Elasticsearch credentials:**

```bash
curl -X POST http://localhost:8000/api/v1/sync/elasticsearch/ \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://elasticsearch.example.com:9200",
    "username": "elastic",
    "password": "your_password"
  }'
```

---

## Backend Configuration

### 1. Update Django Settings

Edit `backend/ragis/settings.py`:

```python
# SIEM Integration Configuration
SPLUNK_CONFIG = {
    'url': os.getenv('SPLUNK_URL', 'https://splunk.local:8089'),
    'auth': {
        'username': os.getenv('SPLUNK_USERNAME', 'admin'),
        'password': os.getenv('SPLUNK_PASSWORD', ''),
    }
}

ELASTICSEARCH_CONFIG = {
    'url': os.getenv('ELASTICSEARCH_URL', 'https://elasticsearch.local:9200'),
    'auth': {
        'username': os.getenv('ELASTICSEARCH_USERNAME', 'elastic'),
        'password': os.getenv('ELASTICSEARCH_PASSWORD', ''),
    }
}

# Webhook secret for validation
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', 'your-secret-key')

# Enable incident auto-sync (scheduled task)
CELERY_BEAT_SCHEDULE = {
    'sync-splunk-incidents': {
        'task': 'incidents.tasks.sync_incidents_from_splunk',
        'schedule': crontab(minute=0),  # Every hour
    },
    'sync-elasticsearch-incidents': {
        'task': 'incidents.tasks.sync_incidents_from_elasticsearch',
        'schedule': crontab(minute=*/15),  # Every 15 minutes
    },
}
```

### 2. Add Celery Tasks

Create `backend/incidents/tasks.py`:

```python
from celery import shared_task
from django.conf import settings
from .siem_connectors import sync_incidents_from_splunk, sync_incidents_from_elasticsearch

@shared_task
def sync_incidents_from_splunk():
    """Scheduled task to sync incidents from Splunk"""
    created = sync_incidents_from_splunk(settings.SPLUNK_CONFIG)
    return f"Created {created} incidents from Splunk"

@shared_task
def sync_incidents_from_elasticsearch():
    """Scheduled task to sync incidents from Elasticsearch"""
    created = sync_incidents_from_elasticsearch(settings.ELASTICSEARCH_CONFIG)
    return f"Created {created} incidents from Elasticsearch"
```

### 3. Run Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

---

## Frontend Configuration

### 1. Set API URL

Create `.env.local`:

```
VITE_API_URL=http://localhost:8000/api/v1
```

### 2. Replace Mock Data in Components

**Before (using mock data):**
```tsx
import { incidents } from '@/data/mockData';

export const IncidentFeed = () => {
  return (
    <div>
      {incidents.map(incident => (
        // ...
      ))}
    </div>
  );
};
```

**After (using real API):**
```tsx
import { useIncidents } from '@/hooks/useIncidents';

export const IncidentFeed = () => {
  const { data: incidents, isLoading } = useIncidents();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {incidents?.map(incident => (
        // ...
      ))}
    </div>
  );
};
```

### 3. Update Dashboard Component

Example: Update [src/components/dashboard/IncidentFeed.tsx](src/components/dashboard/IncidentFeed.tsx)

```tsx
import { useRecentIncidents, useIncidentStats } from '@/hooks/useIncidents';

export const IncidentFeed = () => {
  const { data: incidents = [], isLoading } = useRecentIncidents(20);
  const { data: stats } = useIncidentStats();
  
  return (
    <div className="space-y-4">
      <h2>Live Incident Feed</h2>
      <p className="text-sm text-muted-foreground">
        Total: {stats?.total_incidents} | Critical: {stats?.critical_alerts}
      </p>
      
      {isLoading ? (
        <div>Loading incidents...</div>
      ) : (
        <div className="space-y-2">
          {incidents.map(incident => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## API Endpoints

### List Incidents
```
GET /api/v1/incidents/?severity=high&status=open
GET /api/v1/incidents/recent/?limit=20
GET /api/v1/incidents/statistics/
```

### Incident Details
```
GET /api/v1/incidents/{id}/
PATCH /api/v1/incidents/{id}/update_status/ → {"status": "resolved"}
PATCH /api/v1/incidents/{id}/mark_false_positive/
```

### Alerts
```
GET /api/v1/alerts/?incident_id=123
```

### Knowledge Base
```
GET /api/v1/knowledge-base/
POST /api/v1/knowledge-base/bulk_create/
```

### Webhooks
```
POST /api/v1/webhooks/incident/
POST /api/v1/sync/splunk/
POST /api/v1/sync/elasticsearch/
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     COGENT-THREAT                       │
├─────────────────────────────────────────────────────────┤
│ FRONTEND (React/TypeScript)                             │
│ ├── useIncidents() hook                                 │
│ ├── useRecentIncidents() hook                           │
│ ├── useIncidentStats() hook                             │
│ └── Real-time incident feed                            │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/REST API
                   ▼
┌─────────────────────────────────────────────────────────┐
│ BACKEND (Django REST Framework)                         │
│ ├── /api/v1/incidents/ (CRUD)                          │
│ ├── /api/v1/webhooks/incident/ (POST)                  │
│ ├── /api/v1/sync/splunk/ (POST)                        │
│ ├── /api/v1/sync/elasticsearch/ (POST)                 │
│ └── IncidentViewSet, AlertViewSet, EntityViewSet       │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │Splunk │ │ES/Kibana│ │Custom  │
    │REST   │ │REST API │ │Systems │
    │API    │ │         │ │(Webhook)
    └────────┘ └────────┘ └────────┘
```

---

## Testing

### Test with CURL

1. **Create incident via webhook:**
```bash
curl -X POST http://localhost:8000/api/v1/webhooks/incident/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Incident",
    "description": "This is a test",
    "severity": "medium",
    "category": "test",
    "source": "test"
  }'
```

2. **Get all incidents:**
```bash
curl http://localhost:8000/api/v1/incidents/
```

3. **Get statistics:**
```bash
curl http://localhost:8000/api/v1/incidents/statistics/
```

### Test with Python

```python
import requests
from backend.incidents.siem_connectors import SplunkConnector

# Test Splunk connection
config = {
    'url': 'https://splunk.local:8089',
    'auth': {'username': 'admin', 'password': 'pass'}
}

connector = SplunkConnector(config)
incidents = connector.fetch_incidents(time_range='-1h@h')
print(f"Found {len(incidents)} incidents")
```

---

## Troubleshooting

### Issues Fetching from Splunk
- Verify credentials and URL are correct
- Check SSL certificates (disable verify in dev: `verify=False`)
- Ensure Splunk REST API is enabled
- Check Splunk event logs for API errors

### Issues Fetching from Elasticsearch
- Verify cluster is healthy: `GET https://elasticsearch:9200/_health`
- Check authentication (API keys vs basic auth)
- Verify detection index exists: `GET https://elasticsearch:9200/.detections-default`

### Frontend Not Showing Real Data
- Check browser DevTools Network tab for API calls
- Verify `VITE_API_URL` environment variable is set
- Check backend is running: `http://localhost:8000/api/v1/incidents/`
- Verify authentication token is being sent

---

## Next Steps

1. **Enable real-time updates:** Set up WebSocket for live incident streaming
2. **Add RAG processing:** Integrate LLM summarization for incidents
3. **Custom parsers:** Create connectors for your specific security tools
4. **Data retention:** Implement incident archival policies
5. **Alerting:** Set up automated escalation rules
