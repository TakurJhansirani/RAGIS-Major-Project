import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { setBackendFallbackActive } from '@/hooks/useFallbackMode';
import { incidents as mockIncidents, dashboardMetrics } from '@/data/mockData';
import { mockNotifications } from '@/data/notificationData';
import {
  analystNotes as mockAnalystNotes,
  aiLearningHistory as mockAILearningHistory,
  resolvedIncidents as mockResolvedIncidents,
} from '@/data/knowledgeBaseData';
import { getIncidentPriority } from '@/lib/incidentPriority';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const isAuthFailureStatus = (status: number) => status === 401 || status === 403;

const notificationLocalOverrides: Record<number, { read?: boolean; dismissed?: boolean }> = {};

const applyNotificationOverrides = (items: NotificationItem[]): NotificationItem[] =>
  items.map((item) => {
    const override = notificationLocalOverrides[item.notification_id];
    if (!override) return item;
    return {
      ...item,
      ...(override.read !== undefined ? { read: override.read } : {}),
      ...(override.dismissed !== undefined ? { dismissed: override.dismissed } : {}),
    };
  });

const setAllNotificationOverrides = (items: NotificationItem[], patch: { read?: boolean; dismissed?: boolean }) => {
  items.forEach((item) => {
    notificationLocalOverrides[item.notification_id] = {
      ...notificationLocalOverrides[item.notification_id],
      ...patch,
    };
  });
};

const mapMockIncidentToApiIncident = (incident: any, index: number) => {
  const parsedId = Number(String(incident.id ?? '').replace(/[^0-9]/g, ''));
  const incidentId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : index + 1;

  return {
    incident_id: incidentId,
    title: incident.title,
    description: incident.description,
    severity: incident.severity,
    status: incident.status,
    category: incident.category,
    source_ip: incident.sourceIP,
    target_ip: incident.targetIP,
    ai_summary: incident.aiSummary,
    confidence_score: incident.confidenceScore,
    risk_score: incident.riskScore,
    priority: getIncidentPriority(incident.riskScore),
    affected_assets: incident.affectedAssets,
    is_false_positive: incident.isFalsePositive,
    source: 'mock-fallback',
    external_id: incident.id,
    created_at: incident.timestamp,
    updated_at: incident.timestamp,
  };
};

const mockApiIncidents = mockIncidents.map(mapMockIncidentToApiIncident);

const mockThreatIntelIndicators: ThreatIntelIndicator[] = [
  {
    indicator_id: 90001,
    organization: null,
    indicator_type: 'ip',
    value: '185.220.101.34',
    source: 'mock-threat-feed',
    severity: 'high',
    confidence_score: 82,
    tags: ['tor-exit-node', 'botnet'],
    last_seen: new Date().toISOString(),
    is_active: true,
  },
  {
    indicator_id: 90002,
    organization: null,
    indicator_type: 'domain',
    value: 'xk4d.evil-dns.com',
    source: 'mock-threat-feed',
    severity: 'critical',
    confidence_score: 90,
    tags: ['c2', 'dns-tunnel'],
    last_seen: new Date().toISOString(),
    is_active: true,
  },
  {
    indicator_id: 90003,
    organization: null,
    indicator_type: 'url',
    value: 'https://malicious.example/payload/dropper',
    source: 'mock-threat-feed',
    severity: 'medium',
    confidence_score: 74,
    tags: ['malware-hosting'],
    last_seen: new Date().toISOString(),
    is_active: true,
  },
];

const mockSoarExecutions: SoarExecution[] = [
  {
    execution_id: 80001,
    organization: null,
    incident: 1001,
    playbook: 'isolate-and-contain',
    status: 'success',
    external_execution_id: 'mock-exec-1001',
    triggered_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    error_message: '',
  },
  {
    execution_id: 80002,
    organization: null,
    incident: 1002,
    playbook: 'disable-user-and-reset-credentials',
    status: 'requested',
    external_execution_id: 'mock-exec-1002',
    triggered_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    completed_at: null,
    error_message: '',
  },
];

