from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AIModelSettingsView,
    SIEMSettingsView,
    IncidentViewSet,
    AlertViewSet,
    EntityViewSet,
    KnowledgeBaseViewSet,
    OrganizationViewSet,
    ThreatIntelIndicatorViewSet,
    SoarPlaybookExecutionViewSet,
    NotificationViewSet,
    AnalystNoteViewSet,
    AILearningHistoryViewSet,
)
from .webhooks import webhook_incident, sync_splunk_incidents, sync_elasticsearch_incidents

router = DefaultRouter()
router.register(r'incidents', IncidentViewSet, basename='incident')
router.register(r'alerts', AlertViewSet, basename='alert')
router.register(r'entities', EntityViewSet, basename='entity')
router.register(r'knowledge-base', KnowledgeBaseViewSet, basename='knowledge-base')
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'threat-intel', ThreatIntelIndicatorViewSet, basename='threat-intel')
router.register(r'soar-executions', SoarPlaybookExecutionViewSet, basename='soar-executions')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'analyst-notes', AnalystNoteViewSet, basename='analyst-note')
router.register(r'ai-learning-history', AILearningHistoryViewSet, basename='ai-learning-history')

urlpatterns = [
    path('', include(router.urls)),
    path('settings/ai-models/', AIModelSettingsView.as_view(), name='settings-ai-models'),
    path('settings/siem/', SIEMSettingsView.as_view(), name='settings-siem'),
    path('settings/siem/restore/', SIEMSettingsView.as_view(), name='settings-siem-restore'),
    # Webhook endpoints
    path('webhooks/incident/', webhook_incident, name='webhook-incident'),
    path('sync/splunk/', sync_splunk_incidents, name='sync-splunk'),
    path('sync/elasticsearch/', sync_elasticsearch_incidents, name='sync-elasticsearch'),
]
