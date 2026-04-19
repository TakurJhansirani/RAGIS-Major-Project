from django.contrib import admin
from .models import Incident, Alert, Entity, KnowledgeBase


admin.site.register(Incident)
admin.site.register(Alert)
admin.site.register(Entity)
admin.site.register(KnowledgeBase)