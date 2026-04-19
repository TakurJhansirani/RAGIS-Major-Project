import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useSoarExecutions, useTriggerSoarPlaybook } from '@/hooks/useIncidents';
import { Workflow, Send, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SoarOperationsSettingsProps {
  organization: string;
  organizationLabel: string;
}

const statusStyles: Record<string, string> = {
  requested: 'border-border bg-secondary/30 text-muted-foreground',
  success: 'border-success/30 bg-success/10 text-success',
  failed: 'border-destructive/30 bg-destructive/10 text-destructive',
};

export const SoarOperationsSettings = ({ organization, organizationLabel }: SoarOperationsSettingsProps) => {
  const scope = organization === 'all' ? undefined : organization;
  const { data: executions = [], isLoading, isError, refetch } = useSoarExecutions(scope);
  const triggerPlaybook = useTriggerSoarPlaybook();
  const [incidentId, setIncidentId] = useState('');
  const [playbook, setPlaybook] = useState('isolate-and-contain');
  const [payloadText, setPayloadText] = useState('{\n  "source": "settings-console"\n}');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Execution history refreshed');
    } catch (error) {
      toast.error('Failed to refresh execution history');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTrigger = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!incidentId.trim()) {
      toast.error('Enter an incident ID before triggering a playbook');
      return;
    }

    let payload: Record<string, unknown> = {};
    if (payloadText.trim()) {
      try {
        payload = JSON.parse(payloadText);
      } catch {
        toast.error('Payload must be valid JSON');
        return;
      }
    }

    try {
      await triggerPlaybook.mutateAsync({ incidentId: incidentId.trim(), playbook: playbook.trim(), payload });
      toast.success(`Triggered ${playbook} for incident ${incidentId}`);
      setPayloadText('{\n  "source": "settings-console"\n}');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to trigger SOAR playbook');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Workflow className="h-4 w-4 text-primary" />
            SOAR Operations
          </CardTitle>
          <CardDescription>
            Trigger playbooks and review execution history for {organizationLabel}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleTrigger}>
            <div className="space-y-2">
              <Label htmlFor="incident-id">Incident ID</Label>
              <Input
                id="incident-id"
                value={incidentId}
                onChange={(event) => setIncidentId(event.target.value)}
                placeholder="INC-1001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playbook">Playbook</Label>
              <Input
                id="playbook"
                value={playbook}
                onChange={(event) => setPlaybook(event.target.value)}
                placeholder="isolate-and-contain"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="payload">Payload JSON</Label>
              <Textarea
                id="payload"
                value={payloadText}
                onChange={(event) => setPayloadText(event.target.value)}
                className="min-h-[120px] font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2 lg:col-span-2">
              <Button type="submit" disabled={triggerPlaybook.isPending}>
                <Send className={triggerPlaybook.isPending ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
                Trigger Playbook
              </Button>
              <Badge variant="outline" className="gap-1.5">
                <ShieldCheck className="h-3 w-3" />
                Recent executions refresh automatically
              </Badge>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Execution History</CardTitle>
              <CardDescription>Latest SOAR activity for the selected organization.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              SOAR execution history could not be loaded.
            </div>
          ) : executions.length === 0 && !isLoading ? (
            <div className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-6 text-sm text-muted-foreground">
              No playbook executions have been recorded for this scope.
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident</TableHead>
                    <TableHead>Playbook</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triggered</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution) => (
                    <TableRow key={execution.execution_id}>
                      <TableCell className="font-mono text-xs">{execution.incident}</TableCell>
                      <TableCell>{execution.playbook}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[execution.status] || statusStyles.requested}>
                          {execution.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(execution.triggered_at).toLocaleString()}</TableCell>
                      <TableCell>{execution.completed_at ? new Date(execution.completed_at).toLocaleString() : 'Pending'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};