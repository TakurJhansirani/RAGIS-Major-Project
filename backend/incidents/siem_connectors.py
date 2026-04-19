# SIEM Integrations - Pull incidents from real security systems
import requests
import json
import hashlib
from typing import List, Dict, Any
from django.utils import timezone
from incidents.models import Incident, Alert, Entity, Organization

class BaseSIEMConnector:
    """Base class for SIEM connectors"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.base_url = config.get('url')
        self.auth = config.get('auth', {})
    
    def fetch_incidents(self) -> List[Dict]:
        """Fetch incidents from SIEM system"""
        raise NotImplementedError
    
    def create_incident_from_alert(self, alert_data: Dict) -> Incident:
        """Convert SIEM alert to Incident model"""
        raise NotImplementedError


class SplunkConnector(BaseSIEMConnector):
    """Splunk Enterprise Security (ES) integration"""
    
    def fetch_incidents(self, time_range: str = '-24h@h') -> List[Dict]:
        """
        Fetch notable events from Splunk
        time_range: '-24h@h', '-7d@d', etc.
        """
        # Splunk REST API requires authentication
        username = self.auth.get('username')
        password = self.auth.get('password')
        
        # Prefer notable/security events instead of generic internal telemetry.
        search_query = self.config.get(
            'search_query',
            f"search index=notable earliest={time_range} | head 200"
        )
        
        url = f"{self.base_url}/services/search/jobs/export"
        
        # Create search job
        response = requests.post(
            url,
            data={'search': search_query, 'output_mode': 'json'},
            auth=(username, password),
            verify=False
        )
        
        if response.status_code == 201:
            job_response = response.json()
            job_sid = job_response['sid']
            
            # Get results
            results_url = f"{self.base_url}/services/search/jobs/{job_sid}/results?output_mode=json"
            results = self._get_results_with_retry(results_url, (username, password))
            
            return self._parse_splunk_incidents(results)
        
        return []
    
    def _get_results_with_retry(self, url: str, auth: tuple, max_retries: int = 10):
        """Poll for results"""
        for _ in range(max_retries):
            response = requests.get(url, auth=auth, verify=False)
            data = response.json()
            if data.get('results'):
                return data['results']
        return []
    
    def _parse_splunk_incidents(self, results: List[Dict]) -> List[Dict]:
        """Parse Splunk notable events to incident format"""
        incidents = []
        
        for result in results:
            if not self._is_security_relevant(result):
                continue

            title = self._build_title(result)
            description = self._build_description(result)
            severity = self._map_severity(
                result.get('severity')
                or result.get('urgency')
                or result.get('priority')
                or result.get('risk_severity')
                or 'medium'
            )
            category = self._map_category(
                result.get('rule_name')
                or result.get('signature')
                or result.get('search_name')
                or result.get('sourcetype')
                or ''
            )

            source_ip = self._get_first(result, ['src', 'src_ip', 'source_ip', 'src_ip_addr', 'ip'])
            target_ip = self._get_first(result, ['dest', 'dest_ip', 'destination_ip', 'target_ip', 'dst'])

            external_id = (
                result.get('event_id')
                or result.get('orig_sid')
                or result.get('sid')
                or result.get('_cd')
                or self._fingerprint_result(result)
            )

            incident = {
                'title': title,
                'description': description,
                'severity': severity,
                'status': result.get('status', 'open'),
                'category': category,
                'source_ip': source_ip,
                'target_ip': target_ip,
                'affected_assets': self._extract_assets(result),
                'source': 'splunk',
                'external_id': str(external_id),
                'raw_data': result
            }
            incidents.append(incident)
        
        return incidents

    def _get_first(self, payload: Dict[str, Any], keys: List[str]):
        for key in keys:
            value = payload.get(key)
            if value not in [None, '']:
                return value
        return None

    def _fingerprint_result(self, result: Dict[str, Any]) -> str:
        raw = json.dumps(result, sort_keys=True, default=str)
        return hashlib.sha1(raw.encode('utf-8')).hexdigest()[:20]

    def _build_title(self, result: Dict[str, Any]) -> str:
        candidates = [
            result.get('title'),
            result.get('rule_name'),
            result.get('signature'),
            result.get('search_name'),
            result.get('alert_name'),
            result.get('event_name'),
        ]
        for candidate in candidates:
            if candidate:
                return str(candidate)

        source_ip = self._get_first(result, ['src', 'src_ip', 'source_ip'])
        target_ip = self._get_first(result, ['dest', 'dest_ip', 'destination_ip'])
        if source_ip and target_ip:
            return f"Suspicious activity from {source_ip} to {target_ip}"
        return 'Splunk Security Event'

    def _build_description(self, result: Dict[str, Any]) -> str:
        candidates = [
            result.get('description'),
            result.get('message'),
            result.get('search'),
            result.get('_raw'),
        ]
        for candidate in candidates:
            if candidate:
                text = str(candidate).strip()
                if text:
                    return text[:1000]

        rule = result.get('rule_name') or result.get('signature') or 'security detection'
        source_ip = self._get_first(result, ['src', 'src_ip', 'source_ip']) or 'unknown source'
        target_ip = self._get_first(result, ['dest', 'dest_ip', 'destination_ip']) or 'unknown target'
        return f"Splunk reported {rule} involving {source_ip} and {target_ip}."

    def _is_security_relevant(self, result: Dict[str, Any]) -> bool:
        # Keep events that carry obvious security context.
        if any(result.get(field) for field in ['rule_name', 'signature', 'severity', 'urgency', 'event_id']):
            return True

        text = ' '.join(
            str(result.get(field, ''))
            for field in ['title', 'description', 'message', 'search', '_raw', 'sourcetype']
        ).lower()
        security_keywords = [
            'malware', 'phish', 'brute', 'unauthorized', 'recon', 'threat', 'attack', 'intrusion',
            'c2', 'exfil', 'alert', 'notable', 'xdr', 'edr', 'siem'
        ]
        return any(keyword in text for keyword in security_keywords)
    
    def _map_severity(self, splunk_severity: str) -> str:
        if splunk_severity is None:
            return 'medium'

        # Numeric severities often appear in Splunk feeds.
        if isinstance(splunk_severity, (int, float)):
            value = float(splunk_severity)
            if value >= 9:
                return 'critical'
            if value >= 7:
                return 'high'
            if value >= 4:
                return 'medium'
            if value >= 1:
                return 'low'
            return 'info'

        severity_text = str(splunk_severity).strip().lower()
        mapping = {
            'critical': 'critical',
            'high': 'high',
            'medium': 'medium',
            'low': 'low',
            'info': 'info',
            'informational': 'info',
            '5': 'critical',
            '4': 'high',
            '3': 'medium',
            '2': 'low',
            '1': 'info',
        }
        return mapping.get(severity_text, 'medium')
    
    def _map_category(self, rule_name: str) -> str:
        """Try to categorize based on rule name"""
        rule_lower = rule_name.lower()
        categories = {
            'malware': 'malware',
            'phishing': 'phishing',
            'brute': 'brute-force',
            'exfiltration': 'data-exfiltration',
            'insider': 'insider-threat',
            'dos': 'dos',
            'unauthorized': 'unauthorized-access',
            'recon': 'reconnaissance'
        }
        
        for keyword, category in categories.items():
            if keyword in rule_lower:
                return category
        
        return 'reconnaissance'
    
    def _extract_assets(self, result: Dict) -> List[str]:
        """Extract hostnames/assets from result"""
        assets = []
        for field in ['src_host', 'dest_host', 'host', 'hostname', 'dvc', 'device_hostname', 'endpoint']:
            if field in result and result[field]:
                assets.append(result[field])
        return list(set(assets))


class ElasticsearchConnector(BaseSIEMConnector):
    """Elasticsearch Security solution integration"""
    
    def fetch_incidents(self) -> List[Dict]:
        """Fetch incidents from Elasticsearch"""
        # Query for alerts/events from last 24 hours
        query = {
            "bool": {
                "must": [
                    {"range": {"@timestamp": {"gte": "now-24h"}}}
                ]
            }
        }
        
        url = f"{self.base_url}/.detections-default/_search"
        headers = {"Content-Type": "application/json"}
        auth_tuple = (self.auth.get('username'), self.auth.get('password'))
        
        try:
            response = requests.get(
                url,
                json={"query": query},
                auth=auth_tuple,
                headers=headers,
                verify=False
            )
            
            if response.status_code == 200:
                hits = response.json().get('hits', {}).get('hits', [])
                return self._parse_elasticsearch_incidents(hits)
        except Exception as e:
            print(f"Error fetching from Elasticsearch: {e}")
        
        return []
    
    def _parse_elasticsearch_incidents(self, hits: List[Dict]) -> List[Dict]:
        """Parse Elasticsearch alerts to incident format"""
        incidents = []
        
        for hit in hits:
            source = hit.get('_source', {})
            
            incident = {
                'title': source.get('signal.rule.name', 'Elasticsearch Alert'),
                'description': source.get('message', source.get('signal.rule.description', '')),
                'severity': source.get('event.severity', 'medium'),
                'status': 'open',
                'category': source.get('signal.rule.type', 'reconnaissance'),
                'source_ip': source.get('source.ip', None),
                'target_ip': source.get('destination.ip', None),
                'affected_assets': [source.get('host.name')] if source.get('host.name') else [],
                'source': 'elasticsearch',
                'external_id': hit.get('_id', ''),
            }
            incidents.append(incident)
        
        return incidents


class HTTPWebhookReceiver:
    """Receive incidents via HTTP webhook from any SIEM/tool"""
    
    @staticmethod
    def create_incident_from_webhook(webhook_data: Dict) -> Incident:
        """
        Create incident from webhook data
        Expects standardized format:
        {
            "title": "...",
            "description": "...",
            "severity": "high",
            "category": "malware",
            "source_ip": "1.2.3.4",
            "target_ip": "5.6.7.8",
            "affected_assets": ["server1", "workstation2"],
            "source": "webhook",
            "external_id": "ext-123"
        }
        """
        organization = None
        organization_hint = webhook_data.get('organization_id') or webhook_data.get('organization')
        if organization_hint:
            try:
                organization = Organization.objects.get(org_id=int(organization_hint))
            except (ValueError, Organization.DoesNotExist):
                try:
                    organization = Organization.objects.get(slug=str(organization_hint))
                except Organization.DoesNotExist:
                    organization = Organization.get_default()
        if organization is None:
            organization = Organization.get_default()

        incident = Incident.objects.create(
            organization=organization,
            title=webhook_data.get('title', 'Webhook Incident'),
            description=webhook_data.get('description', ''),
            severity=webhook_data.get('severity', 'medium'),
            status=webhook_data.get('status', 'open'),
            category=webhook_data.get('category', 'reconnaissance'),
            source_ip=webhook_data.get('source_ip'),
            target_ip=webhook_data.get('target_ip'),
            affected_assets=webhook_data.get('affected_assets', []),
            source=webhook_data.get('source', 'webhook'),
            external_id=webhook_data.get('external_id', ''),
        )
        return incident


def sync_incidents_from_splunk(config: Dict):
    """Background task to sync incidents from Splunk"""
    connector = SplunkConnector(config)
    incidents = connector.fetch_incidents()
    
    organization = None
    organization_hint = config.get('organization_id') or config.get('organization')
    if organization_hint:
        try:
            organization = Organization.objects.get(org_id=int(organization_hint))
        except (ValueError, Organization.DoesNotExist):
            try:
                organization = Organization.objects.get(slug=str(organization_hint))
            except Organization.DoesNotExist:
                organization = Organization.get_default()
    if organization is None:
        organization = Organization.get_default()

    created_count = 0
    for incident_data in incidents:
        incident, created = Incident.objects.get_or_create(
            organization=organization,
            external_id=incident_data.get('external_id'),
            source=incident_data.get('source'),
            defaults={
                'title': incident_data['title'],
                'description': incident_data['description'],
                'severity': incident_data['severity'],
                'category': incident_data['category'],
                'source_ip': incident_data.get('source_ip'),
                'target_ip': incident_data.get('target_ip'),
                'affected_assets': incident_data.get('affected_assets', []),
            }
        )
        if created:
            created_count += 1
    
    return created_count


def sync_incidents_from_elasticsearch(config: Dict):
    """Background task to sync incidents from Elasticsearch"""
    connector = ElasticsearchConnector(config)
    incidents = connector.fetch_incidents()
    
    organization = None
    organization_hint = config.get('organization_id') or config.get('organization')
    if organization_hint:
        try:
            organization = Organization.objects.get(org_id=int(organization_hint))
        except (ValueError, Organization.DoesNotExist):
            try:
                organization = Organization.objects.get(slug=str(organization_hint))
            except Organization.DoesNotExist:
                organization = Organization.get_default()
    if organization is None:
        organization = Organization.get_default()

    created_count = 0
    for incident_data in incidents:
        incident, created = Incident.objects.get_or_create(
            organization=organization,
            external_id=incident_data.get('external_id'),
            source=incident_data.get('source'),
            defaults={
                'title': incident_data['title'],
                'description': incident_data['description'],
                'severity': incident_data['severity'],
                'category': incident_data['category'],
                'source_ip': incident_data.get('source_ip'),
                'target_ip': incident_data.get('target_ip'),
                'affected_assets': incident_data.get('affected_assets', []),
            }
        )
        if created:
            created_count += 1
    
    return created_count
