import json
import boto3
from boto3.dynamodb.conditions import Key
import time

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('AgentLogs')

def lambda_handler(event, context):
    """
    Read log entries from DynamoDB
    Query parameters:
    - limit: number of items to return (default: 100)
    - logId: optional logId to fetch specific log
    """
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        limit = int(query_params.get('limit', 100))
        log_id = query_params.get('logId')
        
        # If specific logId requested, get that log
        if log_id:
            response = table.query(
                KeyConditionExpression=Key('logId').eq(log_id),
                ScanIndexForward=False,
                Limit=1
            )
            items = response.get('Items', [])
        else:
            # Scan for recent logs (most recent first)
            # Note: For production, consider using a GSI with timestamp as partition key
            response = table.scan(
                Limit=limit
            )
            items = response.get('Items', [])
            # Sort by timestamp descending (most recent first)
            items.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
            items = items[:limit]
        
        # Convert timestamp to readable format
        for item in items:
            if 'timestamp' in item:
                item['timestampMs'] = item['timestamp']
                item['timestamp'] = int(item['timestamp'])
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'count': len(items),
                'logs': items
            }, default=str)
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
