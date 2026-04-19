"""pollyAlertHandler — Step Functions task

Synthesizes voice alert via Polly, uploads mp3 to S3,
updates trace record, broadcasts critical_alert to WebSocket clients.
"""

import json
import os
from decimal import Decimal

import boto3

polly = boto3.client("polly", region_name="us-west-2")
s3 = boto3.client("s3", region_name="us-west-2")
dynamodb = boto3.resource("dynamodb")
traces_table = dynamodb.Table(os.environ.get("TRACES_TABLE", "glassbox-traces"))
connections_table = dynamodb.Table(os.environ.get("WS_CONNECTIONS_TABLE", "glassbox-ws-connections"))

AUDIO_BUCKET = os.environ.get("AUDIO_BUCKET", "")
WS_ENDPOINT = os.environ.get("WS_ENDPOINT", "")
VOICE_ID = "Matthew"


def handler(event, context):
    trace = event if isinstance(event, dict) else json.loads(event)

    # Handle Step Functions Lambda invoke wrapper
    if "Payload" in trace:
        trace = trace["Payload"]

    trace_id = trace.get("trace_id", "unknown")
    reasoning = trace.get("judge_reasoning", "Safety violation detected.")
    stadium = trace.get("stadium_id", "stadium")

    # Synthesize speech
    summary = f"Alert. Safety violation detected at {stadium}. {reasoning[:200]}"

    try:
        response = polly.synthesize_speech(
            Text=summary,
            OutputFormat="mp3",
            VoiceId=VOICE_ID,
            Engine="neural",
        )

        audio_stream = response["AudioStream"].read()

        # Upload to S3
        key = f"alerts/{trace_id}.mp3"
        s3.put_object(
            Bucket=AUDIO_BUCKET,
            Key=key,
            Body=audio_stream,
            ContentType="audio/mpeg",
        )

        # Generate presigned URL (valid for 1 hour)
        audio_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": AUDIO_BUCKET, "Key": key},
            ExpiresIn=3600,
        )

        # Update trace record
        traces_table.update_item(
            Key={"trace_id": trace_id},
            UpdateExpression="SET polly_audio_url = :url",
            ExpressionAttributeValues={":url": audio_url},
        )

        # Broadcast critical_alert to WebSocket clients
        _broadcast(trace, audio_url, summary)

        return {"statusCode": 200, "audio_url": audio_url}

    except Exception as e:
        print(f"Polly alert failed: {e}")
        return {"statusCode": 500, "error": str(e)}


def _broadcast(trace: dict, audio_url: str, summary: str):
    """Push critical_alert to all WebSocket connections for this session."""
    if not WS_ENDPOINT:
        return

    session_id = trace.get("session_id", "")
    if not session_id:
        return

    apigw = boto3.client("apigatewaymanagementapi", endpoint_url=WS_ENDPOINT)

    resp = connections_table.query(
        IndexName="session-index",
        KeyConditionExpression=boto3.dynamodb.conditions.Key("session_id").eq(session_id),
    )

    message = json.dumps({
        "type": "critical_alert",
        "payload": {
            "trace_id": trace.get("trace_id"),
            "audio_url": audio_url,
            "summary": summary,
        },
    })

    for conn in resp.get("Items", []):
        try:
            apigw.post_to_connection(
                ConnectionId=conn["connection_id"],
                Data=message.encode("utf-8"),
            )
        except Exception:
            pass
