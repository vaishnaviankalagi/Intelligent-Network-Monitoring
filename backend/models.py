
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    func
)

from database import Base


class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    alert_id = Column(String(100), unique=True, nullable=False)

    timestamp = Column(DateTime, server_default=func.now())

    alert_type = Column(String(100))

    source_ip = Column(String(45))

    destination_ip = Column(String(45))

    ports_detected = Column(Text)

    port_count = Column(Integer, default=0)

    severity = Column(String(30))

    status = Column(String(30), default="New")

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )
