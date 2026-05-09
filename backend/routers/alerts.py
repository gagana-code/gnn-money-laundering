from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import sys
sys.path.append("..")
from models.database import get_db, Alert

router = APIRouter()

@router.get("/")
def get_alerts(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if risk_level:
        query = query.filter(Alert.risk_level == risk_level)
    query = query.order_by(Alert.risk_score.desc())
    alerts = query.all()
    return {
        "total": len(alerts),
        "alerts": [
            {
                "id": a.id,
                "alert_id": a.alert_id,
                "transaction_id": a.transaction_id,
                "entity": a.entity,
                "risk_score": a.risk_score,
                "risk_level": a.risk_level,
                "reason": a.reason,
                "status": a.status,
                "created_at": str(a.created_at),
            }
            for a in alerts
        ]
    }

@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "Closed"
    db.commit()
    return {"message": "Alert resolved", "alert_id": alert_id}
