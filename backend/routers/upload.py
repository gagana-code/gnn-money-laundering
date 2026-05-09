from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import io, uuid
from datetime import datetime
import sys
sys.path.append("..")
from models.database import get_db, Transaction, Alert
from ml.gnn_service import score_transactions

router = APIRouter()
REQUIRED_COLUMNS = ["sender", "receiver", "amount"]

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    content = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {missing}. Required: {REQUIRED_COLUMNS}")

    db.query(Alert).delete()
    db.query(Transaction).delete()
    db.commit()

    batch_id = str(uuid.uuid4())[:8]
    transactions = []
    for _, row in df.iterrows():
        tx = {
            "transaction_id": str(row.get("transaction_id", uuid.uuid4())),
            "sender": str(row["sender"]),
            "receiver": str(row["receiver"]),
            "amount": float(row["amount"]),
            "timestamp": str(row.get("timestamp", datetime.utcnow())),
        }
        transactions.append(tx)

    scored = score_transactions(transactions)
    saved_count = 0
    alert_count = 0

    for tx in scored:
        ts = None
        try:
            ts = pd.to_datetime(tx.get("timestamp"))
        except:
            ts = datetime.utcnow()

        db_tx = Transaction(
            transaction_id=tx["transaction_id"],
            sender=tx["sender"],
            receiver=tx["receiver"],
            amount=tx["amount"],
            timestamp=ts,
            risk_score=tx["risk_score"],
            status=tx["status"],
            upload_batch=batch_id
        )
        db.add(db_tx)
        saved_count += 1

        if tx["status"] == "Suspicious":
            alert = Alert(
                alert_id=str(uuid.uuid4())[:12],
                transaction_id=tx["transaction_id"],
                entity=f"{tx['sender']} -> {tx['receiver']}",
                risk_score=tx["risk_score"],
                risk_level="Critical" if tx["risk_score"] >= 0.75 else "High" if tx["risk_score"] >= 0.5 else "Medium",
                reason=", ".join(tx.get("reasons", ["suspicious_pattern"])) or "suspicious_pattern",
                status="Open"
            )
            db.add(alert)
            alert_count += 1

    db.commit()
    return {
        "message": "File processed successfully",
        "total_transactions": len(scored),
        "saved": saved_count,
        "suspicious": sum(1 for t in scored if t["status"] == "Suspicious"),
        "alerts_created": alert_count,
        "batch_id": batch_id
    }
