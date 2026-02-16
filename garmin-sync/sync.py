"""
Garmin Connect → Alfred OS sync sidecar.
Fetches fresh data from Garmin API every SYNC_INTERVAL minutes
and POSTs it to the backend /sync/garmin endpoint.
"""

import os
import sys
import time
import json
import logging
from datetime import datetime

import requests
from garminconnect import Garmin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [garmin-sync] %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("garmin-sync")

GARMIN_EMAIL = os.environ.get("GARMIN_EMAIL", "")
GARMIN_PASSWORD = os.environ.get("GARMIN_PASSWORD", "")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://backend:8080")
SYNC_INTERVAL = int(os.environ.get("SYNC_INTERVAL", "30"))  # minutes

MAX_RETRIES = 3
RETRY_DELAY = 30  # seconds


def garmin_login() -> Garmin:
    """Login to Garmin Connect and return client."""
    log.info("Logging in to Garmin Connect as %s", GARMIN_EMAIL)
    client = Garmin(GARMIN_EMAIL, GARMIN_PASSWORD)
    client.login()
    log.info("Login successful")
    return client


def fetch_garmin_data(client: Garmin) -> dict:
    """Fetch all relevant data from Garmin Connect API."""
    today = datetime.now().strftime("%Y-%m-%d")
    data = {"lastUpdate": datetime.now().isoformat()}

    # Daily stats
    try:
        stats = client.get_stats(today)
        data["today"] = {
            "steps": stats.get("totalSteps", 0),
            "distance": round(stats.get("totalDistanceMeters", 0) / 1000, 2),
            "calories": stats.get("totalKilocalories", 0),
            "stress": stats.get("averageStressLevel", 0),
        }
    except Exception as e:
        log.warning("Failed to fetch daily stats: %s", e)

    # Heart rate
    try:
        hr = client.get_heart_rates(today)
        data["heartRate"] = {
            "resting": hr.get("restingHeartRate", 0),
            "max": hr.get("maxHeartRate", 0),
        }
    except Exception as e:
        log.warning("Failed to fetch heart rate: %s", e)

    # Sleep
    try:
        sleep = client.get_sleep_data(today)
        duration_seconds = sleep.get("dailySleepDTO", {}).get("sleepTimeSeconds", 0)
        score = sleep.get("dailySleepDTO", {}).get("sleepScores", {}).get("overall", {}).get("value", 0)
        data["sleep"] = {
            "duration": round(duration_seconds / 3600, 1) if duration_seconds else 0,
            "score": score,
        }
    except Exception as e:
        log.warning("Failed to fetch sleep data: %s", e)

    # Training status (VO2max, training load)
    try:
        ts = client.get_training_status(today)
        if ts:
            data["fitness"] = {
                "vo2max": ts.get("vo2MaxValue", 0),
            }
            data["trainingLoad"] = {
                "aerobicLow": ts.get("lowAerobicTrainingLoadBalanceRounded", 0),
                "aerobicHigh": ts.get("highAerobicTrainingLoadBalanceRounded", 0),
                "anaerobic": ts.get("anaerobicTrainingLoadBalanceRounded", 0),
                "total": ts.get("trainingLoadBalance", 0),
            }
    except Exception as e:
        log.warning("Failed to fetch training status: %s", e)

    # Activities (last 10)
    try:
        acts = client.get_activities(0, 10)
        activities = []
        for a in acts:
            activities.append({
                "name": a.get("activityName", ""),
                "type": a.get("activityType", {}).get("typeKey", "other"),
                "date": a.get("startTimeLocal", "")[:10],
                "distance": round(a.get("distance", 0) / 1000, 2),
                "duration": round(a.get("duration", 0) / 60, 1),
                "avgHR": a.get("averageHR", 0),
                "avgPace": None,
                "calories": a.get("calories", 0),
                "elevation": a.get("elevationGain", 0),
            })
        data["activities"] = activities
    except Exception as e:
        log.warning("Failed to fetch activities: %s", e)

    # Body composition
    try:
        body = client.get_body_composition(today)
        if body:
            data["body"] = {
                "weight": body.get("weight", 0) / 1000 if body.get("weight") else None,
                "bmi": body.get("bmi"),
                "bodyFat": body.get("bodyFatPercentage"),
                "muscleMass": body.get("muscleMass", 0) / 1000 if body.get("muscleMass") else None,
            }
    except Exception as e:
        log.warning("Failed to fetch body composition: %s", e)

    # Weekly stats (approximate from activities)
    try:
        week_acts = client.get_activities(0, 50)
        from datetime import timedelta
        week_start = datetime.now() - timedelta(days=7)
        week_km = 0.0
        week_runs = 0
        week_time = 0.0
        for a in week_acts:
            act_date = a.get("startTimeLocal", "")[:10]
            if act_date >= week_start.strftime("%Y-%m-%d"):
                week_km += a.get("distance", 0) / 1000
                week_time += a.get("duration", 0) / 60
                if a.get("activityType", {}).get("typeKey", "") == "running":
                    week_runs += 1
        data["week"] = {
            "km": round(week_km, 1),
            "runs": week_runs,
            "time": round(week_time, 0),
            "target": 60,
        }
    except Exception as e:
        log.warning("Failed to compute weekly stats: %s", e)

    return data


def post_to_backend(data: dict) -> bool:
    """POST Garmin data to the backend sync endpoint."""
    url = f"{BACKEND_URL}/sync/garmin"
    try:
        resp = requests.post(url, json=data, timeout=30)
        resp.raise_for_status()
        result = resp.json()
        log.info("Synced to backend: %s", result)
        return True
    except requests.RequestException as e:
        log.error("Failed to POST to backend: %s", e)
        return False


def sync_cycle(client: Garmin) -> bool:
    """Run one full sync cycle: fetch from Garmin, post to backend."""
    log.info("Starting sync cycle...")
    try:
        data = fetch_garmin_data(client)
        metrics_count = sum(1 for k in ["today", "heartRate", "sleep", "fitness",
                                         "trainingLoad", "activities", "week", "body"]
                           if k in data)
        log.info("Fetched %d metric groups from Garmin", metrics_count)
        return post_to_backend(data)
    except Exception as e:
        log.error("Sync cycle failed: %s", e)
        return False


def main():
    if not GARMIN_EMAIL or not GARMIN_PASSWORD:
        log.error("GARMIN_EMAIL and GARMIN_PASSWORD must be set")
        sys.exit(1)

    log.info("Garmin Sync sidecar starting (interval=%d min)", SYNC_INTERVAL)

    client = None
    retry_count = 0

    while True:
        # Login if needed
        if client is None:
            try:
                client = garmin_login()
                retry_count = 0
            except Exception as e:
                retry_count += 1
                log.error("Login failed (attempt %d/%d): %s", retry_count, MAX_RETRIES, e)
                if retry_count >= MAX_RETRIES:
                    log.error("Max retries reached, waiting %d minutes before next attempt", SYNC_INTERVAL)
                    time.sleep(SYNC_INTERVAL * 60)
                    retry_count = 0
                else:
                    time.sleep(RETRY_DELAY)
                continue

        # Run sync
        success = sync_cycle(client)
        if not success:
            # Session may have expired, force re-login next cycle
            client = None

        log.info("Next sync in %d minutes", SYNC_INTERVAL)
        time.sleep(SYNC_INTERVAL * 60)


if __name__ == "__main__":
    main()
