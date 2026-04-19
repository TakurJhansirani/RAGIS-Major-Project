from django.conf import settings
from django.db import models


class Organization(models.Model):
    org_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @classmethod
    def get_default(cls):
        org, _ = cls.objects.get_or_create(
            slug='default',
            defaults={
                'name': 'Default Organization',
                'is_active': True,
            },
        )
        return org

class Incident(models.Model):
    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
        ('info', 'Info'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('escalated', 'Escalated'),
    ]
    
    CATEGORY_CHOICES = [
        ('malware', 'Malware'),
        ('phishing', 'Phishing'),
        ('brute-force', 'Brute Force'),
        ('data-exfiltration', 'Data Exfiltration'),
        ('insider-threat', 'Insider Threat'),
        ('dos', 'DoS'),
        ('unauthorized-access', 'Unauthorized Access'),
        ('reconnaissance', 'Reconnaissance'),
    ]

    incident_id = models.AutoField(primary_key=True)
    organization = models.ForeignKey(Organization, related_name='incidents', on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    source_ip = models.GenericIPAddressField(null=True, blank=True)
    target_ip = models.GenericIPAddressField(null=True, blank=True)
    ai_summary = models.TextField(blank=True, default='')
    confidence_score = models.IntegerField(default=0, help_text='0-100')
    risk_score = models.IntegerField(default=0, help_text='0-100')
    affected_assets = models.JSONField(default=list, help_text='List of affected assets/hostnames')
    is_false_positive = models.BooleanField(default=False)
    source = models.CharField(max_length=100, default='manual', help_text='Source of incident: manual, splunk, elasticsearch, api, etc.')
    external_id = models.CharField(max_length=255, null=True, blank=True, help_text='External incident ID from source system')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['severity', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['organization', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.incident_id})"

class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
        ('info', 'Info'),
    ]
    
    alert_id = models.AutoField(primary_key=True)
    incident = models.ForeignKey(Incident, related_name='alerts', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    message = models.TextField()
    raw_data = models.JSONField(default=dict, blank=True, help_text='Raw alert JSON from source system')
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Alert {self.alert_id} - {self.severity}"

class Entity(models.Model):
    ENTITY_TYPES = [
        ('ip', 'IP Address'),
        ('hostname', 'Hostname'),
        ('email', 'Email'),
        ('domain', 'Domain'),
        ('user', 'User Account'),
        ('file_hash', 'File Hash'),
        ('url', 'URL'),
    ]
    
    entity_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=50, choices=ENTITY_TYPES)
    description = models.TextField(blank=True)
    context_data = models.JSONField(default=dict, blank=True)
    incidents = models.ManyToManyField(Incident, related_name='entities', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('name', 'entity_type')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.entity_type})"

