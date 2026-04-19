from rest_framework import serializers
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


def get_incident_priority(risk_score):
    score = int(risk_score or 0)
    if score >= 90:
        return 'critical'
    if score >= 70:
        return 'high'
    if score >= 40:
        return 'medium'
    if score > 0:
        return 'low'
    return 'info'


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'


class IncidentSerializer(serializers.ModelSerializer):
    priority = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = '__all__'

    def get_priority(self, obj):
        return get_incident_priority(obj.risk_score)

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'

class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = '__all__'

class KnowledgeBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBase
        fields = '__all__'


class ThreatIntelIndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThreatIntelIndicator
        fields = '__all__'


class SoarPlaybookExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoarPlaybookExecution
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class AnalystNoteSerializer(serializers.ModelSerializer):
    incident_external_id = serializers.IntegerField(source='incident.incident_id', read_only=True)

    class Meta:
        model = AnalystNote
        fields = '__all__'


class AILearningHistorySerializer(serializers.ModelSerializer):
    related_incident_ids = serializers.SerializerMethodField()

    class Meta:
        model = AILearningHistory
        fields = '__all__'

    def get_related_incident_ids(self, obj):
        return list(obj.related_incidents.values_list('incident_id', flat=True))


class SplunkSettingsUpdateSerializer(serializers.Serializer):
    enabled = serializers.BooleanField(required=False)
    url = serializers.CharField(required=False)
    username = serializers.CharField(required=False)
    password = serializers.CharField(required=False, allow_blank=True)
    ssl_verify = serializers.BooleanField(required=False)
    sync_schedule = serializers.CharField(required=False)
    search_query = serializers.CharField(required=False)

    def validate(self, attrs):
        unknown_keys = set(getattr(self, 'initial_data', {}).keys()) - set(self.fields.keys())
        if unknown_keys:
            raise serializers.ValidationError({
                'unknown_fields': [f'Unknown fields: {", ".join(sorted(unknown_keys))}']
            })
        return attrs


class ElasticsearchSettingsUpdateSerializer(serializers.Serializer):
    enabled = serializers.BooleanField(required=False)
    url = serializers.CharField(required=False)
    username = serializers.CharField(required=False)
    password = serializers.CharField(required=False, allow_blank=True)
    ssl_verify = serializers.BooleanField(required=False)
    sync_schedule = serializers.CharField(required=False)
    detection_index = serializers.CharField(required=False)

    def validate(self, attrs):
        unknown_keys = set(getattr(self, 'initial_data', {}).keys()) - set(self.fields.keys())
        if unknown_keys:
            raise serializers.ValidationError({
                'unknown_fields': [f'Unknown fields: {", ".join(sorted(unknown_keys))}']
            })
        return attrs


class SIEMSettingsUpdateSerializer(serializers.Serializer):
    splunk = SplunkSettingsUpdateSerializer(required=False)
    elasticsearch = ElasticsearchSettingsUpdateSerializer(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('At least one connector payload is required')

        if 'splunk' not in attrs and 'elasticsearch' not in attrs:
            raise serializers.ValidationError('Include at least one of splunk or elasticsearch')

        raw_payload = getattr(self, 'initial_data', {}) or {}
        nested_allowed = {
            'splunk': {'enabled', 'url', 'username', 'password', 'ssl_verify', 'sync_schedule', 'search_query'},
            'elasticsearch': {
                'enabled',
                'url',
                'username',
                'password',
                'ssl_verify',
                'sync_schedule',
                'detection_index',
            },
        }

        for connector, allowed_keys in nested_allowed.items():
            raw_connector_payload = raw_payload.get(connector)
            if not isinstance(raw_connector_payload, dict):
                continue
            unknown_keys = set(raw_connector_payload.keys()) - allowed_keys
            if unknown_keys:
                raise serializers.ValidationError({
                    connector: {
                        'unknown_fields': [f'Unknown fields: {", ".join(sorted(unknown_keys))}']
                    }
                })

        return attrs


class SIEMSettingsRestoreSerializer(serializers.Serializer):
    connector = serializers.ChoiceField(choices=['splunk', 'elasticsearch'])
    change_id = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        unknown_keys = set(getattr(self, 'initial_data', {}).keys()) - set(self.fields.keys())
        if unknown_keys:
            raise serializers.ValidationError({
                'unknown_fields': [f'Unknown fields: {", ".join(sorted(unknown_keys))}']
            })
        return attrs