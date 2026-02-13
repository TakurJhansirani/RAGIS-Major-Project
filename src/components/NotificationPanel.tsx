import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { X, Check, CheckCheck, AlertTriangle, ArrowUpRight, Brain, Monitor, Bell, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mockNotifications, type Notification, type NotificationCategory } from '@/data/notificationData';
import { motion, AnimatePresence } from 'framer-motion';

const categoryConfig: Record<NotificationCategory, { icon: typeof AlertTriangle; label: string; className: string }> = {
  critical: { icon: AlertTriangle, label: 'Critical', className: 'text-destructive bg-destructive/10' },
  escalation: { icon: ArrowUpRight, label: 'Escalation', className: 'text-warning bg-warning/10' },
  'ai-insight': { icon: Brain, label: 'AI Insight', className: 'text-primary bg-primary/10' },
  system: { icon: Monitor, label: 'System', className: 'text-info bg-info/10' },
};

const categories: (NotificationCategory | 'all')[] = ['all', 'critical', 'escalation', 'ai-insight', 'system'];

export const NotificationPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory | 'all'>('all');
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read && !n.dismissed).length, [notifications]);

  const filtered = useMemo(() => {
    const visible = notifications.filter(n => !n.dismissed);
    if (activeFilter === 'all') return visible;
    return visible.filter(n => n.category === activeFilter);
  }, [notifications, activeFilter]);

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, dismissed: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, dismissed: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 border-border bg-card" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3 w-3" /> Read all
            </button>
            <button
              onClick={dismissAll}
              className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1 border-b border-border px-4 py-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors',
                activeFilter === cat
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {cat === 'ai-insight' ? 'AI' : cat}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-[400px]">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-xs">No notifications</p>
              </div>
            ) : (
              filtered.map(notification => {
                const config = categoryConfig[notification.category];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 80, height: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => markRead(notification.id)}
                    className={cn(
                      'group relative flex gap-3 border-b border-border px-4 py-3 cursor-pointer transition-colors',
                      !notification.read ? 'bg-primary/[0.03]' : 'hover:bg-secondary/50'
                    )}
                  >
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}

                    {/* Icon */}
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', config.className)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs font-medium leading-tight', !notification.read ? 'text-foreground' : 'text-muted-foreground')}>
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(notification.id); }}
                          className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary hover:text-foreground transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </span>
                        {notification.incidentId && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-border text-muted-foreground">
                            {notification.incidentId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
