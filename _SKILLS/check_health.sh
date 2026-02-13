#!/usr/bin/env bash
# SKILL: check_health - Ping tous les conteneurs Alfred OS
set -e

echo "=== Alfred OS Health Check ==="

# Check DB
echo -n "[DB]       "
if docker exec alfred-db pg_isready -U alfred > /dev/null 2>&1; then
  echo "OK"
else
  echo "FAIL"
fi

# Check Backend
echo -n "[Backend]  "
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null || echo "000")
if [ "$BACKEND" = "200" ]; then
  echo "OK (HTTP 200)"
else
  echo "FAIL (HTTP $BACKEND)"
fi

# Check Frontend
echo -n "[Frontend] "
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND" = "200" ]; then
  echo "OK (HTTP 200)"
else
  echo "FAIL (HTTP $FRONTEND)"
fi

echo "=== Done ==="