const normalizeIncidentIdValue = (incidentId: string | number): string => {
  if (typeof incidentId === 'number') return String(incidentId);

  const trimmed = incidentId.trim();
  if (!trimmed) return '';

  const prefixedMatch = trimmed.match(/^INC[-_\s]?(\d+)$/i);
  if (prefixedMatch?.[1]) {
    return prefixedMatch[1];
  }

  return trimmed;
};

const incidentIdToNumber = (incidentId: string | number): number => {
  const normalized = normalizeIncidentIdValue(incidentId);
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : -Date.now();
};

const buildIncidentIdCandidates = (incidentId: string | number): string[] => {
  const raw = String(incidentId).trim();
  const normalized = normalizeIncidentIdValue(incidentId);
  const candidates = [raw, normalized].filter(Boolean);
  return [...new Set(candidates)];
};

interface IncidentFilters {
  severity?: string;
  status?: string;
  category?: string;
  search?: string;
  since?: string;
  limit?: number;
}

interface IncidentStats {
  total_incidents: number;
  critical_alerts: number;
  high_severity: number;
  open_incidents: number;
  resolved_today: number;
}

export interface Organization {
  org_id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export interface ThreatIntelIndicator {
  indicator_id: number;
  organization: number | null;
  indicator_type: 'ip' | 'domain' | 'url' | 'file_hash' | 'email';
  value: string;
  source: string;
  severity: string;
  confidence_score: number;
  tags: string[];
  last_seen: string | null;
  is_active: boolean;
}

export interface SIEMSyncResult {
  success: boolean;
  created_incidents: number;
  offline?: boolean;
  source?: 'splunk' | 'elasticsearch';
}

export interface SoarExecution {
  execution_id: number;
  organization: number | null;
  incident: number;
  playbook: string;
  status: 'requested' | 'success' | 'failed';
  external_execution_id: string;
  triggered_at: string;
  completed_at: string | null;
  error_message: string;
}

export interface NotificationItem {
  notification_id: number;
  organization: number | null;
  incident: number | null;
  title: string;
  message: string;
  category: 'critical' | 'escalation' | 'system' | 'ai-insight';
  read: boolean;
  dismissed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalystNoteItem {
  note_id: number;
  organization: number | null;
  incident: number;
  incident_external_id?: number;
  author: string;
  role: string;
  content: string;
  note_type: 'observation' | 'correction' | 'recommendation' | 'escalation';
  ai_relevant: boolean;
  created_at: string;
  updated_at: string;
}

export interface AILearningHistoryItem {
  learning_id: number;
  organization: number | null;
  entry_type: 'model-update' | 'rule-tuned' | 'fp-correction' | 'pattern-learned' | 'threshold-adjusted';
  title: string;
  description: string;
  impact: 'positive' | 'neutral' | 'negative';
  metrics_change: Record<string, any>;
  related_incidents: number[];
  related_incident_ids?: number[];
  created_at: string;
  updated_at: string;
}

interface CounterfactualWindowEstimate {
  minutes_earlier: number;
  estimated_risk_reduction_pct: number;
  estimated_blast_radius_reduction_pct: number;
  estimated_containment_time_saved_min: number;
  confidence: number;
  utility_score: number;
}

interface CounterfactualScenario {
  action_id: string;
  action: string;
  time_window_estimates: CounterfactualWindowEstimate[];
  best_window: {
    minutes_earlier: number;
    utility_score: number;
  };
  assumptions: string[];
}

export interface CounterfactualSimulation {
  incident_id: string;
  generated_at: string;
  model: string;
  current_assessment: {
    severity: string;
    risk_score: number;
    confidence_score: number;
    estimated_blast_radius_assets: number;
    estimated_containment_time_min: number;
  };
  recommended_action: {
    action_id: string;
    action: string;
    best_window: {
      minutes_earlier: number;
      utility_score: number;
    };
  } | null;
  scenarios: CounterfactualScenario[];
  methodology: {
    type: string;
    description: string;
    evaluated_windows_min_earlier: number[];
  };
}

/**
 * Fetch all incidents from backend API
 */
export const useIncidents = (filters?: IncidentFilters) => {
  const { user, session } = useAuth();

  const params = new URLSearchParams();
  if (filters?.severity) params.append('severity', filters.severity);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.since) params.append('since', filters.since);

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/incidents/?${params}`,
          {
            headers: {
              ...authHeader,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch incidents');
        }

        const data = await response.json();
        setBackendFallbackActive('incidents', false);
        return data.results || data;
      } catch {
        setBackendFallbackActive('incidents', true);
        return mockApiIncidents;
      }
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Fetch incident by ID
 */
export const useIncident = (incidentId: string) => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useQuery({
    queryKey: ['incident', incidentId],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/incidents/${incidentId}/`,
          {
            headers: authHeader,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch incident');
        }

