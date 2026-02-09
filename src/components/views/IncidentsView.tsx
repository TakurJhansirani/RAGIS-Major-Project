import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search } from 'lucide-react';
import { incidents } from '@/data/mockData';
import { IncidentFeed } from '@/components/dashboard/IncidentFeed';
import { IncidentDetail } from '@/components/dashboard/IncidentDetail';
import type { Incident, Severity } from '@/data/mockData';
import { cn } from '@/lib/utils';

const severityFilters: { label: string; value: Severity | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
  { label: 'Info', value: 'info' },
];

export const IncidentsView = () => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = incidents.filter((inc) => {
    if (filter !== 'all' && inc.severity !== filter) return false;
    if (search && !inc.title.toLowerCase().includes(search.toLowerCase()) && !inc.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Incident Management</h1>
        <span className="text-xs font-mono text-muted-foreground">{filtered.length} incidents</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or ID..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {severityFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                filter === f.value
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'
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
          selectedId={selectedIncident?.id}
        />
        <IncidentDetail
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      </div>
    </div>
  );
};
