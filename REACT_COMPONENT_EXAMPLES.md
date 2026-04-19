# React Component Examples - Using Real Incident Data

This guide shows how to update your React components to use real incident data from the backend API instead of mock data.

## Example 1: Update Dashboard Stats Card

### Before (Mock Data)
```tsx
// src/components/dashboard/MetricCard.tsx
import { dashboardMetrics } from '@/data/mockData';

export const StatsCards = () => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard 
        label="Total Incidents" 
        value={dashboardMetrics.totalIncidents}
        icon={AlertTriangle}
      />
      <MetricCard 
        label="Critical Alerts" 
        value={dashboardMetrics.criticalAlerts}
        icon={AlertCircle}
      />
      {/* ... more cards */}
    </div>
  );
};
```

### After (Real API Data)
```tsx
// src/components/dashboard/MetricCard.tsx
import { useIncidentStats } from '@/hooks/useIncidents';
import { Loader2 } from 'lucide-react';

export const StatsCards = () => {
  const { data: stats, isLoading } = useIncidentStats();
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-secondary rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard 
        label="Total Incidents" 
        value={stats?.total_incidents || 0}
        icon={AlertTriangle}
      />
      <MetricCard 
        label="Critical Alerts" 
        value={stats?.critical_alerts || 0}
        icon={AlertCircle}
      />
      <MetricCard 
        label="Open Incidents" 
        value={stats?.open_incidents || 0}
        icon={Clock}
      />
      <MetricCard 
        label="Resolved Today" 
        value={stats?.resolved_today || 0}
        icon={CheckCircle}
      />
    </div>
  );
};
```

---

## Example 2: Update Incident Feed (Live)

### Before (Mock Data)
```tsx
// src/components/dashboard/IncidentFeed.tsx
import { incidents as mockIncidents } from '@/data/mockData';

export const IncidentFeed = ({ onSelectIncident, selectedId }) => {
  return (
    <div className="space-y-2 max-h-[520px] overflow-y-auto">
      {mockIncidents.map((incident) => (
        <IncidentCard 
          key={incident.id}
          incident={incident}
          isSelected={selectedId === incident.id}
          onClick={() => onSelectIncident(incident)}
        />
      ))}
    </div>
  );
};
```

### After (Real API Data with Auto-Refresh)
```tsx
// src/components/dashboard/IncidentFeed.tsx
import { useRecentIncidents } from '@/hooks/useIncidents';
import { Loader2 } from 'lucide-react';

export const IncidentFeed = ({ onSelectIncident, selectedId }) => {
  // Auto-refetch every 15 seconds for live updates
  const { data: incidents = [], isLoading } = useRecentIncidents(50);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading incidents...</span>
      </div>
    );
  }
  
  if (!incidents || incidents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No incidents found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
      {incidents.map((incident) => (
        <IncidentCard 
          key={incident.incident_id}
          incident={incident}
          isSelected={selectedId === incident.incident_id}
          onClick={() => onSelectIncident(incident)}
        />
      ))}
    </div>
  );
};
```

---

## Example 3: Update Incident Detail Panel

### Before (Mock Data)
```tsx
// src/components/dashboard/IncidentDetail.tsx
import { incidents } from '@/data/mockData';

export const IncidentDetail = ({ incidentId, onClose }) => {
  // Static mock data - no real updates
  const incident = incidents.find(i => i.id === incidentId);
  
  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Display incident details */}
    </div>
  );
};
```

### After (Real API Data with Live Updates)
```tsx
// src/components/dashboard/IncidentDetail.tsx
import { useIncident, useUpdateIncidentStatus } from '@/hooks/useIncidents';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export const IncidentDetail = ({ incidentId, onClose }) => {
  const { data: incident, isLoading } = useIncident(incidentId);
  const updateStatus = useUpdateIncidentStatus();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  
  if (!incident) {
    return null;
  }
  
  const handleStatusChange = async (newStatus) => {
    updateStatus.mutate({
      incidentId: incidentId,
      status: newStatus
    });
  };
  
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-5">
        <h2 className="text-lg font-semibold">{incident.title}</h2>
        <p className="text-sm text-muted-foreground">{incident.description}</p>
      </div>
      
      {/* Content */}
      <div className="p-5 space-y-5">
        {/* AI Summary */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase text-primary">
              AI Analysis ({incident.confidence_score}% confidence)
            </h3>
          </div>
          <p className="text-sm text-foreground">{incident.ai_summary}</p>
        </div>
        
        {/* Status Update Buttons */}
        <div className="flex gap-2">
          {['open', 'investigating', 'resolved', 'escalated'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={updateStatus.isPending}
              className={cn(
                'px-3 py-1 text-xs rounded-md font-medium transition',
                incident.status === status 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {updateStatus.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <span className="text-[10px] font-medium uppercase text-muted-foreground">Source IP</span>
            <p className="text-sm font-mono">{incident.source_ip}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <span className="text-[10px] font-medium uppercase text-muted-foreground">Target IP</span>
            <p className="text-sm font-mono">{incident.target_ip}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <span className="text-[10px] font-medium uppercase text-muted-foreground">Risk Score</span>
            <p className="text-sm font-mono">{incident.risk_score}/100</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <span className="text-[10px] font-medium uppercase text-muted-foreground">Category</span>
            <p className="text-sm font-mono capitalize">{incident.category}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## Example 4: Update Dashboard View with Multi-Component Integration

```tsx
// src/components/views/DashboardView.tsx
import { 
  useIncidents, 
  useRecentIncidents, 
  useIncidentStats 
} from '@/hooks/useIncidents';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useState } from 'react';