        setBackendFallbackActive('incident', false);
        return response.json();
      } catch {
        setBackendFallbackActive('incident', true);
        const idAsNumber = Number(incidentId);
        return mockApiIncidents.find((incident) => String(incident.incident_id) === incidentId || incident.incident_id === idAsNumber) ?? null;
      }
    },
    enabled: !!user && !!incidentId,
  });
};

/**
 * Fetch recent incidents
 */
export const useRecentIncidents = (limit: number = 10) => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useQuery({
    queryKey: ['recent-incidents', limit],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/incidents/recent/?limit=${limit}`,
          {
            headers: authHeader,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch recent incidents');
        }

        setBackendFallbackActive('recent-incidents', false);
        return response.json();
      } catch {
        setBackendFallbackActive('recent-incidents', true);
        return [...mockApiIncidents]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);
      }
    },
    enabled: !!user,
    refetchInterval: 15000, // Refetch every 15 seconds for live updates
  });
};

/**
 * Fetch incident statistics
 */
export const useIncidentStats = () => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useQuery<IncidentStats>({
    queryKey: ['incident-stats'],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/incidents/statistics/`,
          {
            headers: authHeader,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch incident statistics');
        }

        setBackendFallbackActive('incident-stats', false);
        return response.json();
      } catch {
        setBackendFallbackActive('incident-stats', true);
        return {
          total_incidents: dashboardMetrics.totalIncidents,
          critical_alerts: dashboardMetrics.criticalAlerts,
          high_severity: mockApiIncidents.filter((incident) => incident.severity === 'high').length,
          open_incidents: mockApiIncidents.filter((incident) => incident.status === 'open').length,
          resolved_today: dashboardMetrics.resolvedToday,
        };
      }
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Update incident status
 */
export const useUpdateIncidentStatus = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation({
    mutationFn: async ({ incidentId, status }: { incidentId: string; status: string }) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/incidents/${incidentId}/update_status/`,
          {
            method: 'PATCH',
            headers: {
              ...authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
          }
        );

        if (!response.ok) {
          if (isAuthFailureStatus(response.status)) {
            throw new Error('Authentication required to update incident status');
          }
          throw new Error('Failed to update incident status');
        }

        return response.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Authentication required')) {
          throw error;
        }
        return { incident_id: Number(incidentId), status, updated_at: new Date().toISOString() };
      }
    },
    onMutate: async ({ incidentId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['incidents'] });
      await queryClient.cancelQueries({ queryKey: ['incident', incidentId] });

      queryClient.setQueriesData({ queryKey: ['incidents'] }, (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.map((item) =>
            String(item.incident_id ?? item.id) === String(incidentId)
              ? { ...item, status, updated_at: new Date().toISOString() }
              : item
          );
        }
        return oldData;
      });

      queryClient.setQueryData(['incident', incidentId], (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, status, updated_at: new Date().toISOString() };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
    },
  });
};

/**
 * Mark incident as false positive
 */
export const useMarkFalsePositive = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation({
    mutationFn: async (incidentId: string) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/incidents/${incidentId}/mark_false_positive/`,
          {
            method: 'PATCH',
            headers: {
              ...authHeader,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (isAuthFailureStatus(response.status)) {
            throw new Error('Authentication required to mark false positive');
          }
          throw new Error('Failed to mark as false positive');
        }

        return response.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Authentication required')) {
          throw error;
        }
        return {
          incident_id: Number(incidentId),
          is_false_positive: true,
          status: 'resolved',
          updated_at: new Date().toISOString(),
        };
      }
    },
    onMutate: async (incidentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['incidents'] });
      await queryClient.cancelQueries({ queryKey: ['incident', incidentId] });

      queryClient.setQueriesData({ queryKey: ['incidents'] }, (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.map((item) =>
            String(item.incident_id ?? item.id) === String(incidentId)
              ? {
                  ...item,
                  is_false_positive: true,
                  status: 'resolved',
                  updated_at: new Date().toISOString(),
                }
              : item
          );
        }
        return oldData;
      });

      queryClient.setQueryData(['incident', incidentId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          is_false_positive: true,
          status: 'resolved',
          updated_at: new Date().toISOString(),
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
    },
  });
};

