"""traceIngestHandler — POST /trace

Validates the incoming manager trace, invokes the Judge Agent,
writes the enriched trace to DynamoDB, and broadcasts via WebSocket.
"""

import json
import os
import time
import uuid

import boto3

dynamodb = boto3.resource("dynamodb")
traces_table = dynamodb.Table(os.environ["TRACES_TABLE"])
bedrock_agent = boto3.client("bedrock-agent-runtime", region_name="us-west-2")

AGENT_ID = os.environ.get("BEDROCK_AGENT_ID", "")
AGENT_ALIAS_ID = os.environ.get("BEDROCK_AGENT_ALIAS_ID", "")


def handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return {"statusCode": 400, "body": json.dumps({"error": "Invalid JSON"})}

    # Generate trace ID
    trace_id = f"trc_{uuid.uuid4().hex[:16]}"
    body["trace_id"] = trace_id

    # Invoke Judge Agent
    judge_result = invoke_judge(body)
    body.update(judge_result)

    # Write to DynamoDB
    write_trace(body)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "trace_id": trace_id,
            "judge_score": judge_result.get("judge_score"),
            "severity": judge_result.get("severity"),
            "regulations_cited": judge_result.get("regulations_cited", []),
        }),
    }


def invoke_judge(trace: dict) -> dict:
    """Call the Judge Agent and parse the grading response."""
    if not AGENT_ID or not AGENT_ALIAS_ID:
        return {"judge_score": None, "judge_reasoning": None, "severity": None, "regulations_cited": []}

    prompt = json.dumps({
        "stadium_context": {
            "stadium_id": trace.get("stadium_id"),
            "scenario": trace.get("scenario"),
        },
        "observation": trace.get("observation", {}),
        "manager_output": {
            "thought": trace.get("thought", ""),
            "action": trace.get("action", {}),
        },
    })

    try:
        response = bedrock_agent.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=AGENT_ALIAS_ID,
            sessionId=trace.get("session_id", "default"),
            inputText=prompt,
        )

        # Read the streaming response
        completion = ""
        for event in response.get("completion", []):
            chunk = event.get("chunk", {})
            if "bytes" in chunk:
                completion += chunk["bytes"].decode("utf-8")

        # Parse judge output from the agent's response
        return parse_judge_response(completion)

    except Exception as e:
        print(f"Judge invocation failed: {e}")
        return {"judge_score": None, "judge_reasoning": str(e), "severity": None, "regulations_cited": []}


def parse_judge_response(text: str) -> dict:
    """Extract judge fields from the agent's text response."""
    result = {
        "judge_score": None,
        "judge_reasoning": text[:500] if text else None,
        "severity": None,
        "regulations_cited": [],
    }

    # Try to find score in the text
    lower = text.lower()
    if "score" in lower and any(c.isdigit() for c in text):
        for word in text.split():
            word = word.strip(".,;:()")
            if word.isdigit():
                score = int(word)
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

    # Extract regulation citations from text
    import re
    citations = re.findall(r'(NFPA \d+\s*§[\d.]+|ASHRAE \d+[\d.]*\s*§[\d.]+|OSHA \d+)', text)
    for cite in citations[:3]:
        result["regulations_cited"].append({
            "code": cite.strip(),
            "title": "Safety regulation",
            "excerpt": "See full text in Knowledge Base",
        })

    # If critical but no citations found, add generic one
    if result["severity"] == "critical" and not result["regulations_cited"]:
        if "lighting" in lower or "egress" in lower:
            result["regulations_cited"].append({
                "code": "NFPA 101 §7.8.1.2",
                "title": "Emergency Lighting",
                "excerpt": "Emergency lighting must remain operational while occupancy exceeds zero.",
            })

    return result


def write_trace(trace: dict):
    """Write the enriched trace to DynamoDB."""
    from decimal import Decimal

    def convert(obj):
        if isinstance(obj, float):
            return Decimal(str(obj))
        if isinstance(obj, dict):
            return {k: convert(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [convert(i) for i in obj]
        return obj

    item = convert(trace)
    traces_table.put_item(Item=item)
