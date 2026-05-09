from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import sys
sys.path.append("..")
from models.database import get_db, Transaction, Alert

router = APIRouter()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_tx = db.query(Transaction).count()
    flagged_tx = db.query(Transaction).filter(Transaction.status == "Suspicious").count()
    open_alerts = db.query(Alert).filter(Alert.status == "Open").count()
    total_volume = db.query(func.sum(Transaction.amount)).scalar() or 0

    high_risk = db.query(Transaction).filter(Transaction.risk_score >= 0.5).all()
    high_risk_entities = set()
    for t in high_risk:
        high_risk_entities.add(t.sender)
        high_risk_entities.add(t.receiver)

    critical = db.query(Transaction).filter(Transaction.risk_score >= 0.75).count()
    high = db.query(Transaction).filter(Transaction.risk_score >= 0.5, Transaction.risk_score < 0.75).count()
    medium = db.query(Transaction).filter(Transaction.risk_score >= 0.25, Transaction.risk_score < 0.5).count()
    low = db.query(Transaction).filter(Transaction.risk_score < 0.25).count()

    recent = db.query(Transaction).order_by(Transaction.id.desc()).limit(5).all()

    return {
        "total_transactions": total_tx,
        "flagged_transactions": flagged_tx,
        "open_alerts": open_alerts,
        "high_risk_entities": len(high_risk_entities),
        "total_volume": round(total_volume, 2),
        "risk_distribution": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low
        },
        "recent_transactions": [
            {
                "transaction_id": t.transaction_id,
                "sender": t.sender,
                "receiver": t.receiver,
                "amount": t.amount,
                "risk_score": t.risk_score,
                "status": t.status,
            }
            for t in recent
        ]
    }
