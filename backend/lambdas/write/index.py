import json
import boto3
import uuid
import time
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('AgentLogs')

def lambda_handler(event, context):
    """
    Write log entry to DynamoDB
    Expected payload:
    {
        "temp": number,
        "people": number,
        "energy_price": number,
        "decision": string,
        "reasoning": string,
        "judge_score": number
    }
    """
    try:
        # Parse the request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Generate log ID and timestamp
        log_id = str(uuid.uuid4())
        timestamp = int(time.time() * 1000)  # milliseconds
        
        # Create the item to write
        item = {
            'logId': log_id,
            'timestamp': timestamp,
            'createdAt': datetime.utcnow().isoformat(),
            'temp': body.get('temp'),
            'people': body.get('people'),
            'energy_price': body.get('energy_price'),
            'decision': body.get('decision'),
            'reasoning': body.get('reasoning'),
            'judge_score': int(body.get('judge_score', 0)),
            'expirationTime': int(time.time()) + (7 * 24 * 60 * 60)  # 7 days TTL
        }
        
        # Write to DynamoDB
        table.put_item(Item=item)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'logId': log_id,
                'message': 'Log entry created successfully'
            })
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
