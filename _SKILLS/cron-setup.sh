#!/usr/bin/env bash
# SKILL: cron-setup - Install systemd timers for Alfred OS periodic tasks
# Runs: garmin refresh every 30min, system metrics every 5min
set -e

ALFRED_API="${ALFRED_API_URL:-http://localhost:8080}"

echo "=== Alfred OS Cron Setup ==="

# Create systemd user directory
mkdir -p ~/.config/systemd/user

# --- Garmin Sync Timer (every 30 min) ---
cat > ~/.config/systemd/user/alfred-garmin-sync.service << 'UNIT'
[Unit]
Description=Alfred OS Garmin Sync

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -s -X POST http://localhost:8080/sync/garmin/refresh
UNIT

cat > ~/.config/systemd/user/alfred-garmin-sync.timer << 'TIMER'
[Unit]
Description=Alfred OS Garmin Sync Timer

[Timer]
OnBootSec=2min
OnUnitActiveSec=30min
Persistent=true

[Install]
WantedBy=timers.target
TIMER

# --- System Metrics Timer (every 5 min) ---
cat > ~/.config/systemd/user/alfred-system-metrics.service << 'UNIT'
[Unit]
Description=Alfred OS System Metrics Collection

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -s -X POST http://localhost:8080/metrics/system
UNIT

cat > ~/.config/systemd/user/alfred-system-metrics.timer << 'TIMER'
[Unit]
Description=Alfred OS System Metrics Timer

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
Persistent=true

[Install]
WantedBy=timers.target
TIMER

# Enable and start
systemctl --user daemon-reload
systemctl --user enable --now alfred-garmin-sync.timer
systemctl --user enable --now alfred-system-metrics.timer

echo ""
echo "Timers installed:"
systemctl --user list-timers alfred-*
echo ""
echo "=== Done ==="