class KnowledgeBase(models.Model):
    kb_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    tags = models.JSONField(default=list, help_text='Tags for categorization')
    related_incidents = models.ManyToManyField(Incident, related_name='knowledge_base', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Knowledge Base'
    
    def __str__(self):
        return self.title


class ThreatIntelIndicator(models.Model):
    INDICATOR_TYPES = [
        ('ip', 'IP Address'),
        ('domain', 'Domain'),
        ('url', 'URL'),
        ('file_hash', 'File Hash'),
        ('email', 'Email'),
    ]

    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
        ('info', 'Info'),
    ]

    indicator_id = models.AutoField(primary_key=True)
    organization = models.ForeignKey(Organization, related_name='threat_indicators', on_delete=models.CASCADE, null=True, blank=True)
    indicator_type = models.CharField(max_length=20, choices=INDICATOR_TYPES)
    value = models.CharField(max_length=500)
    source = models.CharField(max_length=120, default='manual')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    confidence_score = models.IntegerField(default=50, help_text='0-100')
    tags = models.JSONField(default=list, blank=True)
    raw_data = models.JSONField(default=dict, blank=True)
    first_seen = models.DateTimeField(null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ('organization', 'indicator_type', 'value')
        indexes = [
            models.Index(fields=['organization', 'indicator_type']),
            models.Index(fields=['value']),
            models.Index(fields=['-updated_at']),
        ]

    def __str__(self):
        return f"{self.indicator_type}:{self.value}"


class SoarPlaybookExecution(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    execution_id = models.AutoField(primary_key=True)
    organization = models.ForeignKey(Organization, related_name='soar_executions', on_delete=models.CASCADE, null=True, blank=True)
    incident = models.ForeignKey(Incident, related_name='soar_executions', on_delete=models.CASCADE)
    playbook = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    external_execution_id = models.CharField(max_length=255, blank=True, default='')
    request_payload = models.JSONField(default=dict, blank=True)
    response_payload = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True, default='')
    triggered_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-triggered_at']
        indexes = [
            models.Index(fields=['organization', '-triggered_at']),
            models.Index(fields=['incident', '-triggered_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.playbook} ({self.status})"


class Notification(models.Model):
    CATEGORY_CHOICES = [
        ('critical', 'Critical'),
        ('escalation', 'Escalation'),
        ('system', 'System'),
        ('ai-insight', 'AI Insight'),
    ]

    notification_id = models.AutoField(primary_key=True)
    organization = models.ForeignKey(Organization, related_name='notifications', on_delete=models.CASCADE, null=True, blank=True)
    incident = models.ForeignKey(Incident, related_name='notifications', on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='system')
    read = models.BooleanField(default=False)
    dismissed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['read', 'dismissed']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return self.title


class AnalystNote(models.Model):
    NOTE_TYPE_CHOICES = [
        ('observation', 'Observation'),
        ('correction', 'Correction'),
        ('recommendation', 'Recommendation'),
        ('escalation', 'Escalation'),
    ]

    note_id = models.AutoField(primary_key=True)
    organization = models.ForeignKey(Organization, related_name='analyst_notes', on_delete=models.CASCADE, null=True, blank=True)
    incident = models.ForeignKey(Incident, related_name='analyst_notes', on_delete=models.CASCADE)
    author = models.CharField(max_length=120, default='Analyst')
    role = models.CharField(max_length=120, default='SOC Analyst')
    content = models.TextField()
    note_type = models.CharField(max_length=20, choices=NOTE_TYPE_CHOICES, default='observation')
    ai_relevant = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['incident', '-created_at']),
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['note_type']),
        ]

    def __str__(self):
        return f"{self.note_type} note for incident {self.incident_id}"


class AILearningHistory(models.Model):
    ENTRY_TYPE_CHOICES = [
        ('model-update', 'Model Update'),
        ('rule-tuned', 'Rule Tuned'),
        ('fp-correction', 'False Positive Correction'),
        ('pattern-learned', 'Pattern Learned'),
        ('threshold-adjusted', 'Threshold Adjusted'),
    ]

    IMPACT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]

    learning_id = models.AutoField(primary_key=True)
    organization = models.ForeignKey(Organization, related_name='ai_learning_history', on_delete=models.CASCADE, null=True, blank=True)
    entry_type = models.CharField(max_length=30, choices=ENTRY_TYPE_CHOICES, default='pattern-learned')
    title = models.CharField(max_length=255)
    description = models.TextField()
    impact = models.CharField(max_length=20, choices=IMPACT_CHOICES, default='neutral')
    metrics_change = models.JSONField(default=dict, blank=True)
    related_incidents = models.ManyToManyField(Incident, related_name='ai_learning_entries', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['entry_type']),
            models.Index(fields=['impact']),
        ]

    def __str__(self):
        return self.title


class SIEMSettings(models.Model):
    singleton_id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    splunk_config = models.JSONField(default=dict, blank=True)
    elasticsearch_config = models.JSONField(default=dict, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='siem_settings_updates')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'SIEM Settings'
        verbose_name_plural = 'SIEM Settings'

    def __str__(self):
        return 'SIEM Settings'


class SIEMSettingsChangeLog(models.Model):
    connector_choices = [
        ('splunk', 'Splunk'),
        ('elasticsearch', 'Elasticsearch'),
    ]

    change_id = models.AutoField(primary_key=True)
    connector = models.CharField(max_length=32, choices=connector_choices)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='siem_settings_change_logs')
    changed_at = models.DateTimeField(auto_now_add=True)
    config_snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['connector', '-changed_at']),
            models.Index(fields=['changed_at']),
        ]

    def __str__(self):
        return f'{self.connector} updated at {self.changed_at.isoformat() if self.changed_at else "unknown"}'