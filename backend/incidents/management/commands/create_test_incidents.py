"""
Example Django management command to test incident creation
Run: python manage.py shell < test_incidents.py
Or: python manage.py create_test_incidents
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from incidents.models import Incident, Alert
from faker import Faker
import random

class Command(BaseCommand):
    help = 'Create test incidents for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='Number of incidents to create'
        )

    def handle(self, *args, **options):
        fake = Faker()
        count = options['count']
        
        severities = ['critical', 'high', 'medium', 'low', 'info']
        statuses = ['open', 'investigating', 'resolved', 'escalated']
        categories = [
            'malware', 'phishing', 'brute-force', 'data-exfiltration',
            'insider-threat', 'dos', 'unauthorized-access', 'reconnaissance'
        ]
        
        created_incidents = []
        
        for i in range(count):
            severity = random.choice(severities)
            status = random.choice(statuses)
            category = random.choice(categories)
            
            incident = Incident.objects.create(
                title=f"{fake.sentence(nb_words=6)}",
                description=fake.paragraph(nb_sentences=3),
                severity=severity,
                status=status,
                category=category,
                source_ip=fake.ipv4(),
                target_ip=fake.ipv4(),
                ai_summary=f"AI Analysis: {fake.paragraph(nb_sentences=2)}",
                confidence_score=random.randint(50, 99),
                risk_score=random.randint(20, 100),
                affected_assets=[
                    fake.hostname(),
                    fake.hostname(),
                    f"server-{random.randint(1, 10):02d}"
                ],
                source='manual',
                external_id=f"TEST-{i+1:04d}",
            )
            
            # Create related alert
            Alert.objects.create(
                incident=incident,
                severity=severity,
                message=f"Alert for {incident.title}",
            )
            
            created_incidents.append(incident)
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created incident: {incident.title} ({incident.incident_id})')
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Successfully created {len(created_incidents)} test incidents')
        )
