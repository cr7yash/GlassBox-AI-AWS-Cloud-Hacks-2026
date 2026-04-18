"""AWS Secrets Manager helper (§7.6 pattern).

Retrieves and caches secrets so we only hit the API once per process lifetime.
Falls back to environment variables for local dev without Secrets Manager.
"""

from __future__ import annotations

import json
import os
from typing import Any

import boto3
from botocore.exceptions import ClientError

_cache: dict[str, Any] = {}

_sm_client = None


def _client():
    global _sm_client
    if _sm_client is None:
        _sm_client = boto3.client(
            "secretsmanager",
            region_name=os.getenv("AWS_REGION", "us-west-2"),
        )
    return _sm_client


def get_secret(name: str) -> dict[str, Any]:
    """Return parsed JSON for the given Secrets Manager secret *name*.

    Results are cached in-process.  If Secrets Manager is unreachable (e.g.
    local dev without AWS creds), falls back to an env-var override:
    ``GLASSBOX_SECRET_<upper-snake-name>`` containing raw JSON.
    """
    if name in _cache:
        return _cache[name]

    # Try Secrets Manager first
    try:
        resp = _client().get_secret_value(SecretId=name)
        value = json.loads(resp["SecretString"])
        _cache[name] = value
        return value
    except (ClientError, Exception):
        pass

    # Fallback: env var  e.g. glassbox/api-gateway-key → GLASSBOX_SECRET_API_GATEWAY_KEY
    env_key = "GLASSBOX_SECRET_" + name.split("/")[-1].upper().replace("-", "_")
    raw = os.getenv(env_key, "{}")
    value = json.loads(raw)
    _cache[name] = value
    return value


def get_api_key() -> str:
    """Convenience: return the API Gateway key string."""
    secret = get_secret("glassbox/api-gateway-key")
    # The secret may be stored as {"key": "..."} or as a plain string wrapper
    if isinstance(secret, dict):
        return secret.get("key", secret.get("api_key", ""))
    return str(secret)


def get_bedrock_config() -> dict[str, str]:
    """Return guardrail_id, guardrail_version, agent_id, agent_alias_id."""
    return get_secret("glassbox/bedrock-config")
