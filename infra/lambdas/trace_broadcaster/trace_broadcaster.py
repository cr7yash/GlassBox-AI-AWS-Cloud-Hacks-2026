"""traceBroadcaster — DynamoDB Stream → WebSocket push

Reads new trace records from the stream and pushes them to all
WebSocket connections subscribed to that session_id.
"""

import json
import os
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")
connections_table = dynamodb.Table(os.environ["WS_CONNECTIONS_TABLE"])

WS_ENDPOINT = os.environ.get("WS_ENDPOINT", "")


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)


def handler(event, context):
    if not WS_ENDPOINT:
        print("WS_ENDPOINT not configured, skipping broadcast")
        return

    apigw = boto3.client(
        "apigatewaymanagementapi",
        endpoint_url=WS_ENDPOINT,
    )

    for record in event.get("Records", []):
        if record["eventName"] != "INSERT":
            continue

        # Parse the new trace from the stream
        new_image = record["dynamodb"]["NewImage"]
        trace = deserialize(new_image)
        session_id = trace.get("session_id", "")

        if not session_id:
            continue

        # Find all connections for this session
        resp = connections_table.query(
            IndexName="session-index",
            KeyConditionExpression=boto3.dynamodb.conditions.Key("session_id").eq(session_id),
        )

        message = json.dumps({"type": "trace", "payload": trace}, cls=DecimalEncoder)

        # Push to each connection
        stale = []
        for conn in resp.get("Items", []):
            cid = conn["connection_id"]
            try:
                apigw.post_to_connection(
                    ConnectionId=cid,
                    Data=message.encode("utf-8"),
                )
            except apigw.exceptions.GoneException:
                stale.append(cid)
            except Exception as e:
                print(f"Failed to post to {cid}: {e}")

        # Clean up stale connections
        for cid in stale:
            connections_table.delete_item(Key={"connection_id": cid})


def deserialize(dynamo_item: dict) -> dict:
    """Convert DynamoDB stream format to plain dict."""
    deserializer = boto3.dynamodb.types.TypeDeserializer()
    return {k: deserializer.deserialize(v) for k, v in dynamo_item.items()}
