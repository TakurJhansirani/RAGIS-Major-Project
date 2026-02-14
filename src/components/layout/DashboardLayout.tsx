import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export const DashboardLayout = ({ children, activeView, onViewChange }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleViewChange = (view: string) => {
    onViewChange(view);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown as overlay when open */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          collapsed={sidebarCollapsed}
          activeView={activeView}
          onViewChange={handleViewChange}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onNavigate={handleViewChange}
        />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
