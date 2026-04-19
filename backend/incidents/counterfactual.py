from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.utils import timezone

from .models import Incident


SEVERITY_WEIGHTS = {
    "critical": 1.0,
    "high": 0.82,
    "medium": 0.6,
    "low": 0.35,
    "info": 0.15,
}

BASE_ACTIONS_BY_CATEGORY = {
    "phishing": [
        ("revoke_tokens", "Revoke user sessions and refresh tokens"),
        ("mailbox_quarantine", "Quarantine malicious emails in impacted mailboxes"),
        ("host_isolation", "Isolate endpoint where attachment or link was opened"),
    ],
    "malware": [
        ("host_isolation", "Isolate impacted hosts from east-west traffic"),
        ("edr_scan", "Force EDR deep scan and kill suspicious processes"),
        ("block_ioc", "Block known C2 domains, hashes, and IP indicators"),
    ],
    "brute-force": [
        ("ip_block", "Block attacking source IPs and ranges at edge"),
        ("credential_reset", "Reset targeted account passwords and enforce MFA"),
        ("rate_limit", "Apply temporary auth throttling and lockout policy"),
    ],
    "data-exfiltration": [
        ("network_segmentation", "Segment exfiltration path and deny outbound route"),
        ("credential_reset", "Rotate service account credentials"),
        ("host_isolation", "Isolate exfiltration origin host"),
    ],
    "insider-threat": [
        ("access_suspension", "Suspend risky user access pending review"),
        ("data_guardrails", "Apply DLP policy and outbound restrictions"),
        ("session_termination", "Terminate active sessions across managed systems"),
    ],
    "dos": [
        ("traffic_filter", "Apply WAF/network traffic filtering rules"),
        ("autoscale", "Activate autoscaling and traffic shedding controls"),
        ("upstream_mitigation", "Trigger upstream provider mitigation profile"),
    ],
    "unauthorized-access": [
        ("credential_reset", "Reset and rotate compromised credentials"),
        ("host_isolation", "Isolate pivot host to reduce lateral movement"),
        ("network_segmentation", "Enforce temporary segmentation in affected zone"),
    ],
    "reconnaissance": [
        ("ip_block", "Block reconnaissance sources"),
        ("honeypot_redirect", "Redirect probes to deception environment"),
        ("rate_limit", "Rate-limit scanning behavior"),
    ],
}


@dataclass
class ScenarioEstimate:
    minutes_earlier: int
    estimated_risk_reduction_pct: float
    estimated_blast_radius_reduction_pct: float
    estimated_containment_time_saved_min: float
    confidence: float


def _safe_risk_score(incident: Incident) -> int:
    score = incident.risk_score or 0
    return max(0, min(100, int(score)))


def _base_confidence(incident: Incident) -> float:
    return max(0.2, min(0.98, (incident.confidence_score or 0) / 100.0))


def _estimated_blast_radius(incident: Incident) -> int:
    asset_count = len(incident.affected_assets or [])
    return max(1, asset_count)


def _action_modifier(action_id: str) -> float:
    # Higher value means stronger expected impact in simulation.
    return {
        "host_isolation": 1.0,
        "network_segmentation": 0.95,
        "credential_reset": 0.88,
        "mailbox_quarantine": 0.82,
        "revoke_tokens": 0.8,
        "edr_scan": 0.76,
        "ip_block": 0.72,
        "block_ioc": 0.74,
        "rate_limit": 0.68,
        "access_suspension": 0.9,
        "data_guardrails": 0.83,
        "session_termination": 0.79,
        "traffic_filter": 0.75,
        "autoscale": 0.7,
        "upstream_mitigation": 0.78,
        "honeypot_redirect": 0.62,
    }.get(action_id, 0.7)