/**
 * Fetch alerts for an incident
 */
export const useIncidentAlerts = (incidentId: string) => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useQuery({
    queryKey: ['alerts', incidentId],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/alerts/?incident_id=${incidentId}`,
        {
          headers: authHeader,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      return response.json();
    },
    enabled: !!user && !!incidentId,
  });
};

/**
 * Fetch entities (IPs, hostnames, etc.)
 */
export const useEntities = () => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/entities/`,
        {
          headers: authHeader,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }

      return response.json();
    },
    enabled: !!user,
  });
};

/**
 * Fetch knowledge base
 */
export const useKnowledgeBase = () => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useQuery({
    queryKey: ['knowledge-base'],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/knowledge-base/`,
          {
            headers: authHeader,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch knowledge base');
        }

        setBackendFallbackActive('knowledge-base', false);
        return response.json();
      } catch {
        setBackendFallbackActive('knowledge-base', true);
        return mockResolvedIncidents.map((incident, index) => ({
          kb_id: index + 1,
          title: incident.title,
          content: `${incident.rootCause}\n\nResolution: ${incident.resolution}\n\nLessons: ${incident.lessonsLearned}`,
          tags: incident.tags,
          related_incidents: [Number(String(incident.id).replace(/[^0-9]/g, '')) || index + 1],
          created_at: incident.detectedAt,
          updated_at: incident.resolvedAt,
        }));
      }
    },
    enabled: !!user,
  });
};

/**
 * Fetch notifications
 */
export const useNotifications = (includeDismissed: boolean = false) => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  const params = new URLSearchParams();
  if (includeDismissed) {
    params.append('include_dismissed', 'true');
  }

  return useQuery<NotificationItem[]>({
    queryKey: ['notifications', includeDismissed],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/?${params}`, {
          headers: authHeader,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        setBackendFallbackActive('notifications', false);
        return applyNotificationOverrides(data.results || data);
      } catch {
        setBackendFallbackActive('notifications', true);
        const mapped: NotificationItem[] = mockNotifications.map((notification, index) => ({
          notification_id: index + 1,
          organization: null,
          incident: notification.incidentId ? Number(String(notification.incidentId).replace(/[^0-9]/g, '')) || null : null,
          title: notification.title,
          message: notification.message,
          category: notification.category,
          read: notification.read,
          dismissed: notification.dismissed,
          created_at: notification.timestamp.toISOString(),
          updated_at: notification.timestamp.toISOString(),
        }));

        const merged = applyNotificationOverrides(mapped);
        return includeDismissed ? merged : merged.filter((item) => !item.dismissed);
      }
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
};

/**
 * Mark a notification as read
 */
export const useMarkNotificationRead = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation({
    mutationFn: async (notificationId: number) => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/mark_read/`, {
          method: 'PATCH',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (isAuthFailureStatus(response.status)) {
            throw new Error('Authentication required to update notifications');
          }
          throw new Error('Failed to mark notification as read');
        }

        return response.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Authentication required')) {
          throw error;
        }
        notificationLocalOverrides[notificationId] = {
          ...notificationLocalOverrides[notificationId],
          read: true,
        };
        return { notification_id: notificationId, read: true };
      }
    },
    onMutate: async (notificationId: number) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData: NotificationItem[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((item) =>
          item.notification_id === notificationId ? { ...item, read: true } : item
        );
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Dismiss a notification
 */
export const useDismissNotification = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation({
    mutationFn: async (notificationId: number) => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/dismiss/`, {
          method: 'PATCH',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (isAuthFailureStatus(response.status)) {
            throw new Error('Authentication required to update notifications');
          }
          throw new Error('Failed to dismiss notification');
        }

        return response.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Authentication required')) {
          throw error;
        }
        notificationLocalOverrides[notificationId] = {
          ...notificationLocalOverrides[notificationId],
          dismissed: true,
        };
        return { notification_id: notificationId, dismissed: true };
      }
    },
    onMutate: async (notificationId: number) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData: NotificationItem[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((item) =>
          item.notification_id === notificationId ? { ...item, dismissed: true } : item
        );
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllNotificationsRead = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/mark_all_read/`, {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (isAuthFailureStatus(response.status)) {
            throw new Error('Authentication required to update notifications');
          }
          throw new Error('Failed to mark all notifications as read');
        }

        return response.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Authentication required')) {
          throw error;
        }
        return { updated: 'local' };
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData: NotificationItem[] | undefined) => {
        if (!oldData) return oldData;
        setAllNotificationOverrides(oldData, { read: true });
        return oldData.map((item) => ({ ...item, read: true }));
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Dismiss all notifications
 */
export const useDismissAllNotifications = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/dismiss_all/`, {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (isAuthFailureStatus(response.status)) {
            throw new Error('Authentication required to update notifications');
          }
          throw new Error('Failed to dismiss all notifications');
        }

        return response.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Authentication required')) {
          throw error;
        }
        return { updated: 'local' };
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData: NotificationItem[] | undefined) => {
        if (!oldData) return oldData;
        setAllNotificationOverrides(oldData, { dismissed: true });
        return oldData.map((item) => ({ ...item, dismissed: true }));
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Fetch analyst notes
 */
export const useAnalystNotes = (incidentId?: string | number) => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  const params = new URLSearchParams();
  if (incidentId !== undefined && incidentId !== null && incidentId !== '') {
    params.append('incident_id', String(incidentId));
  }

  return useQuery<AnalystNoteItem[]>({
    queryKey: ['analyst-notes', incidentId],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/analyst-notes/?${params}`, {
          headers: authHeader,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analyst notes');
        }

        const data = await response.json();
        setBackendFallbackActive('analyst-notes', false);
        return data.results || data;
      } catch {
        setBackendFallbackActive('analyst-notes', true);
        const mapped: AnalystNoteItem[] = mockAnalystNotes.map((note, index) => ({
          note_id: index + 1,
          organization: null,
          incident: Number(String(note.incidentId).replace(/[^0-9]/g, '')) || index + 1,
          author: note.author,
          role: note.role,
          content: note.content,
          note_type: note.type,
          ai_relevant: note.aiRelevant,
          created_at: note.timestamp,
          updated_at: note.timestamp,
        }));

        if (incidentId === undefined || incidentId === null || incidentId === '') {
          return mapped;
        }

        const requested = Number(incidentId);
        return mapped.filter((item) => item.incident === requested);
      }
    },
    enabled: !!user,
  });
};

/**
 * Fetch AI learning history
 */
export const useAILearningHistory = (incidentId?: string | number) => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  const params = new URLSearchParams();
  if (incidentId !== undefined && incidentId !== null && incidentId !== '') {
    params.append('incident_id', String(incidentId));
  }

  return useQuery<AILearningHistoryItem[]>({
    queryKey: ['ai-learning-history', incidentId],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/ai-learning-history/?${params}`, {
          headers: authHeader,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch AI learning history');
        }

        const data = await response.json();
        setBackendFallbackActive('ai-learning-history', false);
        return data.results || data;
      } catch {
        setBackendFallbackActive('ai-learning-history', true);
        const mapped: AILearningHistoryItem[] = mockAILearningHistory.map((entry, index) => {
          const related = entry.relatedIncidents
            .map((id) => Number(String(id).replace(/[^0-9]/g, '')))
            .filter((id) => Number.isFinite(id));

          return {
            learning_id: index + 1,
            organization: null,
            entry_type: entry.type,
            title: entry.title,
            description: entry.description,
            impact: entry.impact,
            metrics_change: entry.metricsChange || {},
            related_incidents: related,
            related_incident_ids: related,
            created_at: entry.timestamp,
            updated_at: entry.timestamp,
          };
        });

        if (incidentId === undefined || incidentId === null || incidentId === '') {
          return mapped;
        }

        const requested = Number(incidentId);
        return mapped.filter((item) => (item.related_incident_ids || []).includes(requested));
      }
    },
    enabled: !!user,
  });
};

