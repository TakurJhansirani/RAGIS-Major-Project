import { QueryInterface } from '@/components/dashboard/QueryInterface';

export const QueryView = () => {
  return (
    <div className="h-full animate-fade-in">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">AI Query Interface</h1>
        <p className="text-sm text-muted-foreground">Ask RAGIS about incidents, threats, and security posture using natural language.</p>
      </div>
      <div className="h-[calc(100vh-200px)]">
        <QueryInterface />
      </div>
    </div>
  );
};
