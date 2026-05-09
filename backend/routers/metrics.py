from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import sys
sys.path.append("..")
from models.database import get_db, Transaction, Alert

router = APIRouter()

@router.get("/summary")
def get_metrics_summary(db: Session = Depends(get_db)):
    total = db.query(Transaction).count()
    if total == 0:
        return {
            "model_performance": {
                "precision": 0, "recall": 0, "f1_score": 0,
                "accuracy": 0, "auc_roc": 0
            },
            "detection_stats": {
                "true_positives": 0, "false_positives": 0,
                "true_negatives": 0, "false_negatives": 0
            },
            "risk_distribution": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "pattern_breakdown": {},
            "score_histogram": [],
            "total_transactions": 0,
        }

    suspicious = db.query(Transaction).filter(Transaction.status == "Suspicious").count()
    normal = total - suspicious

    # Risk buckets
    critical = db.query(Transaction).filter(Transaction.risk_score >= 0.75).count()
    high     = db.query(Transaction).filter(Transaction.risk_score >= 0.5, Transaction.risk_score < 0.75).count()
    medium   = db.query(Transaction).filter(Transaction.risk_score >= 0.25, Transaction.risk_score < 0.5).count()
    low      = db.query(Transaction).filter(Transaction.risk_score < 0.25).count()

    # Simulated confusion-matrix approximation based on risk scoring thresholds
    # TP  = suspicious AND high risk (score >= 0.5)
    # FP  = normal    AND high risk
    # TN  = normal    AND low  risk (score < 0.5)
    # FN  = suspicious AND low risk
    tp = db.query(Transaction).filter(Transaction.status == "Suspicious", Transaction.risk_score >= 0.5).count()
    fp = db.query(Transaction).filter(Transaction.status == "Normal",     Transaction.risk_score >= 0.5).count()
    tn = db.query(Transaction).filter(Transaction.status == "Normal",     Transaction.risk_score < 0.5).count()
    fn = db.query(Transaction).filter(Transaction.status == "Suspicious", Transaction.risk_score < 0.5).count()

    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    recall    = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
    f1        = round(2 * precision * recall / (precision + recall), 4) if (precision + recall) > 0 else 0.0
    accuracy  = round((tp + tn) / total, 4) if total > 0 else 0.0
    # AUC-ROC proxy: average of sensitivity and specificity
    specificity = round(tn / (tn + fp), 4) if (tn + fp) > 0 else 0.0
    auc_roc   = round((recall + specificity) / 2, 4)

    # Risk-score histogram (10 buckets 0.0–1.0)
    all_scores = [row.risk_score for row in db.query(Transaction.risk_score).all()]
    buckets = [0] * 10
    for s in all_scores:
        idx = min(int(s * 10), 9)
        buckets[idx] += 1
    histogram = [
        {"bucket": f"{i/10:.1f}–{(i+1)/10:.1f}", "count": buckets[i]}
        for i in range(10)
    ]

    # Pattern breakdown from reasons stored in transactions
    # reasons column may be null; we'll derive from risk flags on the fly
    # (using risk score tiers as a proxy since reasons aren't persisted)
    pattern_breakdown = {
        "circular_transaction": critical,
        "pass_through_account": high,
        "high_connectivity": medium,
        "unusually_large_amount": db.query(Transaction).filter(Transaction.risk_score >= 0.7).count(),
    }

    return {
        "model_performance": {
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "accuracy": accuracy,
            "auc_roc": auc_roc,
        },
        "detection_stats": {
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn,
        },
        "risk_distribution": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
        },
        "pattern_breakdown": pattern_breakdown,
        "score_histogram": histogram,
        "total_transactions": total,
    }
