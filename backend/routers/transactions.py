from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import sys
sys.path.append("..")
from models.database import get_db, Transaction

router = APIRouter()

@router.get("/")
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=200),
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "risk_score",
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)
    if status:
        query = query.filter(Transaction.status == status)
    if search:
        query = query.filter(
            Transaction.sender.contains(search) |
            Transaction.receiver.contains(search) |
            Transaction.transaction_id.contains(search)
        )
    if sort_by == "risk_score":
        query = query.order_by(Transaction.risk_score.desc())
    elif sort_by == "amount":
        query = query.order_by(Transaction.amount.desc())
    else:
        query = query.order_by(Transaction.timestamp.desc())

    total = query.count()
    transactions = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "transactions": [
            {
                "id": t.id,
                "transaction_id": t.transaction_id,
                "sender": t.sender,
                "receiver": t.receiver,
                "amount": t.amount,
                "timestamp": str(t.timestamp),
                "risk_score": t.risk_score,
                "status": t.status,
            }
            for t in transactions
        ]
    }
