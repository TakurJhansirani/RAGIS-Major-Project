from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from .permissions import IsAnalyst, require_analyst
from django.db.models import Q
from django.utils import timezone
from .models import (
    Incident,
    Alert,
    Entity,
    KnowledgeBase,
    Organization,
    ThreatIntelIndicator,
    SoarPlaybookExecution,
    Notification,
    AnalystNote,
    AILearningHistory,
)
from .serializers import (
    IncidentSerializer,
    AlertSerializer,
    EntitySerializer,
    KnowledgeBaseSerializer,
    OrganizationSerializer,
    ThreatIntelIndicatorSerializer,
    SoarPlaybookExecutionSerializer,
    NotificationSerializer,
    AnalystNoteSerializer,
    AILearningHistorySerializer,
    SIEMSettingsUpdateSerializer,
    SIEMSettingsRestoreSerializer,
)
from .counterfactual import generate_counterfactual_simulation
from .soar_connectors import trigger_soar_playbook
from .threat_intel import sync_threat_intel_feed
from .integration_config import IntegrationConfig


def _get_organization_from_request(request):
    org_hint = (
        request.query_params.get('organization_id')
        or request.query_params.get('organization')
        or request.headers.get('X-Organization')
        or request.data.get('organization_id', None)
        or request.data.get('organization', None)
    )

    if not org_hint:
        return None

    try:
        return Organization.objects.get(org_id=int(org_hint))
    except (ValueError, Organization.DoesNotExist):
        pass

    try:
        return Organization.objects.get(slug=str(org_hint))
    except Organization.DoesNotExist:
        return None


