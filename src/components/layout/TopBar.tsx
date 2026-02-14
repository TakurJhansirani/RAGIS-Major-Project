import { Menu, Shield, Activity } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationPanel } from '@/components/NotificationPanel';
import { GlobalSearch } from '@/components/GlobalSearch';

interface TopBarProps {
  onToggleSidebar: () => void;
  onNavigate: (view: string) => void;
}

export const TopBar = ({ onToggleSidebar, onNavigate }: TopBarProps) => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-muted-foreground hover:text-foreground lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-success animate-pulse-glow" />
          <span className="text-xs font-medium text-muted-foreground">SYSTEM ACTIVE</span>
          <span className="text-xs font-mono text-primary">•</span>
          <span className="text-xs font-mono text-muted-foreground">3,420 events/min</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Global Search */}
        <GlobalSearch onNavigate={onNavigate} />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationPanel />

        {/* User */}
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
            <Shield className="h-3 w-3 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-foreground">SOC Analyst</p>
            <p className="text-[10px] text-muted-foreground">Tier 2</p>
          </div>
        </div>
      </div>
    </header>
  );
};
