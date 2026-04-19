"""wsConnectHandler — WebSocket $connect

Stores connection_id + session_id in DynamoDB.
"""

import json
import os
import time

import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["WS_CONNECTIONS_TABLE"])


def handler(event, context):
    connection_id = event["requestContext"]["connectionId"]
    session_id = event.get("queryStringParameters", {}).get("session_id", "unknown")

    table.put_item(Item={
        "connection_id": connection_id,
        "session_id": session_id,
        "connected_at": int(time.time()),
        "ttl": int(time.time()) + 86400,  # 24h TTL
    })

    return {"statusCode": 200, "body": "Connected"}
