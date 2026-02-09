import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardView } from '@/components/views/DashboardView';
import { IncidentsView } from '@/components/views/IncidentsView';
import { QueryView } from '@/components/views/QueryView';
import { TimelineView } from '@/components/views/TimelineView';
import { PlaceholderView } from '@/components/views/PlaceholderView';

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'incidents':
        return <IncidentsView />;
      case 'query':
        return <QueryView />;
      case 'timeline':
        return <TimelineView />;
      case 'knowledge':
        return <PlaceholderView title="Knowledge Base" description="Self-learning incident knowledge base with resolved incidents, analyst feedback, and AI corrections." />;
      case 'reports':
        return <PlaceholderView title="Automated Reports" description="Generate daily, weekly, and monthly SOC reports with trends, KPIs, and actionable insights." />;
      case 'settings':
        return <PlaceholderView title="Settings" description="Configure SIEM integrations, AI models, escalation rules, and user roles." />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <DashboardLayout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </DashboardLayout>
  );
};

export default Index;