/**
 * Run counterfactual simulation for an incident
 */
export const useCounterfactualSimulation = () => {
  const { session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation<CounterfactualSimulation, Error, { incidentId: string; actions?: string[] }>({
    mutationFn: async ({ incidentId, actions }) => {
      const response = await fetch(
        `${API_BASE_URL}/incidents/${incidentId}/counterfactual_simulate/`,
        {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actions }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to run counterfactual simulation');
      }

      return response.json();
    },
  });
};

/**
 * Fetch organizations for multi-tenant filtering
 */
export const useOrganizations = () => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/organizations/`, { headers: authHeader });
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      const data = await response.json();
      return data.results || data;
    },
    enabled: !!user,
  });
};

/**
 * Fetch threat intelligence indicators
 */
export const useThreatIntelIndicators = (organization?: string | number) => {
  const { user, session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  const params = new URLSearchParams();
  if (organization !== undefined && organization !== null && organization !== '') {
    params.append('organization', String(organization));
  }

  return useQuery<ThreatIntelIndicator[]>({
    queryKey: ['threat-intel', organization],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/threat-intel/?${params}`, { headers: authHeader });
        if (!response.ok) {
          throw new Error('Failed to fetch threat intel indicators');
        }
        const data = await response.json();
        const rows = data.results || data;
        if (Array.isArray(rows) && rows.length > 0) {
          return rows;
        }
      } catch {
        // Return seeded indicators so the Threat Intel view is never empty in offline/dev mode.
      }

      return mockThreatIntelIndicators;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};

