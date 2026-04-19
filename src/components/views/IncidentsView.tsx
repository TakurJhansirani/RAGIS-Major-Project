import { useMemo, useState } from 'react';
import { Filter, Search, WifiOff, Loader2 } from 'lucide-react';
import { IncidentFeed } from '@/components/dashboard/IncidentFeed';
import { IncidentDetail } from '@/components/dashboard/IncidentDetail';
import { cn } from '@/lib/utils';
import { useIncidents } from '@/hooks/useIncidents';

const severityFilters = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
  { label: 'Info', value: 'info' },
];

const getIncidentId = (inc: any) => inc.incident_id ?? inc.id ?? '';

export const IncidentsView = () => {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const severityFilter = filter === 'all' ? undefined : filter;
  const { data: incidents = [], isError, isLoading } = useIncidents({
    severity: severityFilter,
    search: search || undefined,
  });

  // FILTER LOGIC
  const filtered = useMemo(() => incidents.filter((inc: any) => {
    const id = String(getIncidentId(inc));
    if (
      search &&
      !inc.title?.toLowerCase().includes(search.toLowerCase()) &&
      !id.toLowerCase().includes(search.toLowerCase())
    ) return false;
    return true;
  }), [incidents, search]);

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-foreground">
          Incident Management
        </h1>
        <span className="text-xs font-mono text-muted-foreground">
          {filtered.length} incidents
        </span>
      </div>

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          Backend unreachable - incident feed is temporarily unavailable.
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          Loading live incidents...
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or ID..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {severityFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-md px-3 py-2 sm:py-1.5 text-xs font-medium',
                filter === f.value
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <IncidentFeed
          incidents={filtered}
          onSelectIncident={setSelectedIncident}
          selectedId={selectedIncident ? getIncidentId(selectedIncident) : undefined}
        />

        {selectedIncident && (
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSelectedIncident(null)}
          />
        )}

        <div className={cn(
          'lg:block',
          selectedIncident
            ? 'fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto bg-background p-3 lg:relative lg:inset-auto lg:z-auto lg:p-0'
            : 'hidden lg:block'
        )}>
          <IncidentDetail
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
          />
        </div>
      </div>
    </div>
  );
};