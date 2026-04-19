import { useEffect, useState, useMemo } from 'react';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
import { Shield, Globe, Server, Clock, Search, Brain, FileText, LayoutDashboard, GitBranch, Settings, Database } from 'lucide-react';
import { SeverityBadge } from '@/components/dashboard/SeverityBadge';
import { useIncidents } from '@/hooks/useIncidents';

interface GlobalSearchProps {
  onNavigate: (view: string) => void;
}

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'incidents', label: 'Incidents', icon: Shield },
  { id: 'query', label: 'AI Query', icon: Brain },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'analysis', label: 'Root Cause', icon: GitBranch },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const GlobalSearch = ({ onNavigate }: GlobalSearchProps) => {
  const [open, setOpen] = useState(false);
  const { data: incidents = [] } = useIncidents();

  const allIPs = useMemo(() => Array.from(
    new Set(
      incidents.flatMap((i: any) => [i.source_ip ?? i.sourceIP, i.target_ip ?? i.targetIP].filter(Boolean))
    )
  ), [incidents]);
  const allAssets = useMemo(() => Array.from(
    new Set(incidents.flatMap((i: any) => i.affected_assets ?? i.affectedAssets ?? []))
  ), [incidents]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const go = (view: string) => {
    onNavigate(view);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative hidden md:flex items-center gap-2 h-9 w-72 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search incidents, IPs, assets...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search incidents, IPs, assets, pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Pages">
            {pages.map((p) => {
              const Icon = p.icon;
              return (
                <CommandItem key={p.id} onSelect={() => go(p.id)} className="gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{p.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Incidents">
            {incidents.map((inc: any) => {
              const id = inc.incident_id ?? inc.id;
              const sourceIp = inc.source_ip ?? inc.sourceIP ?? '';
              const targetIp = inc.target_ip ?? inc.targetIP ?? '';
              return (
              <CommandItem key={id} value={`${id} ${inc.title} ${sourceIp} ${targetIp}`} onSelect={() => go('incidents')} className="gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground">{id}</span>
                  <span className="truncate text-sm">{inc.title}</span>
                </div>
                <SeverityBadge severity={inc.severity} />
              </CommandItem>
            );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="IP Addresses">
            {allIPs.map((ip) => (
              <CommandItem key={ip} value={ip} onSelect={() => go('incidents')} className="gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{ip}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Assets">
            {allAssets.map((asset) => (
              <CommandItem key={asset} value={asset} onSelect={() => go('incidents')} className="gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{asset}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
