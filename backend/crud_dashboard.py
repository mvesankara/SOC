from sqlalchemy import select, func, text
from sqlalchemy.sql import and_
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from .database import database
from .models import Incident, StatutIncident, CriticiteLevel # Assuming enums are accessible

async def get_dashboard_stats() -> Dict[str, Any]:
    """
    Calculates various statistics for the dashboard.
    """
    now = datetime.now(timezone.utc)
    last_24_hours_start = now - timedelta(hours=24)
    seven_days_ago = now - timedelta(days=7)

    # --- Metric Calculations ---

    # 1. Open Incidents (Ouvert or En cours)
    open_statuses = [StatutIncident.OUVERT.value, StatutIncident.EN_COURS.value]
    query_open_incidents = select(func.count(Incident.__table__.c.id))\
        .where(Incident.__table__.c.statut.in_(open_statuses))
    open_incidents_count = await database.fetch_val(query_open_incidents) or 0

    # 2. Closed Incidents in the last 24 hours (Résolu or Fermé)
    closed_statuses = [StatutIncident.RESOLU.value, StatutIncident.FERME.value]
    # Assuming 'timestamp' is creation time. We'd need an 'updated_at' or 'closed_at' for true "closed in last 24h"
    # For now, let's count incidents CREATED in last 24h that are NOW closed. This is not ideal.
    # A better metric would be "resolved_in_last_24h" if we had a resolved_at timestamp.
    # Let's count incidents whose status is closed AND were created in the last 24h (as a proxy)
    query_closed_last_24h = select(func.count(Incident.__table__.c.id))\
        .where(and_(
            Incident.__table__.c.statut.in_(closed_statuses),
            Incident.__table__.c.timestamp >= last_24_hours_start
        ))
    closed_incidents_last_24h_count = await database.fetch_val(query_closed_last_24h) or 0

    # 3. New Incidents in the last 24 hours
    query_new_last_24h = select(func.count(Incident.__table__.c.id))\
        .where(Incident.__table__.c.timestamp >= last_24_hours_start)
    new_incidents_last_24h_count = await database.fetch_val(query_new_last_24h) or 0

    # 4. Critical Open Incidents
    query_critical_open = select(func.count(Incident.__table__.c.id))\
        .where(and_(
            Incident.__table__.c.statut.in_(open_statuses),
            Incident.__table__.c.criticite == CriticiteLevel.CRITIQUE.value
        ))
    critical_open_incidents_count = await database.fetch_val(query_critical_open) or 0

    # 5. Resolved Incident Percentage (Overall)
    query_total_incidents = select(func.count(Incident.__table__.c.id))
    total_incidents_count = await database.fetch_val(query_total_incidents) or 0

    query_resolved_closed_incidents = select(func.count(Incident.__table__.c.id))\
        .where(Incident.__table__.c.statut.in_(closed_statuses))
    resolved_closed_count = await database.fetch_val(query_resolved_closed_incidents) or 0

    resolved_incident_percentage = (resolved_closed_count / total_incidents_count * 100) if total_incidents_count > 0 else 0

    # 6. Threat Activity Trend (New incidents per day for the last 7 days)
    # This query is more complex and database-dependent for date truncation.
    # Using a raw query for broader compatibility, though SQLAlchemy specific functions exist.
    # Ensure your database supports date functions like DATE() or similar.
    # For PostgreSQL: DATE_TRUNC('day', timestamp)
    # For SQLite: date(timestamp)
    # This example attempts a common approach using DATE() function for SQLite compatibility.
    # For PostgreSQL, you'd use something like: func.date_trunc('day', Incident.__table__.c.timestamp)

    # We need to be careful about the DB dialect here for date functions.
    # Let's use a simpler approach for now by fetching recent incidents and processing in Python,
    # or a more complex SQLAlchemy query if possible.
    # For simplicity in this step, we'll do a placeholder for trend data.
    # A full implementation would require more dialect-specific date handling or fetching raw data.

    trend_labels: List[str] = []
    trend_data: List[int] = []
    # Placeholder:
    # In a real scenario, you would query incidents created in the last 7 days,
    # group them by day, and count.
    # Example: SELECT DATE(timestamp) as day, COUNT(id) FROM incidents WHERE timestamp >= ... GROUP BY day

    # For a more robust solution, consider this SQLAlchemy approach (adjust date func for your DB):
    # stmt = (
    #     select(
    #         func.strftime('%Y-%m-%d', Incident.__table__.c.timestamp).label("day"), # SQLite specific
    #         # func.date(Incident.__table__.c.timestamp).label("day"), # More general SQL
    #         func.count(Incident.__table__.c.id).label("count")
    #     )
    #     .where(Incident.__table__.c.timestamp >= seven_days_ago)
    #     .group_by(text("day")) # text() for label reference in group_by
    #     .order_by(text("day"))
    # )
    # trend_results = await database.fetch_all(stmt)
    # for row in trend_results:
    #     trend_labels.append(row.day)
    #     trend_data.append(row.count)

    # Simplified trend for now: count of incidents per day for the last 7 days
    # This is a bit inefficient as it runs 7 queries, but avoids complex date SQL for now.
    for i in range(6, -1, -1): # From 6 days ago to today
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        query_incidents_on_day = select(func.count(Incident.__table__.c.id))\
            .where(and_(
                Incident.__table__.c.timestamp >= day_start,
                Incident.__table__.c.timestamp < day_end
            ))
        count_on_day = await database.fetch_val(query_incidents_on_day) or 0
        trend_labels.append(day_start.strftime("%a")) # e.g., "Mon"
        trend_data.append(count_on_day)


    return {
        "open_incidents": open_incidents_count,
        "closed_incidents_last_24h": closed_incidents_last_24h_count, # Note: This is CREATED in last 24h AND closed
        "new_incidents_last_24h": new_incidents_last_24h_count,
        "critical_open_incidents": critical_open_incidents_count,
        "resolved_incident_percentage": round(resolved_incident_percentage, 2),
        "threat_activity_trend": {
            "labels": trend_labels, # E.g., ["Mon", "Tue", ..., "Sun"]
            "data": trend_data      # E.g., [5, 8, 3, 10, 7, 9, 6]
        },
        "sla_compliance_percentage": "N/A", # Placeholder
        "avg_response_time_minutes": "N/A"  # Placeholder
    }

# Static system status data (can be moved to config or a simple JSON file later)
# This doesn't involve DB queries, so it's not strictly a "CRUD" function.
# It will be used by the dashboard API endpoint.
def get_static_systems_status() -> List[Dict[str, Any]]:
    return [
        {"name": "Firewall Principal", "status": "Online", "cpu": "45%", "memory": "62%"},
        {"name": "SIEM", "status": "Online", "cpu": "78%", "memory": "71%"},
        {"name": "IDS/IPS", "status": "Warning", "cpu": "89%", "memory": "82%"},
        {"name": "Endpoints", "status": "Online", "monitored": 1247, "issues": 3}
    ]
