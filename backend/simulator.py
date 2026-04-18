import requests
import json
import random
import time
import boto3

client = boto3.client("bedrock-runtime", region_name="us-east-1")

API_URL = "https://YOUR_API_GATEWAY_URL/log"

def call_ai(temp, people, price):

    prompt = f"""
You are a stadium manager.

Temp: {temp}
People: {people}
Energy price: {price}

Return JSON:
{
  "decision": "...",
  "reasoning": "...",
  "judge_score": number 1-10
}
"""

    response = client.invoke_model(
        modelId="amazon.nova-lite-v1:0",
        body=json.dumps({
            "messages": [{
                "role": "user",
                "content": [{"text": prompt}]
            }],
            "inferenceConfig": {
                "maxTokens": 200,
                "temperature": 0.3
            }
        })
    )

    result = json.loads(response["body"].read())
    text = result["output"]["message"]["content"][0]["text"]

    return json.loads(text)


while True:

    temp = random.randint(70, 120)
    people = random.randint(1000, 60000)
    price = round(random.uniform(0.1, 0.5), 2)

    ai_result = call_ai(temp, people, price)

    payload = {
        "temp": temp,
        "decision": ai_result["decision"],
        "reasoning": ai_result["reasoning"],
        "judge_score": ai_result["judge_score"]
    }

    requests.post(API_URL, json=payload)

    print("Sent:", payload)

    time.sleep(3)