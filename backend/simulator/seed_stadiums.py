"""One-shot script to seed the 5 stadium profiles into DynamoDB (§6.2).

Usage:
    python -m simulator.seed_stadiums [--table stadiums] [--region us-west-2]
"""

from __future__ import annotations

import argparse
from decimal import Decimal

import boto3

from simulator.stadiums import STADIUMS


def _convert_floats(obj):
    """DynamoDB doesn't accept Python floats — convert to Decimal."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _convert_floats(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_floats(i) for i in obj]
    return obj


def seed(table_name: str = "glassbox-stadiums", region: str = "us-west-2") -> None:
    dynamodb = boto3.resource("dynamodb", region_name=region)
    table = dynamodb.Table(table_name)

    for stadium_id, config in STADIUMS.items():
        item = _convert_floats(config.model_dump())
        table.put_item(Item=item)
        print(f"  ✓ Seeded {stadium_id} ({config.name})")

    print(f"\nDone — {len(STADIUMS)} stadiums written to {table_name}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed stadium profiles into DynamoDB")
    parser.add_argument("--table", default="glassbox-stadiums", help="DynamoDB table name")
    parser.add_argument("--region", default="us-west-2", help="AWS region")
    args = parser.parse_args()

    seed(table_name=args.table, region=args.region)


if __name__ == "__main__":
    main()
