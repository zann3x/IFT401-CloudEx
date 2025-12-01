from flask import Blueprint, request, jsonify
from .market_hours import get_market_hours, set_market_hours

market_hours_bp = Blueprint("market_hours", __name__, url_prefix="/api")

@market_hours_bp.get("/market_hours")
def get_hours():
    open_t, close_t = get_market_hours()
    return jsonify({
        "open_time": open_t.strftime("%H:%M"),
        "close_time": close_t.strftime("%H:%M")
    }), 200

@market_hours_bp.put("/market_hours")
def update_hours():
    data = request.get_json() or {}

    open_time = data.get("open_time")
    close_time = data.get("close_time")

    if not open_time or not close_time:
        return jsonify({"error": "open_time and close_time are required in HH:MM format."}), 400

    try:
        set_market_hours(open_time, close_time)
    except ValueError:
        return jsonify({"error": "Time must be in HH:MM format, for example '09:30'."}), 400

    return jsonify({"status": "success"}), 200