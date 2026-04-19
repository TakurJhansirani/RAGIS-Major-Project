# Quick Start: Real Incident Integration

Follow these steps to enable real incident integration in your Cogent-Threat deployment.

## Step 1: Backend Setup (Django)

### 1.1 Update Django Settings

Make sure your `backend/ragis/settings.py` includes:

```python
INSTALLED_APPS = [
    # ... other apps
    'rest_framework',
    'incidents',
]

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}
```

### 1.2 Configure Environment Variables

Copy the example:
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your SIEM credentials:
```
SPLUNK_ENABLED=true
SPLUNK_URL=https://your-splunk.com:8089
SPLUNK_USERNAME=admin
SPLUNK_PASSWORD=your_password

ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_URL=https://your-elasticsearch.com:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password
```

### 1.3 Run Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 1.4 Create Test Incidents (Optional)

```bash
python manage.py create_test_incidents --count 20
```

## Step 2: Frontend Setup (React)

### 2.1 Configure API URL

Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8000/api/v1
```

### 2.2 Update Components to Use Real Data

Replace references to mock data with real API hooks:

**Example: Update IncidentFeed component**

Old code using mock data:
```tsx
import { incidents } from '@/data/mockData';

export const IncidentFeed = () => {
  return (
    <div className="space-y-2">
      {incidents.map(incident => (
        <IncidentCard key={incident.id} incident={incident} />
      ))}
    </div>
  );
};
```

New code using real API:
```tsx
import { useRecentIncidents } from '@/hooks/useIncidents';

export const IncidentFeed = () => {
  const { data: incidents = [], isLoading } = useRecentIncidents(20);
  
  if (isLoading) return <div className="p-4">Loading...</div>;
  
  return (
    <div className="space-y-2">
      {incidents?.map(incident => (
        <IncidentCard key={incident.incident_id} incident={incident} />
      ))}
    </div>
  );
};
```

## Step 3: Run Everything

### 3.1 Start Backend

```bash
cd backend
python manage.py runserver
```

Backend will be available at: `http://localhost:8000/api/v1/incidents/`

### 3.2 Start Frontend

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## Step 4: Test Integration

### Test 1: Create Incident via Webhook

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/incident/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Incident",
    "description": "This is a test incident",
    "severity": "high",
    "category": "malware",
    "status": "open",
    "source_ip": "192.168.1.1",
    "target_ip": "10.0.0.1",
    "affected_assets": ["server-01"],
    "source": "manual"
  }'
```

### Test 2: View Incidents in API

```bash
curl http://localhost:8000/api/v1/incidents/
```

Expected response:
```json
{
  "count": 1,
  "results": [
    {
      "incident_id": 1,
      "title": "Test Incident",
      "severity": "high",
      "status": "open",
      ...
    }
  ]
}
```

### Test 3: View in UI

Open browser to `http://localhost:5173` and check the incident feed for your new incident.

## Step 5: Sync from Real SIEM Systems

### Option A: Splunk

```bash
# Manually trigger sync
curl -X POST http://localhost:8000/api/v1/sync/splunk/ \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://splunk.company.com:8089",
    "username": "admin",
    "password": "password"
  }'
```

### Option B: Elasticsearch

```bash
# Manually trigger sync
curl -X POST http://localhost:8000/api/v1/sync/elasticsearch/ \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://elasticsearch.company.com:9200",
    "username": "elastic",
    "password": "password"
  }'
```

## Troubleshooting

### Issue: API returns 401 Unauthorized

**Solution:** Make sure you have authentication set up:
1. Create a user: `python manage.py createsuperuser`
2. Get token or use session authentication
3. Pass auth header in requests

### Issue: Frontend can't connect to backend

**Solution:** Check CORS settings in Django:
```python
# backend/ragis/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]
```

Install django-cors-headers:
```bash
pip install django-cors-headers
```

### Issue: Webhook incidents not appearing

**Solution:** Check:
1. API is running: `curl http://localhost:8000/api/v1/incidents/`
2. Database migrations ran: `python manage.py migrate`
3. Check logs for errors: `python manage.py runserver`

## Next Steps

1. **Configure scheduled syncs:** Set up Celery to automatically sync from Splunk/Elasticsearch
2. **Add more SIEM systems:** Create connectors for QRadar, ArcSight, etc.
3. **Enable WebSockets:** For real-time incident streaming
4. **Add authentication:** Integrate with your identity provider
5. **Deploy:** Create Docker containers and deploy with docker-compose

## File Structure Summary

```
cogent-threat/
├── backend/
│   ├── incidents/
│   │   ├── views.py              # REST API endpoints ✓
│   │   ├── models.py             # Enhanced models ✓
│   │   ├── urls.py               # API routes ✓
│   │   ├── webhooks.py           # Webhook handlers ✓
│   │   ├── siem_connectors.py    # SIEM integrations ✓
│   │   ├── integration_config.py # Configuration ✓
│   │   └── management/commands/
│   │       └── create_test_incidents.py ✓
│   ├── ragis/
│   │   └── urls.py               # Main URL config ✓
│   └── .env.example              # Environment template ✓
├── src/
│   └── hooks/
│       └── useIncidents.ts        # React hooks ✓
└── REAL_INCIDENT_INTEGRATION.md   # Full guide ✓
```

## Success Indicators

✓ Django API endpoints working (GET /api/v1/incidents/)  
✓ Database migrations completed  
✓ Test incidents created  
✓ Frontend components updated to use hooks  
✓ API URL configured in frontend  
✓ Real incidents visible in UI  
✓ Can update incident status  

You're now ready to integrate with real SIEM systems!
