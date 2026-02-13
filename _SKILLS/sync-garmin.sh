#!/usr/bin/env bash
# SKILL: sync-garmin - Sync Garmin data from alfred-dashboard into Alfred OS
set -e

ALFRED_API="${ALFRED_API_URL:-http://localhost:8080}"
GARMIN_JSON="/home/raphael56/alfred-dashboard/data/garmin.json"
USAGE_JSON="/home/raphael56/alfred-dashboard/data/usage.json"
GARMIN_SYNC="/home/raphael56/alfred-dashboard/scripts/garmin-sync.py"

echo "=== Alfred OS Garmin Sync ==="

# Step 1: Run garmin-sync.py to refresh data (optional, skip if --no-fetch)
if [[ "$1" != "--no-fetch" ]]; then
    echo "[1/3] Fetching fresh Garmin data..."
    if python3 "$GARMIN_SYNC" --dry-run 2>&1; then
        echo "  OK - Garmin data refreshed"
    else
        echo "  WARN - Garmin fetch failed, using existing data"
    fi
else
    echo "[1/3] Skipping fetch (--no-fetch)"
fi

# Step 2: Push garmin.json to Alfred OS
echo "[2/3] Syncing Garmin data to Alfred OS..."
if [ -f "$GARMIN_JSON" ]; then
    RESULT=$(curl -s -X POST "$ALFRED_API/sync/garmin" \
        -H "Content-Type: application/json" \
        -d @"$GARMIN_JSON")
    echo "  $RESULT"
else
    echo "  SKIP - $GARMIN_JSON not found"
fi

# Step 3: Push usage.json to Alfred OS
echo "[3/3] Syncing OpenClaw usage to Alfred OS..."
if [ -f "$USAGE_JSON" ]; then
    RESULT=$(curl -s -X POST "$ALFRED_API/sync/usage" \
        -H "Content-Type: application/json" \
        -d @"$USAGE_JSON")
    echo "  $RESULT"
else
    echo "  SKIP - $USAGE_JSON not found"
fi

echo "=== Done ==="
