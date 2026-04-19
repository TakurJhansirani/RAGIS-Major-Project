import { Menu, Shield, Activity, Search, WifiOff, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationPanel } from '@/components/NotificationPanel';
import { GlobalSearch } from '@/components/GlobalSearch';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useFallbackMode } from '@/hooks/useFallbackMode';

interface TopBarProps {
  onToggleSidebar: () => void;
  onNavigate: (view: string) => void;
}

export const TopBar = ({ onToggleSidebar, onNavigate }: TopBarProps) => {
  const isOffline = useOfflineStatus();
  const isFallbackMode = useFallbackMode();
  const { user, signOut } = useAuth();

  return (
    <>
      {isOffline && (
        <div className="flex items-center justify-center gap-2 bg-warning/20 border-b border-warning/30 px-3 py-1.5 text-xs font-medium text-warning">
          <WifiOff className="h-3.5 w-3.5" />
          <span>You're offline — viewing cached data</span>
        </div>
      )}
      {!isOffline && isFallbackMode && (
        <div className="flex items-center justify-center gap-2 bg-info/20 border-b border-info/30 px-3 py-1.5 text-xs font-medium text-info">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Backend unavailable — using fallback data</span>
        </div>
      )}
      <header className="flex h-14 sm:h-16 items-center justify-between border-b border-border bg-card/50 px-3 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <button onClick={onToggleSidebar} className="text-muted-foreground hover:text-foreground lg:hidden p-1.5 -ml-1.5 rounded-lg active:bg-secondary">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <Activity className="h-4 w-4 text-success animate-pulse-glow" />
          <span className="text-xs font-medium text-muted-foreground">SYSTEM ACTIVE</span>
          <span className="text-xs font-mono text-primary">•</span>
          <span className="text-xs font-mono text-muted-foreground">3,420 events/min</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Global Search */}
        <GlobalSearch onNavigate={onNavigate} />

        {/* Mobile search trigger */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            document.dispatchEvent(event);
          }}
          className="flex md:hidden items-center justify-center h-9 w-9 rounded-lg border border-border text-muted-foreground hover:text-foreground active:bg-secondary"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationPanel />

        {/* User */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
            <Shield className="h-3 w-3 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground truncate max-w-[120px]">{user?.email?.split('@')[0] ?? 'Analyst'}</p>
            <p className="text-[10px] text-muted-foreground">SOC Analyst</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      </header>
    </>
  );
};
