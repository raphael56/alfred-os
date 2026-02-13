#!/usr/bin/env bash
# SKILL: collect-system - Collect system metrics (CPU, memory, disk) into Alfred OS
set -e

ALFRED_API="${ALFRED_API_URL:-http://localhost:8080}"

RESULT=$(curl -s -X POST "$ALFRED_API/metrics/system")
echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
