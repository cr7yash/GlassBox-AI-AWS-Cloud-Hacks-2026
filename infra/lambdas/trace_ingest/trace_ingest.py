"""traceIngestHandler — POST /trace

Validates incoming manager trace, invokes Judge Agent (Bedrock Agent + KB),
writes enriched trace to DynamoDB, triggers Step Functions on critical events.
Contract A response: { trace_id, judge_score, severity, regulations_cited }
"""

import json
import os
import re
import time
import uuid
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")
traces_table = dynamodb.Table(os.environ["TRACES_TABLE"])
agent_client = boto3.client("bedrock-agent-runtime", region_name="us-west-2")
sfn_client = boto3.client("stepfunctions", region_name="us-west-2")
sns_client = boto3.client("sns", region_name="us-west-2")

AGENT_ID = os.environ.get("BEDROCK_AGENT_ID", "")
AGENT_ALIAS_ID = os.environ.get("BEDROCK_AGENT_ALIAS_ID", "")
CRITICAL_SM_ARN = os.environ.get("CRITICAL_SM_ARN", "")
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "")


def handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return _response(400, {"error": "Invalid JSON"})

    trace_id = f"trc_{uuid.uuid4().hex[:16]}"
    body["trace_id"] = trace_id

    # Invoke Judge Agent
    judge = _invoke_judge(body)
    body["judge_score"] = judge["judge_score"]
    body["judge_reasoning"] = judge["judge_reasoning"]
    body["severity"] = judge["severity"]
    body["regulations_cited"] = judge["regulations_cited"]

    # Write to DynamoDB
    _write_trace(body)

    # If critical → trigger Step Functions + SNS
    if judge["severity"] == "critical":
        _trigger_critical_path(body)

    # Contract A response (flat, not nested)
    return _response(200, {
        "trace_id": trace_id,
        "judge_score": judge["judge_score"],
        "severity": judge["severity"],
        "regulations_cited": judge["regulations_cited"],
    })


def _invoke_judge(trace: dict) -> dict:
    """Call the Judge Agent via Bedrock Agent Runtime."""
    if not AGENT_ID or not AGENT_ALIAS_ID:
        return _empty_verdict()

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
        response = agent_client.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=AGENT_ALIAS_ID,
            sessionId=trace.get("session_id", "default"),
            inputText=prompt,
        )

        completion = ""
        for event in response.get("completion", []):
            chunk = event.get("chunk", {})
            if "bytes" in chunk:
                completion += chunk["bytes"].decode("utf-8")

        return _parse_judge(completion)

    except Exception as e:
        print(f"Judge invocation failed: {e}")
        return _empty_verdict()


def _parse_judge(text: str) -> dict:
    """Parse judge fields from agent response text."""
    if not text:
        return _empty_verdict()

    result = {
        "judge_score": None,
        "judge_reasoning": text[:500],
        "severity": None,
        "regulations_cited": [],
    }

    lower = text.lower()

    # Extract score
    for pattern in [r'(?:judge_)?score["\s:=]+(\d+)', r'(\d+)\s*/\s*10']:
        match = re.search(pattern, lower)
        if match:
            score = int(match.group(1))
            if 0 <= score <= 10:
                result["judge_score"] = score
                break

    # Severity from score
    score = result["judge_score"]
    if score is not None:
        result["severity"] = "critical" if score <= 3 else "warning" if score <= 6 else "info"
    elif "critical" in lower or "violation" in lower or "unsafe" in lower:
        result["severity"] = "critical"
        result["judge_score"] = 0

    # Extract citations
    for pattern in [r'(NFPA\s*101\s*§[\d.]+)', r'(ASHRAE\s*(?:Standard\s*)?55\s*§?[\d.]*)',
                     r'(ASHRAE\s*(?:Standard\s*)?90\.1\s*§?[\d.]*)', r'(OSHA\s*1910)']:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            code = match.group(1).strip()
            result["regulations_cited"].append({
                "code": code,
                "title": "Safety regulation",
                "excerpt": text[max(0, match.start()-30):match.end()+100].strip()[:200],
            })

    # Enforce: critical must have citations
    if result["severity"] == "critical" and not result["regulations_cited"]:
        if "lighting" in lower:
            result["regulations_cited"].append({
                "code": "NFPA 101 §7.8.1.2",
                "title": "Emergency Lighting",
                "excerpt": "Emergency lighting must remain operational while occupancy exceeds zero.",
            })

    return result


def _empty_verdict():
    return {"judge_score": None, "judge_reasoning": None, "severity": None, "regulations_cited": []}


def _write_trace(trace: dict):
    """Write trace to DynamoDB with Decimal conversion."""
    def convert(obj):
        if isinstance(obj, float):
            return Decimal(str(obj))
        if isinstance(obj, dict):
            return {k: convert(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [convert(i) for i in obj]
        return obj

    traces_table.put_item(Item=convert(trace))


def _trigger_critical_path(trace: dict):
    """Start Step Functions execution + publish to SNS for critical events."""
    if CRITICAL_SM_ARN:
        try:
            sfn_client.start_execution(
                stateMachineArn=CRITICAL_SM_ARN,
                input=json.dumps(trace, default=str),
            )
        except Exception as e:
            print(f"Step Functions trigger failed: {e}")

    if SNS_TOPIC_ARN:
        try:
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"CRITICAL: {trace.get('stadium_id')} - {trace.get('action', {}).get('tool')}",
                Message=json.dumps(trace, default=str, indent=2),
            )
        except Exception as e:
            print(f"SNS publish failed: {e}")


def _response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body, default=str),
    }