export const DashboardView = () => {
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    severity: undefined,
    status: undefined,
  });
  
  // Get statistics
  const { data: stats, isLoading: statsLoading } = useIncidentStats();
  
  // Get recent incidents for the feed
  const { data: recentIncidents = [], isLoading: incidentsLoading } = useRecentIncidents(20);
  
  // Get detailed incidents list
  const { data: allIncidents = [], isLoading: allLoading } = useIncidents(filters);
  
  // Get selected incident details
  const selectedIncidentData = recentIncidents.find(i => i.incident_id === selectedIncident);
  
  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* Stats Row */}
      <div className="col-span-12">
        <StatsCards stats={stats} isLoading={statsLoading} />
      </div>
      
      {/* Main Content */}
      <div className="col-span-8 space-y-6">
        {/* Filter Bar */}
        <div className="flex gap-3">
          <select 
            value={filters.severity || ''}
            onChange={(e) => setFilters({...filters, severity: e.target.value || undefined})}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
          
          <select 
            value={filters.status || ''}
            onChange={(e) => setFilters({...filters, status: e.target.value || undefined})}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        
        {/* Incident Feed */}
        <IncidentFeed 
          incidents={recentIncidents}
          selectedId={selectedIncident}
          onSelectIncident={(incident) => setSelectedIncident(incident.incident_id as string)}
          isLoading={incidentsLoading}
        />
      </div>
      
      {/* Detail Panel */}
      <div className="col-span-4">
        <IncidentDetail 
          incident={selectedIncidentData}
          onClose={() => setSelectedIncident(null)}
        />
      </div>
    </div>
  );
};
```

---

## Example 5: Add Filter Functionality

```tsx
// Create a reusable filter hook
// src/hooks/useIncidentFilters.ts

import { useState, useCallback } from 'react';
import { useIncidents } from './useIncidents';

export const useIncidentFilters = () => {
  const [filters, setFilters] = useState({
    severity: undefined,
    status: undefined,
    category: undefined,
    search: undefined,
  });
  
  const { data: incidents = [], isLoading, error } = useIncidents(filters);
  
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({
      severity: undefined,
      status: undefined,
      category: undefined,
      search: undefined,
    });
  }, []);
  
  return {
    incidents,
    isLoading,
    error,
    filters,
    updateFilter,
    clearFilters,
  };
};

// Usage in component:
export const FilteredIncidentList = () => {
  const { incidents, filters, updateFilter, isLoading } = useIncidentFilters();
  
  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select 
          value={filters.severity || ''}
          onChange={(e) => updateFilter('severity', e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
        </select>
        
        <input 
          type="text"
          placeholder="Search..."
          onChange={(e) => updateFilter('search', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        {incidents.map(incident => (
          <IncidentCard key={incident.incident_id} incident={incident} />
        ))}
      </div>
    </div>
  );
};
```

---

## Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Data Source** | Mock JSON files | Live API |
| **Updates** | Static | Auto-refresh every 15-30s |
| **Status Changes** | Instant (fake) | Real API update |
| **Loading State** | None | Skeleton/spinner |
| **Error Handling** | None | Error messages |
| **Real-time Sync** | Manual reload | Automatic re-fetch |
| **Scalability** | Limited to mock data | Unlimited real incidents |

## Testing in Development

1. Create test incidents:
   ```bash
   python manage.py create_test_incidents --count 50
   ```

2. Verify API endpoint:
   ```bash
   curl http://localhost:8000/api/v1/incidents/
   ```

3. Check component renders real data:
   ```bash
   npm run dev  # Open http://localhost:5173
   ```

4. Monitor network in DevTools (F12 → Network tab)
   - Should see regular requests to `/api/v1/incidents/`
   - Status codes should be 200

## Deployment Checklist

- [ ] All mock data imports removed from components
- [ ] All components use hooks from `useIncidents.ts`
- [ ] API URL configured in `.env`
- [ ] Database migrations run on backend
- [ ] Test incidents created successfully
- [ ] API endpoints responding correctly
- [ ] Frontend components showing real data
- [ ] Auto-refresh working (check Network tab)
- [ ] Status update mutations working
- [ ] Error handling implemented
