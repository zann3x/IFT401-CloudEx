from flask import Blueprint, request, jsonify
from .transaction_repo import get_transaction_history

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")

@transactions_bp.get("/history")
def history():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    start_date = request.args.get("start_date")  
    end_date = request.args.get("end_date")      

    try:
        history = get_transaction_history(user_id, start_date, end_date)
        return jsonify({
            "status": "success",
            "transactions": history
        }), 200
    except Exception as e:
        print(f"Transaction history error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
