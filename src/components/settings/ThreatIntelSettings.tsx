import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSyncThreatIntel, useThreatIntelIndicators } from '@/hooks/useIncidents';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface ThreatIntelSettingsProps {
  organization: string;
  organizationLabel: string;
}

const severityClassName = (severity: string) => {
  if (severity === 'critical') return 'border-destructive/30 bg-destructive/10 text-destructive';
  if (severity === 'high') return 'border-warning/30 bg-warning/10 text-warning';
  if (severity === 'medium') return 'border-info/30 bg-info/10 text-info';
  return 'border-border bg-secondary/30 text-muted-foreground';
};

export const ThreatIntelSettings = ({ organization, organizationLabel }: ThreatIntelSettingsProps) => {
  const scope = organization === 'all' ? undefined : organization;
  const { data: indicators = [], isLoading, isError } = useThreatIntelIndicators(scope);
  const syncThreatIntel = useSyncThreatIntel();

  const activeCount = indicators.filter((indicator) => indicator.is_active).length;
  const uniqueSources = new Set(indicators.map((indicator) => indicator.source)).size;
  const criticalCount = indicators.filter((indicator) => ['high', 'critical'].includes(indicator.severity)).length;

  const handleSync = async () => {
    try {
      await syncThreatIntel.mutateAsync(scope);
      toast.success('Threat intelligence feed synced');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync threat intel feed');
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Threat Intelligence
          </CardTitle>
          <CardDescription>
            Live indicators for {organizationLabel}. Sync the feed when you want the latest enrichment.
          </CardDescription>
        </div>
        <Button onClick={handleSync} disabled={syncThreatIntel.isPending} size="sm" variant="outline">
          <RefreshCw className={syncThreatIntel.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Sync Feed
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active indicators</p>
            <p className="mt-1 text-xl font-bold text-foreground">{activeCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sources</p>
            <p className="mt-1 text-xl font-bold text-foreground">{uniqueSources}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">High priority</p>
            <p className="mt-1 text-xl font-bold text-foreground">{criticalCount}</p>
          </div>
        </div>

        {isError ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Threat intelligence data could not be loaded.
          </div>
        ) : indicators.length === 0 && !isLoading ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-6 text-sm text-muted-foreground">
            No indicators are available for this scope yet.
          </div>
        ) : (
          <ScrollArea className="h-[340px] rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indicators.map((indicator) => (
                  <TableRow key={indicator.indicator_id}>
                    <TableCell className="capitalize">{indicator.indicator_type.replace('_', ' ')}</TableCell>
                    <TableCell className="font-mono text-xs">{indicator.value}</TableCell>
                    <TableCell>{indicator.source}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={severityClassName(indicator.severity)}>
                        {indicator.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{indicator.confidence_score}%</TableCell>
                    <TableCell>{indicator.last_seen ? new Date(indicator.last_seen).toLocaleString() : 'Never'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};