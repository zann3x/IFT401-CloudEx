from flask import Blueprint, request, jsonify
from .market_holidays import get_holidays, add_holiday, delete_holiday

market_holidays_bp = Blueprint("market_holidays", __name__, url_prefix="/api")

@market_holidays_bp.get("/holidays")
def list_holidays():
    return jsonify(get_holidays()), 200

@market_holidays_bp.post("/holidays")
def create_holiday():
    data = request.get_json() or {}
    holiday_date = data.get("date")
    name = data.get("name")

    if not holiday_date or not name:
        return jsonify({"error": "date and name are required"}), 400

    add_holiday(holiday_date, name)
    return jsonify({"status": "success"}), 201

@market_holidays_bp.delete("/holidays/<int:holiday_id>")
def remove_holiday(holiday_id):
    delete_holiday(holiday_id)
    return jsonify({"status": "success"}), 200