import { useEffect, useState } from 'react';
import { Settings, Plug, Brain, Bell, Users, Globe, Shield, Workflow } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SIEMIntegrationSettings } from '@/components/settings/SIEMIntegrationSettings';
import { AIModelSettings } from '@/components/settings/AIModelSettings';
import { EscalationRulesSettings } from '@/components/settings/EscalationRulesSettings';
import { UserRoleSettings } from '@/components/settings/UserRoleSettings';
import { OrganizationScopeSettings } from '@/components/settings/OrganizationScopeSettings';
import { ThreatIntelSettings } from '@/components/settings/ThreatIntelSettings';
import { SoarOperationsSettings } from '@/components/settings/SoarOperationsSettings';
import { useOrganizations } from '@/hooks/useIncidents';

export const SettingsView = () => {
  const { data: organizations = [] } = useOrganizations();
  const [selectedOrganization, setSelectedOrganization] = useState('all');

  useEffect(() => {
    if (!organizations.length) {
      return;
    }

    setSelectedOrganization((currentOrganization) => {
      if (currentOrganization === 'all') {
        return currentOrganization;
      }

      const matchesCurrent = organizations.some(
        (organization) => String(organization.org_id) === currentOrganization
      );

      return matchesCurrent ? currentOrganization : 'all';
    });
  }, [organizations]);

  const selectedOrganizationLabel =
    selectedOrganization === 'all'
      ? 'All organizations'
      : organizations.find((organization) => String(organization.org_id) === selectedOrganization)?.name || 'Selected organization';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure integrations, AI models, escalation policies, user access, organizations, threat intel, and SOAR
        </p>
      </div>

      <Tabs defaultValue="siem" className="space-y-4">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="bg-secondary/50 border border-border w-max sm:w-auto">
            <TabsTrigger value="siem" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Plug className="h-3.5 w-3.5" /> <span className="hidden sm:inline">SIEM</span> <span className="sm:hidden">SIEM</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Brain className="h-3.5 w-3.5" /> <span className="hidden sm:inline">AI Models</span> <span className="sm:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger value="escalation" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Bell className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Escalation Rules</span> <span className="sm:hidden">Rules</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Users className="h-3.5 w-3.5" /> <span className="hidden sm:inline">User Roles</span> <span className="sm:hidden">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Globe className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Organizations</span> <span className="sm:hidden">Orgs</span>
            </TabsTrigger>
            <TabsTrigger value="threat-intel" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Shield className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Threat Intel</span> <span className="sm:hidden">Intel</span>
            </TabsTrigger>
            <TabsTrigger value="soar" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Workflow className="h-3.5 w-3.5" /> <span className="hidden sm:inline">SOAR</span> <span className="sm:hidden">SOAR</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="siem">
          <SIEMIntegrationSettings organization={selectedOrganization} organizationLabel={selectedOrganizationLabel} />
        </TabsContent>
        <TabsContent value="ai"><AIModelSettings /></TabsContent>
        <TabsContent value="escalation"><EscalationRulesSettings /></TabsContent>
        <TabsContent value="roles"><UserRoleSettings /></TabsContent>
        <TabsContent value="organizations">
          <OrganizationScopeSettings
            organizations={organizations}
            selectedOrganization={selectedOrganization}
            onSelectOrganization={setSelectedOrganization}
          />
        </TabsContent>
        <TabsContent value="threat-intel">
          <ThreatIntelSettings
            organization={selectedOrganization}
            organizationLabel={selectedOrganizationLabel}
          />
        </TabsContent>
        <TabsContent value="soar">
          <SoarOperationsSettings
            organization={selectedOrganization}
            organizationLabel={selectedOrganizationLabel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
