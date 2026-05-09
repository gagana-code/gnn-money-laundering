from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import sys
sys.path.append("..")
from models.database import get_db, Transaction
from ml.gnn_service import get_graph_data

router = APIRouter()

@router.get("/")
def get_graph(db: Session = Depends(get_db)):
    transactions = db.query(Transaction).all()
    tx_list = [
        {
            "transaction_id": t.transaction_id,
            "sender": t.sender,
            "receiver": t.receiver,
            "amount": t.amount,
            "timestamp": str(t.timestamp),
        }
        for t in transactions
    ]
    return get_graph_data(tx_list)
