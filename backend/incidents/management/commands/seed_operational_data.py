from django.core.management.base import BaseCommand
from django.db.models import Q

from incidents.models import (
    Incident,
    Organization,
    Notification,
    AnalystNote,
    AILearningHistory,
)


class Command(BaseCommand):
    help = "Seed notifications, analyst notes, and AI learning history from existing incidents"

    def handle(self, *args, **options):
        organization = Organization.get_default()

        incidents = list(
            Incident.objects.filter(Q(organization=organization) | Q(organization__isnull=True))
            .order_by("-created_at")[:20]
        )

        if not incidents:
            self.stdout.write(self.style.WARNING("No incidents found. Seed incidents first."))
            return

        notification_count = 0
        notes_count = 0
        learning_count = 0

        for incident in incidents:
            incident_org = incident.organization or organization
            category = "system"
            if incident.severity == "critical":
                category = "critical"
            elif incident.status == "escalated":
                category = "escalation"

            _, created = Notification.objects.get_or_create(
                organization=incident_org,
                incident=incident,
                title=f"{incident.severity.title()}: {incident.title}",
                defaults={
                    "message": incident.ai_summary or incident.description,
                    "category": category,
                    "read": False,
                    "dismissed": False,
                },
            )
            if created:
                notification_count += 1

            note_type = "observation"
            ai_relevant = True
            if incident.is_false_positive:
                note_type = "correction"
            elif incident.status == "escalated":
                note_type = "escalation"
            elif incident.status == "resolved":
                note_type = "recommendation"

            _, created = AnalystNote.objects.get_or_create(
                organization=incident_org,
                incident=incident,
                author="SOC Analyst",
                role="Tier 2 Analyst",
                content=(
                    incident.ai_summary
                    or "Investigated incident and documented findings for future tuning."
                ),
                defaults={
                    "note_type": note_type,
                    "ai_relevant": ai_relevant,
                },
            )
            if created:
                notes_count += 1

        learning_templates = [
            {
                "entry_type": "model-update",
                "title": "Model update from incident triage",
                "description": "Model context expanded using recent incident outcomes and analyst annotations.",
                "impact": "positive",
                "metrics_change": {"metric": "AI Accuracy", "before": 84, "after": 88},
            },
            {
                "entry_type": "fp-correction",
                "title": "False-positive correction rules tuned",
                "description": "Adjusted correlation weights for repetitive benign telemetry patterns.",
                "impact": "positive",
                "metrics_change": {"metric": "False Positive Rate", "before": 15, "after": 12},
            },
            {
                "entry_type": "threshold-adjusted",
                "title": "Threat scoring threshold adjusted",
                "description": "Updated escalation threshold based on observed SOC response outcomes.",
                "impact": "neutral",
                "metrics_change": {"metric": "Escalation Precision", "before": 71, "after": 76},
            },
        ]

        for template in learning_templates:
            learning, created = AILearningHistory.objects.get_or_create(
                organization=organization,
                entry_type=template["entry_type"],
                title=template["title"],
                defaults={
                    "description": template["description"],
                    "impact": template["impact"],
                    "metrics_change": template["metrics_change"],
                },
            )
            if created:
                learning_count += 1

            for incident in incidents[:5]:
                learning.related_incidents.add(incident)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {notification_count} notifications, {notes_count} notes, {learning_count} learning entries created."
            )
        )
