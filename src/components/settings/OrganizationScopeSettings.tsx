import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Layers3, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Organization } from '@/hooks/useIncidents';

interface OrganizationScopeSettingsProps {
  organizations: Organization[];
  selectedOrganization: string;
  onSelectOrganization: (value: string) => void;
}

export const OrganizationScopeSettings = ({
  organizations,
  selectedOrganization,
  onSelectOrganization,
}: OrganizationScopeSettingsProps) => {
  const activeOrganization = organizations.find((organization) => String(organization.org_id) === selectedOrganization);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-primary" />
          Organization Scope
        </CardTitle>
        <CardDescription>
          Choose the tenant context used by the new threat-intel and SOAR panels.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="organization-scope">Active scope</Label>
          <Select value={selectedOrganization} onValueChange={onSelectOrganization}>
            <SelectTrigger id="organization-scope">
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All organizations</SelectItem>
              {organizations.map((organization) => (
                <SelectItem key={organization.org_id} value={String(organization.org_id)}>
                  {organization.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Layers3 className="h-3 w-3" />
            {organizations.length} organizations
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Shield className="h-3 w-3" />
            {selectedOrganization === 'all' ? 'Shared scope' : activeOrganization?.name || 'Scoped'}
          </Badge>
        </div>

        {organizations.length > 0 ? (
          <div className="space-y-2">
            {organizations.map((organization) => {
              const isActive = String(organization.org_id) === selectedOrganization;

              return (
                <div
                  key={organization.org_id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                    isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-secondary/20'
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{organization.name}</p>
                    <p className="text-xs text-muted-foreground">{organization.slug}</p>
                  </div>
                  <Badge variant={organization.is_active ? 'secondary' : 'outline'}>
                    {organization.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-5 text-sm text-muted-foreground">
            No organizations found yet. The backend will create a default tenant on demand.
          </div>
        )}
      </CardContent>
    </Card>
  );
};