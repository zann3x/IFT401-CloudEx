from flask import Flask, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
from . import db 
from .stock.stock_repo import update_all_stock_prices 
from .user.user_repo import update_portfolio_previous_value
from .user.user_routes import user_bp
from .auth.auth_route import auth_bp
from .stock.stock_route import stock_bp

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

app.register_blueprint(user_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(stock_bp)

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    scheduler.add_job(
        func=update_all_stock_prices, 
        trigger="interval", 
        seconds=10,
        id='stock_price_updater',
        name='Update stock prices every minute'
    )

    scheduler.add_job(
        func=update_portfolio_previous_value, 
        trigger="interval", 
        seconds=30,
        id='portfolio_value_snapshot',
        name='Snapshot portfolio total value for daily change calculation'
    )
    
    scheduler.start()
    
    atexit.register(lambda: scheduler.shutdown())
    print("Background scheduler started.")
    print("Stock price updates scheduled every 60s.")
    print("Portfolio snapshot scheduled every 300s.")

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "An unexpected server error occurred."}), 500


if __name__ == "__main__":
    start_scheduler()
    
    app.run(debug=True)