/**
 * Trigger live threat intel sync
 */
export const useSyncThreatIntel = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation({
    mutationFn: async (organization?: string | number) => {
      const body = organization !== undefined ? { organization } : {};
      try {
        const response = await fetch(`${API_BASE_URL}/threat-intel/sync_live/`, {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          if (isAuthFailureStatus(response.status)) {
            throw new Error('Authentication required to sync threat intel feed');
          }
          throw new Error('Failed to sync threat intel feed');
        }
        return response.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Authentication required')) {
          throw error;
        }
        return {
          organization: organization ? String(organization) : 'offline-fallback',
          processed_indicators: 0,
          offline: true,
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threat-intel'] });
    },
  });
};

const createSiemSyncMutationConfig = (
  endpoint: string,
  authHeader: Record<string, string>,
  authErrorMessage: string,
  fallbackSource: 'splunk' | 'elasticsearch'
) => ({
  mutationFn: async (variables?: { organization?: string | number }) => {
    const body = variables?.organization !== undefined ? { organization: variables.organization } : {};
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (isAuthFailureStatus(response.status)) {
          throw new Error(authErrorMessage);
        }
        throw new Error(`Failed to sync ${fallbackSource} incidents`);
      }

      return response.json() as Promise<SIEMSyncResult>;
    } catch (error) {
      if (error instanceof Error && error.message === authErrorMessage) {
        throw error;
      }

      return {
        success: true,
        created_incidents: 0,
        offline: true,
        source: fallbackSource,
      };
    }
  },
});

