from typing import List, Dict, Any
from datetime import datetime
from .. import db


def get_transaction_history(user_id: str, start_date: str | None = None, end_date: str | None = None) -> List[Dict[str, Any]]:
    
    conn = db.get_db_conn()
    cur = conn.cursor()

    where_clauses = ["t.user_id = %s"]
    params: list[Any] = [user_id]

    if start_date:
        where_clauses.append("t.created_at >= %s")
        params.append(start_date)

    if end_date:
        where_clauses.append("t.created_at <= %s")
        params.append(end_date)

    query = f"""
        SELECT
            t.transaction_id,
            t.type,
            t.quantity,
            t.price,
            t.created_at,
            s.symbol
        FROM transactions t
        JOIN stocks s ON t.stock_id = s.stock_id
        WHERE {" AND ".join(where_clauses)}
        ORDER BY t.created_at DESC
    """

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    history: List[Dict[str, Any]] = []
    for tx_id, tx_type, qty, price, created_at, symbol in rows:
        ts = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at)

        history.append({
            "transaction_id": str(tx_id),
            "type": tx_type,          
            "symbol": symbol,
            "quantity": qty,
            "price": float(price),
            "timestamp": ts,
        })

    return history