def _estimate_scenario(
    incident: Incident,
    action_id: str,
    minutes_earlier: int,
) -> ScenarioEstimate:
    severity_weight = SEVERITY_WEIGHTS.get(incident.severity, 0.6)
    base_risk = _safe_risk_score(incident)
    action_weight = _action_modifier(action_id)

    time_factor = min(1.0, minutes_earlier / 60.0)
    risk_reduction = round(base_risk * 0.5 * severity_weight * action_weight * (0.35 + time_factor), 1)
    blast_reduction = round(100 * 0.45 * severity_weight * action_weight * (0.3 + time_factor), 1)
    containment_saved = round(incident.risk_score * 0.12 * action_weight * (0.3 + time_factor), 1)

    confidence = _base_confidence(incident)
    confidence = round(max(0.2, min(0.98, confidence * (0.9 + time_factor * 0.2))), 2)

    return ScenarioEstimate(
        minutes_earlier=minutes_earlier,
        estimated_risk_reduction_pct=min(95.0, risk_reduction),
        estimated_blast_radius_reduction_pct=min(90.0, blast_reduction),
        estimated_containment_time_saved_min=max(1.0, containment_saved),
        confidence=confidence,
    )


def _estimate_utility(scenario: ScenarioEstimate) -> float:
    # Utility combines impact reduction and time savings with confidence scaling.
    utility = (
        scenario.estimated_risk_reduction_pct * 0.45
        + scenario.estimated_blast_radius_reduction_pct * 0.35
        + scenario.estimated_containment_time_saved_min * 0.2
    )
    return round(utility * scenario.confidence, 2)


def generate_counterfactual_simulation(
    incident: Incident,
    selected_actions: list[str] | None = None,
) -> dict[str, Any]:
    category_actions = BASE_ACTIONS_BY_CATEGORY.get(incident.category, [
        ("host_isolation", "Isolate impacted host"),
        ("credential_reset", "Reset suspected compromised credentials"),
        ("network_segmentation", "Enforce network segmentation around affected assets"),
    ])

    if selected_actions:
        selected_set = set(selected_actions)
        category_actions = [a for a in category_actions if a[0] in selected_set]

    if not category_actions:
        category_actions = BASE_ACTIONS_BY_CATEGORY.get(incident.category, [])

    scenario_windows = [10, 20, 45]
    scenarios = []

    for action_id, action_label in category_actions:
        window_estimates = [
            _estimate_scenario(incident, action_id, minutes)
            for minutes in scenario_windows
        ]
        best_estimate = max(window_estimates, key=_estimate_utility)
        scenarios.append(
            {
                "action_id": action_id,
                "action": action_label,
                "time_window_estimates": [
                    {
                        "minutes_earlier": estimate.minutes_earlier,
                        "estimated_risk_reduction_pct": estimate.estimated_risk_reduction_pct,
                        "estimated_blast_radius_reduction_pct": estimate.estimated_blast_radius_reduction_pct,
                        "estimated_containment_time_saved_min": estimate.estimated_containment_time_saved_min,
                        "confidence": estimate.confidence,
                        "utility_score": _estimate_utility(estimate),
                    }
                    for estimate in window_estimates
                ],
                "best_window": {
                    "minutes_earlier": best_estimate.minutes_earlier,
                    "utility_score": _estimate_utility(best_estimate),
                },
                "assumptions": [
                    "Network controls can be applied within response SLA.",
                    "Entity mapping from incident telemetry is accurate.",
                    "No major attacker behavior shift during evaluated window.",
                ],
            }
        )

    scenarios = sorted(scenarios, key=lambda item: item["best_window"]["utility_score"], reverse=True)

    baseline_blast_radius = _estimated_blast_radius(incident)
    estimated_containment_minutes = max(5, int(round((_safe_risk_score(incident) * 1.6), 0)))

    top = scenarios[0] if scenarios else None
    return {
        "incident_id": incident.incident_id,
        "generated_at": timezone.now().isoformat(),
        "model": "counterfactual-v1-heuristic",
        "current_assessment": {
            "severity": incident.severity,
            "risk_score": _safe_risk_score(incident),
            "confidence_score": incident.confidence_score,
            "estimated_blast_radius_assets": baseline_blast_radius,
            "estimated_containment_time_min": estimated_containment_minutes,
        },
        "recommended_action": {
            "action_id": top["action_id"],
            "action": top["action"],
            "best_window": top["best_window"],
        } if top else None,
        "scenarios": scenarios,
        "methodology": {
            "type": "counterfactual replay approximation",
            "description": "Estimates outcome deltas for earlier intervention windows using incident severity, category, risk score, and confidence weighting.",
            "evaluated_windows_min_earlier": scenario_windows,
        },
    }
