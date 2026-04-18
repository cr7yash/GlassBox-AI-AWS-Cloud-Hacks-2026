import json
import boto3

client = boto3.client("bedrock-runtime", region_name="us-east-1")

def lambda_handler(event, context):
    prompt = event.get("prompt", "Give gardening tips")

    response = client.invoke_model(
        modelId="amazon.nova-lite-v1:0",
        body=json.dumps({
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            "inferenceConfig": {
                "maxTokens": 200,
                "temperature": 0.3
            }
        })
    )

    response_body = json.loads(response["body"].read())

    return {
        "statusCode": 200,
        "body": json.dumps(response_body)
    }