"""wsDisconnectHandler — WebSocket $disconnect

Removes connection_id from DynamoDB.
"""

import os

import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["WS_CONNECTIONS_TABLE"])


def handler(event, context):
    connection_id = event["requestContext"]["connectionId"]
    table.delete_item(Key={"connection_id": connection_id})
    return {"statusCode": 200, "body": "Disconnected"}
