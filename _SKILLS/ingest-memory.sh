#!/usr/bin/env bash
# SKILL: ingest-memory - Ingest all _MEMORY/*.md files into the knowledge base
set -e

ALFRED_API="${ALFRED_API_URL:-http://localhost:8080}"
MEMORY_DIR="${1:-/home/raphael56/alfred-os/_MEMORY}"

echo "=== Ingesting _MEMORY files into Knowledge Base ==="

for f in "$MEMORY_DIR"/*.md; do
  [ -f "$f" ] || continue
  FILENAME=$(basename "$f" .md)
  CONTENT=$(cat "$f" | sed 's/"/\\"/g' | tr '\n' ' ')

  RESULT=$(curl -s -X POST "$ALFRED_API/knowledge/ingest" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$CONTENT\",\"source\":\"_MEMORY/$FILENAME\",\"chunk_size\":400}")

  ENTRIES=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('entries',0))" 2>/dev/null || echo "?")
  echo "  $FILENAME.md -> $ENTRIES chunks"
done

echo ""
echo "=== Stats ==="
curl -s "$ALFRED_API/knowledge/stats" | python3 -m json.tool 2>/dev/null