class AIModelSettingsView(APIView):
    """Return AI model catalog and runtime AI configuration."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(IntegrationConfig.get_ai_model_catalog(), status=status.HTTP_200_OK)


class SIEMSettingsView(APIView):
    """Return and update runtime SIEM connector configuration."""
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        return Response(IntegrationConfig.get_siem_settings(), status=status.HTTP_200_OK)

    def put(self, request):
        serializer = SIEMSettingsUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if 'splunk' in payload and isinstance(payload['splunk'], dict):
            IntegrationConfig.set_splunk_config(payload['splunk'], updated_by=request.user)

        if 'elasticsearch' in payload and isinstance(payload['elasticsearch'], dict):
            IntegrationConfig.set_elasticsearch_config(payload['elasticsearch'], updated_by=request.user)

        return Response(IntegrationConfig.get_siem_settings(), status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SIEMSettingsRestoreSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            if serializer.validated_data['connector'] == 'splunk':
                IntegrationConfig.restore_siem_settings_from_history(
                    'splunk',
                    serializer.validated_data['change_id'],
                    updated_by=request.user,
                )
            else:
                IntegrationConfig.restore_siem_settings_from_history(
                    'elasticsearch',
                    serializer.validated_data['change_id'],
                    updated_by=request.user,
                )
        except ValueError:
            return Response({'error': 'History entry not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(IntegrationConfig.get_siem_settings(), status=status.HTTP_200_OK)

class IncidentViewSet(viewsets.ModelViewSet):
    """API endpoint for incidents with filtering and real-time updates"""
    queryset = Incident.objects.all().order_by('-risk_score', '-created_at')
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Filter incidents based on query parameters"""
        queryset = Incident.objects.all().order_by('-risk_score', '-created_at')

        organization = _get_organization_from_request(self.request)
        if organization:
            queryset = queryset.filter(organization=organization)
        
        # Filter by severity
        severity = self.request.query_params.get('severity', None)
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Search by title or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        # Filter by date range
        since = self.request.query_params.get('since', None)
        if since:
            queryset = queryset.filter(created_at__gte=since)
        
        return queryset

    def perform_create(self, serializer):
        organization = _get_organization_from_request(self.request)
        if organization is None:
            organization = Organization.get_default()
        serializer.save(organization=organization)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recently created incidents"""
        limit = int(request.query_params.get('limit', 10))
        incidents = self.get_queryset()[:limit]
        serializer = self.get_serializer(incidents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    @require_analyst
    def update_status(self, request, pk=None):
        """Update incident status (analyst+ only)"""
        incident = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in ['open', 'investigating', 'resolved', 'escalated']:
            incident.status = new_status
            incident.updated_at = timezone.now()
            incident.save()
            
            return Response(
                IncidentSerializer(incident).data,
                status=status.HTTP_200_OK
            )
        
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['patch'])
    @require_analyst
    def mark_false_positive(self, request, pk=None):
        """Mark incident as false positive (analyst+ only)"""
        incident = self.get_object()
        incident.is_false_positive = True
        incident.status = 'resolved'
        incident.updated_at = timezone.now()
        incident.save()
        
        return Response(IncidentSerializer(incident).data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get incident statistics"""
        incidents = self.get_queryset()
        total = incidents.count()
        critical = incidents.filter(severity='critical').count()
        high = incidents.filter(severity='high').count()
        open_incidents = incidents.filter(status='open').count()
        resolved_today = incidents.filter(
            status='resolved',
            updated_at__date=timezone.now().date()
        ).count()
        
        return Response({
            'total_incidents': total,
            'critical_alerts': critical,
            'high_severity': high,
            'open_incidents': open_incidents,
            'resolved_today': resolved_today,
        })

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def counterfactual_simulate(self, request, pk=None):
        """Generate counterfactual action scenarios for an incident."""
        incident = self.get_object()
        selected_actions = request.data.get('actions')

        if selected_actions is not None and not isinstance(selected_actions, list):
            return Response(
                {'error': 'actions must be a list of action IDs'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        simulation = generate_counterfactual_simulation(
            incident=incident,
            selected_actions=selected_actions,
        )
        return Response(simulation, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def trigger_soar(self, request, pk=None):
        """Trigger a SOAR playbook for this incident and log execution."""
        incident = self.get_object()
        playbook = request.data.get('playbook', 'isolate-and-contain')
        payload = request.data.get('payload', {})
        if payload is None or not isinstance(payload, dict):
            payload = {}

        execution = trigger_soar_playbook(
            incident=incident,
            playbook=str(playbook),
            payload=payload,
        )

        serializer = SoarPlaybookExecutionSerializer(execution)
        response_status = status.HTTP_200_OK if execution.status == 'success' else status.HTTP_202_ACCEPTED
        return Response(serializer.data, status=response_status)

    @action(detail=True, methods=['get'])
    def threat_intel_context(self, request, pk=None):
        """Return threat intel indicators matching incident entities."""
        incident = self.get_object()
        values = [
            incident.source_ip,
            incident.target_ip,
        ]
        values.extend(incident.affected_assets or [])
        values = [str(value).strip() for value in values if value]

        indicators = ThreatIntelIndicator.objects.filter(is_active=True)
        if incident.organization:
            indicators = indicators.filter(organization=incident.organization)

        indicators = indicators.filter(value__in=values).order_by('-updated_at')
        serializer = ThreatIntelIndicatorSerializer(indicators, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AlertViewSet(viewsets.ModelViewSet):
    """API endpoint for alerts"""
    queryset = Alert.objects.all().order_by('-timestamp')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Filter alerts by incident"""
        incident_id = self.request.query_params.get('incident_id', None)
        if incident_id:
            return Alert.objects.filter(incident__incident_id=incident_id).order_by('-timestamp')

        organization = _get_organization_from_request(self.request)
        queryset = Alert.objects.all().order_by('-timestamp')
        if organization:
            queryset = queryset.filter(incident__organization=organization)
        return queryset


class EntityViewSet(viewsets.ModelViewSet):
    """API endpoint for entities (IPs, hostnames, etc.)"""
    queryset = Entity.objects.all()
    serializer_class = EntitySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class KnowledgeBaseViewSet(viewsets.ModelViewSet):
    """API endpoint for knowledge base articles"""
    queryset = KnowledgeBase.objects.all().order_by('-created_at')
    serializer_class = KnowledgeBaseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create knowledge base entries"""
        items = request.data.get('items', [])
        created_items = []
        
        for item in items:
            kb = KnowledgeBase.objects.create(**item)
            created_items.append(KnowledgeBaseSerializer(kb).data)
        
        return Response(created_items, status=status.HTTP_201_CREATED)


class OrganizationViewSet(viewsets.ModelViewSet):
    """API endpoint for tenant organizations."""
    queryset = Organization.objects.all().order_by('name')
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class ThreatIntelIndicatorViewSet(viewsets.ModelViewSet):
    """API endpoint for threat intelligence indicators and feed sync."""
    queryset = ThreatIntelIndicator.objects.all().order_by('-updated_at')
    serializer_class = ThreatIntelIndicatorSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = ThreatIntelIndicator.objects.all().order_by('-updated_at')
        organization = _get_organization_from_request(self.request)
        if organization:
            queryset = queryset.filter(organization=organization)

        indicator_type = self.request.query_params.get('indicator_type')
        if indicator_type:
            queryset = queryset.filter(indicator_type=indicator_type)

        source = self.request.query_params.get('source')
        if source:
            queryset = queryset.filter(source=source)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(value__icontains=search)

        return queryset

    def perform_create(self, serializer):
        organization = _get_organization_from_request(self.request)
        if organization is None:
            organization = Organization.get_default()
        serializer.save(organization=organization)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def sync_live(self, request):
        # Temporary demo mode: allow manual sync without authentication.
        organization = _get_organization_from_request(request)
        if organization is None:
            organization = Organization.get_default()

        processed = sync_threat_intel_feed(organization=organization)
        return Response(
            {
                'organization': organization.slug,
                'processed_indicators': processed,
            },
            status=status.HTTP_200_OK,
        )


class SoarPlaybookExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only API for SOAR playbook execution history."""
    queryset = SoarPlaybookExecution.objects.all().order_by('-triggered_at')
    serializer_class = SoarPlaybookExecutionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = SoarPlaybookExecution.objects.all().order_by('-triggered_at')
        organization = _get_organization_from_request(self.request)
        if organization:
            queryset = queryset.filter(organization=organization)

        incident_id = self.request.query_params.get('incident_id')
        if incident_id:
            queryset = queryset.filter(incident__incident_id=incident_id)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset


class NotificationViewSet(viewsets.ModelViewSet):
    """API endpoint for user/system notifications."""
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Notification.objects.all().order_by('-created_at')
        organization = _get_organization_from_request(self.request)
        if organization:
            queryset = queryset.filter(organization=organization)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        include_dismissed = self.request.query_params.get('include_dismissed') == 'true'
        if not include_dismissed:
            queryset = queryset.filter(dismissed=False)

        read_filter = self.request.query_params.get('read')
        if read_filter in ['true', 'false']:
            queryset = queryset.filter(read=(read_filter == 'true'))

        return queryset

    def perform_create(self, serializer):
        organization = _get_organization_from_request(self.request)
        if organization is None:
            organization = Organization.get_default()
        serializer.save(organization=organization)

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.read = True
        notification.save(update_fields=['read', 'updated_at'])
        return Response(self.get_serializer(notification).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'])
    def dismiss(self, request, pk=None):
        notification = self.get_object()
        notification.dismissed = True
        notification.save(update_fields=['dismissed', 'updated_at'])
        return Response(self.get_serializer(notification).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        queryset = self.get_queryset().filter(read=False)
        updated = queryset.update(read=True)
        return Response({'updated': updated}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def dismiss_all(self, request):
        queryset = self.get_queryset().filter(dismissed=False)
        updated = queryset.update(dismissed=True)
        return Response({'updated': updated}, status=status.HTTP_200_OK)


class AnalystNoteViewSet(viewsets.ModelViewSet):
    """API endpoint for analyst notes linked to incidents."""
    queryset = AnalystNote.objects.select_related('incident', 'organization').all().order_by('-created_at')
    serializer_class = AnalystNoteSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        # Temporary demo mode: allow unauthenticated users to create analyst notes.
        if self.action == 'create':
            return [AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        queryset = AnalystNote.objects.select_related('incident', 'organization').all().order_by('-created_at')
        organization = _get_organization_from_request(self.request)
        if organization:
            queryset = queryset.filter(organization=organization)

        incident_id = self.request.query_params.get('incident_id')
        if incident_id:
            queryset = queryset.filter(incident__incident_id=incident_id)

        note_type = self.request.query_params.get('note_type')
        if note_type:
            queryset = queryset.filter(note_type=note_type)

        ai_relevant = self.request.query_params.get('ai_relevant')
        if ai_relevant in ['true', 'false']:
            queryset = queryset.filter(ai_relevant=(ai_relevant == 'true'))

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(content__icontains=search) | Q(author__icontains=search))

        return queryset

    def perform_create(self, serializer):
        organization = _get_organization_from_request(self.request)
        if organization is None:
            organization = Organization.get_default()
        serializer.save(organization=organization)


class AILearningHistoryViewSet(viewsets.ModelViewSet):
    """API endpoint for AI learning updates and tuning history."""
    queryset = AILearningHistory.objects.prefetch_related('related_incidents').all().order_by('-created_at')
    serializer_class = AILearningHistorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = AILearningHistory.objects.prefetch_related('related_incidents').all().order_by('-created_at')
        organization = _get_organization_from_request(self.request)
        if organization:
            queryset = queryset.filter(organization=organization)

        entry_type = self.request.query_params.get('entry_type')
        if entry_type:
            queryset = queryset.filter(entry_type=entry_type)

        impact = self.request.query_params.get('impact')
        if impact:
            queryset = queryset.filter(impact=impact)

        incident_id = self.request.query_params.get('incident_id')
        if incident_id:
            queryset = queryset.filter(related_incidents__incident_id=incident_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))

        return queryset.distinct()

    def perform_create(self, serializer):
        organization = _get_organization_from_request(self.request)
        if organization is None:
            organization = Organization.get_default()
        serializer.save(organization=organization)