export const useSyncSplunkIncidents = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation<SIEMSyncResult, Error, { organization?: string | number } | undefined>({
    ...createSiemSyncMutationConfig(
      '/sync/splunk/',
      authHeader,
      'Authentication required to sync Splunk incidents',
      'splunk'
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['recent-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
    },
  });
};

export const useSyncElasticsearchIncidents = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation<SIEMSyncResult, Error, { organization?: string | number } | undefined>({
    ...createSiemSyncMutationConfig(
      '/sync/elasticsearch/',
      authHeader,
      'Authentication required to sync Elasticsearch incidents',
      'elasticsearch'
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['recent-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
    },
  });
};

/**
 * Trigger a SOAR playbook for an incident
 */
export const useTriggerSoarPlaybook = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  return useMutation<SoarExecution, Error, { incidentId: string | number; playbook: string; payload?: Record<string, any> }>({
    mutationFn: async ({ incidentId, playbook, payload }) => {
      try {
        const incidentCandidates = buildIncidentIdCandidates(incidentId);
        for (const incidentCandidate of incidentCandidates) {
          const response = await fetch(`${API_BASE_URL}/incidents/${incidentCandidate}/trigger_soar/`, {
            method: 'POST',
            headers: {
              ...authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playbook, payload: payload || {} }),
          });

          if (response.ok) {
            return response.json();
          }

          if (isAuthFailureStatus(response.status)) {
            throw new Error('Authentication required to trigger SOAR playbook');
          }

          if (response.status !== 404) {
            throw new Error('Failed to trigger SOAR playbook');
          }
        }

        throw new Error('Incident not found for SOAR playbook trigger');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Authentication required')) {
          throw error;
        }
        return {
          execution_id: -Date.now(),
          organization: null,
          incident: incidentIdToNumber(incidentId),
          playbook,
          status: 'requested',
          external_execution_id: 'offline-fallback',
          triggered_at: new Date().toISOString(),
          completed_at: null,
          error_message: '',
        } as SoarExecution;
      }
    },
    onMutate: async ({ incidentId, playbook }) => {
      await queryClient.cancelQueries({ queryKey: ['soar-executions'] });
      const optimisticExecution: SoarExecution = {
        execution_id: -Date.now(),
        organization: null,
        incident: incidentIdToNumber(incidentId),
        playbook,
        status: 'requested',
        external_execution_id: 'optimistic',
        triggered_at: new Date().toISOString(),
        completed_at: null,
        error_message: '',
      };

      queryClient.setQueriesData({ queryKey: ['soar-executions'] }, (oldData: any) => {
        if (!oldData) return [optimisticExecution];
        if (Array.isArray(oldData)) {
          return [optimisticExecution, ...oldData];
        }
        return oldData;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident'] });
      queryClient.invalidateQueries({ queryKey: ['soar-executions'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['soar-executions'] });
    },
  });
};

/**
 * Fetch SOAR execution history
 */
export const useSoarExecutions = (organization?: string | number, incidentId?: string) => {
  const { session } = useAuth();

  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  const params = new URLSearchParams();
  if (organization !== undefined && organization !== null && organization !== '') {
    params.append('organization', String(organization));
  }
  if (incidentId) {
    params.append('incident_id', incidentId);
  }

  return useQuery<SoarExecution[]>({
    queryKey: ['soar-executions', organization, incidentId],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/soar-executions/?${params}`, { headers: authHeader });
        if (!response.ok) {
          throw new Error('Failed to fetch SOAR executions');
        }
        const data = await response.json();
        const rows = data.results || data;
        if (Array.isArray(rows) && rows.length > 0) {
          return rows;
        }
      } catch {
        // Keep SOAR history visible in demo/offline mode.
      }

      return mockSoarExecutions;
    },
    enabled: true,
    refetchInterval: 5000, // Refetch every 5 seconds for dynamic updates
  });
};
