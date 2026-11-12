
import json
from datetime import datetime

from database import SessionLocal
from models import SecurityAlert




def save_security_alert(alert_data):
    """Save security alerts while preventing repeated ML alerts."""

    db = SessionLocal()

    try:
        ports = alert_data["ports_detected"]

        # Apply time-window deduplication only to ML alerts
        if alert_data["alert_type"] == "ML Detected Network Anomaly":

            time_limit = datetime.now() - timedelta(minutes=5)

            recent_alerts = (
                db.query(SecurityAlert)
                .filter(
                    SecurityAlert.alert_type ==
                    "ML Detected Network Anomaly",
                    SecurityAlert.source_ip ==
                    alert_data["source_ip"],
                    SecurityAlert.destination_ip ==
                    alert_data["destination_ip"],
                    SecurityAlert.timestamp >= time_limit
                )
                .all()
            )

            for existing_alert in recent_alerts:

                try:
                    existing_ports = json.loads(
                        existing_alert.ports_detected
                    )
                except (TypeError, json.JSONDecodeError):
                    existing_ports = []

                if existing_ports == ports:
                    print(
                        "Duplicate ML alert skipped:",
                        existing_alert.alert_id
                    )
                    return existing_alert.alert_id

        # Check exact alert ID for all alert types
        existing_alert = (
            db.query(SecurityAlert)
            .filter(
                SecurityAlert.alert_id == alert_data["alert_id"]
            )
            .first()
        )

        if existing_alert:
            return existing_alert.alert_id

        alert = SecurityAlert(
            alert_id=alert_data["alert_id"],
            timestamp=datetime.strptime(
                alert_data["timestamp"],
                "%Y-%m-%d %H:%M:%S"
            ),
            alert_type=alert_data["alert_type"],
            source_ip=alert_data["source_ip"],
            destination_ip=alert_data["destination_ip"],
            ports_detected=json.dumps(ports),
            port_count=alert_data["port_count"],
            severity=alert_data["severity"],
            status=alert_data["status"]
        )

        db.add(alert)
        db.commit()

        print("Security alert saved to MySQL:", alert.alert_id)

        return alert.alert_id

    except Exception as error:
        db.rollback()
        print("MySQL alert save error:", error)
        return None

    finally:
        db.close()




def get_saved_security_alerts():
    """Retrieve security alerts from MySQL."""

    db = SessionLocal()

    try:
        alerts = (
            db.query(SecurityAlert)
            .order_by(SecurityAlert.id.desc())
            .all()
        )

        result = []

        for alert in alerts:
            result.append({
                "alert_id": alert.alert_id,
                "timestamp": (
                    alert.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                    if alert.timestamp else None
                ),
                "alert_type": alert.alert_type,
                "source_ip": alert.source_ip,
                "destination_ip": alert.destination_ip,
                "ports_detected": (
                    json.loads(alert.ports_detected)
                    if alert.ports_detected else []
                ),
                "port_count": alert.port_count,
                "severity": alert.severity,
                "status": alert.status,
                "updated_at": (
                    alert.updated_at.strftime("%Y-%m-%d %H:%M:%S")
                    if alert.updated_at else None
                )
            })

        return result

    finally:
        db.close()


def update_saved_alert_status(alert_id, new_status):
    """Update an alert status in MySQL."""

    db = SessionLocal()

    try:
        alert = (
            db.query(SecurityAlert)
            .filter(SecurityAlert.alert_id == alert_id)
            .first()
        )

        if alert is None:
            return None

        alert.status = new_status
        db.commit()
        db.refresh(alert)

        return {
            "alert_id": alert.alert_id,
            "status": alert.status,
            "updated_at": (
                alert.updated_at.strftime("%Y-%m-%d %H:%M:%S")
                if alert.updated_at else None
            )
        }

    except Exception as error:
        db.rollback()
        print("MySQL alert update error:", error)
        return None

    finally:
        db.close()
