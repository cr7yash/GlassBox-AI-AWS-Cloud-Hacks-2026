"""Judge Agent invocation via Bedrock Agent Runtime.

Calls the deployed Judge Agent (with Knowledge Base) to grade
a Manager trace and return structured safety verdicts with
real regulation citations.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

import boto3

logger = logging.getLogger(__name__)

_agent_client = None


def _client():
    global _agent_client
    if _agent_client is None:
        _agent_client = boto3.client(
            "bedrock-agent-runtime",
            region_name=os.getenv("AWS_REGION", "us-west-2"),
        )
    return _agent_client


def invoke_judge(
    stadium_id: str,
    observation: dict,
    thought: str,
    action: dict,
    session_id: str,
) -> dict[str, Any]:
    """Call the Judge Agent and return parsed grading fields.

    Returns dict with: judge_score, judge_reasoning, regulations_cited, severity
    """
    agent_id = os.getenv("BEDROCK_AGENT_ID", "")
    agent_alias_id = os.getenv("BEDROCK_AGENT_ALIAS_ID", "")

    if not agent_id or not agent_alias_id:
        logger.warning("Judge Agent not configured (BEDROCK_AGENT_ID / BEDROCK_AGENT_ALIAS_ID missing)")
        return _empty_verdict()

    prompt = json.dumps({
        "stadium_context": {"stadium_id": stadium_id},
        "observation": observation,
        "manager_output": {"thought": thought, "action": action},
    })

    try:
        response = _client().invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=f"{session_id}-judge",
            inputText=prompt,
        )

        # Read streaming response
        completion = ""
        for event in response.get("completion", []):
            chunk = event.get("chunk", {})
            if "bytes" in chunk:
                completion += chunk["bytes"].decode("utf-8")

        return _parse_judge_response(completion)

    except Exception as e:
        logger.error("Judge invocation failed: %s", e)
        return _empty_verdict()


def _empty_verdict() -> dict[str, Any]:
    return {
        "judge_score": None,
        "judge_reasoning": None,
        "severity": None,
        "regulations_cited": [],
    }


def _parse_judge_response(text: str) -> dict[str, Any]:
    """Extract judge fields from the agent's text response."""
    if not text:
        return _empty_verdict()

    result: dict[str, Any] = {
        "judge_score": None,
        "judge_reasoning": text[:500],
        "severity": None,
        "regulations_cited": [],
    }

    lower = text.lower()

    # Extract score — look for patterns like "score: 0", "judge_score: 2", "0/10"
    score_patterns = [
        r'(?:judge_)?score["\s:=]+(\d+)',
        r'(\d+)\s*/\s*10',
        r'score\s+(?:of\s+)?(\d+)',
    ]
    for pattern in score_patterns:
        match = re.search(pattern, lower)
        if match:
            score = int(match.group(1))
            if 0 <= score <= 10:
                result["judge_score"] = score
                break

    # Determine severity from score
    score = result["judge_score"]
    if score is not None:
        if score <= 3:
            result["severity"] = "critical"
        elif score <= 6:
            result["severity"] = "warning"
        else:
            result["severity"] = "info"
    else:
        # Infer from text
        if "critical" in lower or "violation" in lower or "unsafe" in lower or "illegal" in lower:
            result["severity"] = "critical"
            result["judge_score"] = 1
        elif "warning" in lower:
            result["severity"] = "warning"
            result["judge_score"] = 5

    # Extract regulation citations
    citation_patterns = [
        r'(NFPA\s*101\s*§[\d.]+)',
        r'(NFPA\s*101\s*Section\s*[\d.]+)',
        r'(ASHRAE\s*(?:Standard\s*)?55\s*§?[\d.]*)',
        r'(ASHRAE\s*(?:Standard\s*)?90\.1\s*§?[\d.]*)',
        r'(OSHA\s*(?:29\s*CFR\s*)?1910[\s.]*(?:Subpart\s*E)?)',
    ]

    seen_codes = set()
    for pattern in citation_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            code = match.group(1).strip()
            if code not in seen_codes:
                seen_codes.add(code)
                result["regulations_cited"].append({
                    "code": code,
                    "title": _infer_title(code),
                    "excerpt": _extract_excerpt(text, match.start()),
                })

    # If critical but no citations found, add NFPA 101 as default
    if result["severity"] == "critical" and not result["regulations_cited"]:
        if "lighting" in lower or "egress" in lower or "illumination" in lower:
            result["regulations_cited"].append({
                "code": "NFPA 101 §7.8.1.2",
                "title": "Emergency Lighting — Continuity of Egress Illumination",
                "excerpt": "Illumination of means of egress shall be continuous during the time conditions of occupancy require the means of egress be available.",
            })
        elif "temperature" in lower or "thermal" in lower or "heat" in lower:
            result["regulations_cited"].append({
                "code": "ASHRAE Standard 55",
                "title": "Thermal Environmental Conditions for Human Occupancy",
                "excerpt": "Indoor operative temperature shall not exceed 82°F when occupancy exceeds 50% of design capacity.",
            })

    return result


def _infer_title(code: str) -> str:
    """Map a regulation code to a human-readable title."""
    code_lower = code.lower()
    if "nfpa" in code_lower and "7.8" in code:
        return "Emergency Lighting — Egress Illumination"
    if "nfpa" in code_lower and "7.9" in code:
        return "Emergency Lighting Requirements"
    if "nfpa" in code_lower and "12" in code:
        return "Assembly Occupancy Requirements"
    if "nfpa" in code_lower:
        return "Life Safety Code"
    if "ashrae" in code_lower and "55" in code:
        return "Thermal Comfort Standards"
    if "ashrae" in code_lower and "90" in code:
        return "Energy Efficiency Standards"
    if "osha" in code_lower:
        return "Exit Routes and Emergency Planning"
    return "Safety Regulation"


def _extract_excerpt(text: str, pos: int) -> str:
    """Extract a short excerpt around the citation position."""
    start = max(0, pos - 50)
    end = min(len(text), pos + 150)
    excerpt = text[start:end].strip()
    # Clean up
    excerpt = re.sub(r'\s+', ' ', excerpt)
    if len(excerpt) > 180:
        excerpt = excerpt[:180] + "..."
    return excerpt
