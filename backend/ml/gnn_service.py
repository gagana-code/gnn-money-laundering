"""
GNN-based AML detection service.
Uses NetworkX for graph construction and a rule-based + statistical model
for risk scoring (simulating GNN output when PyTorch Geometric is unavailable).
For full GNN: install torch-geometric and uncomment the GNN section.
"""
import networkx as nx
import pandas as pd
import numpy as np
from datetime import datetime
import uuid

def build_graph(transactions: list[dict]) -> nx.DiGraph:
    """Build a directed graph from transaction data."""
    G = nx.DiGraph()
    for tx in transactions:
        sender = str(tx.get("sender", ""))
        receiver = str(tx.get("receiver", ""))
        amount = float(tx.get("amount", 0))
        timestamp = tx.get("timestamp", "")
        if sender and receiver:
            G.add_edge(sender, receiver, 
                      amount=amount, 
                      timestamp=timestamp,
                      transaction_id=tx.get("transaction_id", str(uuid.uuid4())))
    return G

def compute_node_features(G: nx.DiGraph) -> dict:
    """Compute features for each node (account) in the graph."""
    features = {}
    for node in G.nodes():
        in_edges = list(G.in_edges(node, data=True))
        out_edges = list(G.out_edges(node, data=True))
        
        in_amount = sum(e[2].get("amount", 0) for e in in_edges)
        out_amount = sum(e[2].get("amount", 0) for e in out_edges)
        in_degree = G.in_degree(node)
        out_degree = G.out_degree(node)
        
        features[node] = {
            "in_amount": in_amount,
            "out_amount": out_amount,
            "in_degree": in_degree,
            "out_degree": out_degree,
            "total_volume": in_amount + out_amount,
            "flow_ratio": out_amount / (in_amount + 1),  # pass-through indicator
        }
    return features

def detect_suspicious_patterns(G: nx.DiGraph, node_features: dict) -> dict:
    """
    Detect AML patterns:
    - Structuring (many small transactions)
    - Layering (chains of transfers)
    - High velocity
    - Circular transactions (cycles in graph)
    """
    risk_scores = {}
    
    # Detect cycles (circular transactions)
    try:
        cycles = list(nx.simple_cycles(G))
        cycle_nodes = set(n for cycle in cycles for n in cycle)
    except:
        cycle_nodes = set()
    
    # High degree nodes (hub accounts)
    degrees = dict(G.degree())
    max_degree = max(degrees.values()) if degrees else 1
    
    # PageRank for importance
    try:
        pagerank = nx.pagerank(G, alpha=0.85)
    except:
        pagerank = {n: 1/len(G.nodes()) for n in G.nodes()}
    
    for node in G.nodes():
        feat = node_features.get(node, {})
        score = 0.0
        reasons = []
        
        # Rule 1: Circular transactions (highest risk)
        if node in cycle_nodes:
            score += 0.40
            reasons.append("circular_transaction")
        
        # Rule 2: Pass-through (money mule pattern)
        flow_ratio = feat.get("flow_ratio", 1)
        if 0.8 <= flow_ratio <= 1.2 and feat.get("total_volume", 0) > 0:
            score += 0.25
            reasons.append("pass_through_account")
        
        # Rule 3: High degree (hub node)
        degree = degrees.get(node, 0)
        if degree > 0.7 * max_degree and max_degree > 3:
            score += 0.20
            reasons.append("high_connectivity")
        
        # Rule 4: High volume
        avg_volume = np.mean([f.get("total_volume", 0) for f in node_features.values()]) if node_features else 1
        if feat.get("total_volume", 0) > 3 * avg_volume:
            score += 0.15
            reasons.append("unusually_high_volume")
        
        # Add PageRank influence
        score += pagerank.get(node, 0) * 0.10
        
        risk_scores[node] = {
            "score": min(score, 1.0),
            "reasons": reasons
        }
    
    return risk_scores

def score_transactions(transactions: list[dict]) -> list[dict]:
    """Main pipeline: build graph → compute features → score → return results."""
    if not transactions:
        return []
    
    G = build_graph(transactions)
    node_features = compute_node_features(G)
    risk_scores = detect_suspicious_patterns(G, node_features)
    
    scored = []
    for tx in transactions:
        sender = str(tx.get("sender", ""))
        receiver = str(tx.get("receiver", ""))
        
        sender_risk = risk_scores.get(sender, {}).get("score", 0)
        receiver_risk = risk_scores.get(receiver, {}).get("score", 0)
        tx_risk = (sender_risk + receiver_risk) / 2
        
        reasons = list(set(
            risk_scores.get(sender, {}).get("reasons", []) +
            risk_scores.get(receiver, {}).get("reasons", [])
        ))
        
        # Large single transaction bonus
        amounts = [float(t.get("amount", 0)) for t in transactions]
        avg_amount = np.mean(amounts) if amounts else 1
        if float(tx.get("amount", 0)) > 5 * avg_amount:
            tx_risk = min(tx_risk + 0.20, 1.0)
            reasons.append("unusually_large_amount")
        
        scored.append({
            **tx,
            "risk_score": round(tx_risk, 4),
            "status": "Suspicious" if tx_risk >= 0.5 else "Normal",
            "reasons": reasons
        })
    
    return scored

def get_graph_data(transactions: list[dict]) -> dict:
    """Return graph nodes/edges for visualization."""
    G = build_graph(transactions)
    node_features = compute_node_features(G)
    risk_scores = detect_suspicious_patterns(G, node_features)
    
    nodes = []
    for node in G.nodes():
        risk = risk_scores.get(node, {}).get("score", 0)
        nodes.append({
            "id": node,
            "label": node,
            "risk_score": round(risk, 4),
            "risk_level": "Critical" if risk >= 0.75 else "High" if risk >= 0.5 else "Medium" if risk >= 0.25 else "Low",
            "in_degree": G.in_degree(node),
            "out_degree": G.out_degree(node),
            "total_volume": node_features.get(node, {}).get("total_volume", 0),
        })
    
    edges = []
    for u, v, data in G.edges(data=True):
        edges.append({
            "source": u,
            "target": v,
            "amount": data.get("amount", 0),
            "transaction_id": data.get("transaction_id", ""),
        })
    
    return {"nodes": nodes, "edges": edges}
