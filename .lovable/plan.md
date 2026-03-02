

# Connect Database and Add Authentication

This plan migrates RAGIS from hardcoded mock data to a live database with user authentication, so incidents, analyst notes, and all operational data persist across sessions and are protected behind login.

---

## Phase 1: Database Schema (Migration)

Create the following tables to store all the app's data:

**Core Tables:**
- **profiles** -- user profiles (id references auth.users, display_name, avatar_url, role_title)
- **user_roles** -- role-based access control (user_id, role enum: admin/analyst/viewer)
- **incidents** -- all incident fields from mock data (title, severity, status, category, source_ip, target_ip, ai_summary, confidence_score, risk_score, affected_assets, is_false_positive, created_by)
- **timeline_events** -- timeline entries (incident_id FK, label, severity, detail, timestamp)
- **analyst_notes** -- notes linked to incidents (incident_id, author_id FK to profiles, content, type enum, ai_relevant)
- **ai_learning_history** -- AI model updates and tunings (type, title, description, impact, related_incidents, metrics_change)
- **attack_chains** -- attack chain headers (incident_id FK, title, threat, overall_confidence, severity)
- **attack_chain_steps** -- individual steps (attack_chain_id FK, label, technique, mitre_id, confidence, severity, detail, evidence, step_order)
- **notifications** -- user notifications (user_id FK, title, message, category, read, dismissed, incident_id)
- **dashboard_metrics** -- dashboard aggregate metrics (snapshot data, created_at)
- **alert_trends** -- hourly alert trend data
- **category_distribution** -- category breakdown data

**Security:**
- RLS enabled on all tables
- `has_role()` security definer function for role checks
- Policies: authenticated users can read most data; only admins/analysts can insert/update incidents and notes; users can only manage their own notifications

**Seed data:** Insert the existing mock data so the app works immediately after migration.

---

## Phase 2: Authentication

- Create `/auth` route with login and signup forms (email + password)
- Add an `AuthProvider` context that wraps the app with `onAuthStateChange` listener
- Protect the main dashboard behind authentication -- redirect to `/auth` if not logged in
- Auto-create a profile row on signup via database trigger
- Assign default "analyst" role on signup

---

## Phase 3: Data Hooks and Integration

Replace all mock data imports with React Query hooks that fetch from the database:

- `useIncidents()` -- fetches from `incidents` table
- `useDashboardMetrics()` -- fetches from `dashboard_metrics`
- `useTimelineEvents()` -- fetches from `timeline_events`
- `useAnalystNotes(incidentId?)` -- fetches from `analyst_notes`
- `useAILearningHistory()` -- fetches from `ai_learning_history`
- `useAttackChains()` -- fetches from `attack_chains` + `attack_chain_steps`
- `useNotifications()` -- fetches for current user from `notifications`
- `useAlertTrends()` / `useCategoryDistribution()` -- chart data

Each view component (DashboardView, IncidentsView, KnowledgeBaseView, etc.) will be updated to use these hooks instead of importing from `src/data/`.

---

## Phase 4: Write Operations

Enable creating and updating data through the UI:

- **Incidents:** Status changes, marking false positives
- **Analyst Notes:** Adding new notes (linked to logged-in user)
- **Notifications:** Mark as read/dismissed

---

## Technical Details

- ~15 files modified, ~10 new files created
- Database migration: single SQL migration with all tables, RLS policies, triggers, seed data
- Auth uses standard email/password (no auto-confirm -- users verify email)
- Existing TypeScript interfaces in `src/data/` will be kept for type compatibility but data will come from database
- React Query provides caching, loading states, and error handling automatically
- The `profiles` trigger uses `auth.users.raw_user_meta_data->>'full_name'` for display name

