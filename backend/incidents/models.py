from django.db import models

class Incident(models.Model):
    incident_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Alert(models.Model):
    alert_id = models.AutoField(primary_key=True)
    incident = models.ForeignKey(Incident, related_name='alerts', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    severity = models.CharField(max_length=50)
    message = models.TextField()

class Entity(models.Model):
    entity_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class KnowledgeBase(models.Model):
    kb_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)