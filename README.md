# RAGIS

RAGIS is an AI-assisted security operations platform for incident triage, investigation, reporting, and knowledge-driven analysis.

It combines a React frontend for SOC workflows with a Django REST backend for incident ingestion, SIEM sync, threat intelligence, SOAR operations, and analytics.

## Highlights

- Incident dashboard with live metrics, trend charts, and detailed incident views
- Incident management with filtering, search, status updates, and false-positive marking
- AI query interface for natural-language investigation workflows
- Timeline and root-cause analysis with attack-chain reconstruction and MITRE mapping
- Knowledge base with resolved incidents, analyst notes, and AI learning history
- Automated report generation with export support
- Notification center with per-category filters and bulk actions
- SIEM integrations for Splunk, Elasticsearch, and generic webhooks
- Threat intel sync and SOAR playbook execution tracking
- Multi-organization support and settings management

## Tech Stack

### Frontend

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- TanStack Query
- Supabase authentication

### Backend

- Django + Django REST Framework
- Celery + Redis
- SQLite (local) or PostgreSQL (configurable)
- SIEM and webhook integration modules
- Optional ML components (Transformers, Sentence-Transformers, FAISS)

## Repository Structure

```text
RAGIS/
	src/                    # Frontend application
	backend/                # Django backend
		incidents/            # Incident domain, APIs, integrations
		ragis/                # Django settings and URL config
	supabase/               # Supabase edge functions and config
	database/               # SQL schema assets
```

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- pip

Optional for async workers/integration scale:

- Redis
- PostgreSQL

## Quick Start

### 1. Clone and install frontend dependencies

```bash
git clone https://github.com/TakurJhansirani/RAGIS-Major-Project.git
cd RAGIS-Major-Project
npm install
```

### 2. Configure frontend environment

Create .env.local in the project root:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 3. Setup backend

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver
```

Backend runs at:

- http://localhost:8000
- API base: http://localhost:8000/api/v1

### 4. Start frontend

In a second terminal at repository root:

```bash
npm run dev
```

Frontend runs at:

- http://localhost:8080

## API Overview

Main routes are exposed under /api/v1/.

### Core resources

- /incidents/
- /alerts/
- /entities/
- /knowledge-base/
- /organizations/
- /threat-intel/
- /soar-executions/
- /notifications/
- /analyst-notes/
- /ai-learning-history/

### Utility and integration endpoints

- /settings/ai-models/
- /settings/siem/
- /settings/siem/restore/
- /webhooks/incident/
- /sync/splunk/
- /sync/elasticsearch/

## Testing

### Frontend

```bash
npm test
```

### Backend

```bash
cd backend
pytest
```

## Security and GitHub Push Checklist

Before pushing, ensure sensitive files are not committed:

- .env
- backend/.env
- any credentials, API keys, or private tokens
- local database artifacts if not intended for source control

Recommended: keep and share only template files such as backend/.env.example.

## Additional Documentation

- REAL_INCIDENT_INTEGRATION.md
- INCIDENT_INTEGRATION_QUICKSTART.md
- INTEGRATION_SUMMARY.md
- SIEM_SYNC_GUIDE.md
- REACT_COMPONENT_EXAMPLES.md

## License

Add your preferred license (MIT, Apache-2.0, etc.) before public release.
