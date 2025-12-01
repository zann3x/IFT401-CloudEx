from flask import Blueprint, request, jsonify
from .stock_repo import (
    get_stock_id_by_symbol, get_stocks, get_stock_by_id, create_stock,
    delete_stock, update_stock, buy_sell_stock, get_stock_price,
    get_top_gainers, get_top_losers, addToWatchlist, removeFromWatchlist,
    get_user_watchlist, get_shares, search_stocks, search_stocks_bar
)

stock_bp = Blueprint('stocks', __name__, url_prefix='/stocks')


@stock_bp.route('/search_bar', methods=['GET'])
def search_stocks_bar_route():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Missing query parameter."}), 400

    try:
        results = search_stocks_bar(query)
        return jsonify(results), 200

    except Exception as e:
        print(f"Search Stocks Bar Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/all', methods=['GET'])
def all_stocks():
    try:
        stocks = get_stocks()
        return jsonify({
            "status": "success",
            "stocks": stocks
        }), 200

    except Exception as e:
        print(f"All Stocks Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/stock_by_id', methods=['GET'])
def stock_by_id():
    stock_id = request.args.get('stock_id')
    if not stock_id:
        return jsonify({"error": "Missing stock_id parameter."}), 400

    try:
        stock_record = get_stock_by_id(stock_id)

        if stock_record is None:
            return jsonify({"error": "Stock not found."}), 404

        return jsonify({
            "status": "success",
            "stock": stock_record
        }), 200

    except Exception as e:
        print(f"Stock By ID Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/create_stock', methods=['POST'])
def create_stock_route():
    data = request.get_json()

    required_fields = ['company_name', 'symbol', 'price', 'description']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}."}), 400

    image_data = data.get('image_data', '')

    stock_data = {
        'company_name': data['company_name'],
        'symbol': data['symbol'],
        'price': data['price'],
        'description': data['description'],
        'image_data': image_data
    }

    try:
        stock_id = create_stock(stock_data)
        return jsonify({
            "status": "success",
            "stock_id": stock_id
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 409

    except Exception as e:
        print(f"Create Stock Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/delete_stock', methods=['DELETE'])
def delete_stock_route():
    data = request.get_json()
    stock_id = data.get('stock_id')

    if not stock_id:
        return jsonify({"error": "Missing 'stock_id' in request body."}), 400

    try:
        delete_stock(stock_id)
        return jsonify({
            "status": "success",
            "message": f"Stock {stock_id} deleted successfully."
        }), 200

    except ValueError as e:
        error_msg = str(e)
        status_code = 400

        if "not found" in error_msg:
            status_code = 404
        elif "Cannot delete stock" in error_msg:
            status_code = 409

        return jsonify({"error": error_msg}), status_code

    except Exception as e:
        print(f"Delete Stock Error: {e}")
        return jsonify({"error": "An unexpected server error occurred."}), 500


@stock_bp.route('/edit', methods=['PUT'])
def edit_stock():
    data = request.get_json()

    if 'stock_id' not in data:
        return jsonify({"error": "Missing stock_id in request."}), 400

    stock_id = data['stock_id']

    try:
        was_updated = update_stock(stock_id, data)
        if not was_updated:
            return jsonify({"error": f"Stock with ID {stock_id} not found."}), 404

        return jsonify({
            "status": "success",
            "message": f"Stock {stock_id} updated successfully."
        }), 200

    except Exception as e:
        print(f"Edit Stock Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/buy_sell', methods=['POST'])
def buy_sell_route():
    data = request.get_json()

    required_fields = ['user_id', 'stock_id', 'shares', 'transaction_type', 'fee_amount']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}."}), 400

    user_id = data['user_id']
    stock_id = data['stock_id']
    shares = data['shares']
    transaction_type = data['transaction_type']
    fee_amount = data['fee_amount']

    # MARKET HOURS CHECK
    from ..market_hours.market_hours import get_market_hours
    from datetime import datetime

    open_time, close_time = get_market_hours()
    if not open_time or not close_time:
        return jsonify({"error": "Market hours not configured."}), 500

    now = datetime.now().time()
    if not (open_time <= now <= close_time):
        return jsonify({"error": "Market is currently closed."}), 400

        # HOLIDAY CHECK
    from ..market_hours.market_holidays import is_market_holiday

    if is_market_holiday():
        return jsonify({"error": "Market is closed today due to a holiday."}), 400

    try:
        price_per_share = get_stock_price(stock_id)

        success = buy_sell_stock(
            user_id,
            stock_id,
            shares,
            price_per_share,
            fee_amount,
            transaction_type
        )

        if success:
            return jsonify({
                "status": "success",
                "message": "Transaction completed successfully."
            }), 201
        else:
            return jsonify({"error": "Transaction failed internally."}), 500

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    except Exception as e:
        print(f"Buy/Sell Stock Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/search', methods=['GET'])
def search_stocks_route():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Missing query parameter."}), 400

    try:
        results = search_stocks(query)
        return jsonify(results), 200

    except Exception as e:
        print(f"Search Stocks Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/get_shares', methods=['GET'])
def get_shares_route():
    user_id = request.args.get('user_id')
    stock_id = request.args.get('stock_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter."}), 400

    try:
        shares_owned = get_shares(user_id, stock_id)
        return jsonify({
            "status": "success",
            "shares_owned": shares_owned
        }), 200

    except Exception as e:
        print(f"Get Stocks Owned Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/stock_id', methods=['GET'])
def stock_id_by_symbol():
    symbol = request.args.get('symbol')
    if not symbol:
        return jsonify({"error": "Missing symbol parameter."}), 400

    try:
        stock_id = get_stock_id_by_symbol(symbol)

        if stock_id is None:
            return jsonify({"error": "Stock not found."}), 404

        return jsonify({
            "status": "success",
            "stock_id": stock_id
        }), 200

    except Exception as e:
        print(f"Stock ID By Symbol Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/top_gainers', methods=['GET'])
def top_gainers():
    try:
        gainers = get_top_gainers()
        return jsonify({
            "status": "success",
            "top_gainers": gainers
        }), 200

    except Exception as e:
        print(f"Top Gainers Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/top_losers', methods=['GET'])
def top_losers():
    try:
        losers = get_top_losers()
        return jsonify({
            "status": "success",
            "top_losers": losers
        }), 200

    except Exception as e:
        print(f"Top Losers Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/add_wishlist', methods=['POST'])
def add_to_wishlist():
    data = request.get_json()

    required_fields = ['user_id', 'stock_id']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}."}), 400

    user_id = data['user_id']
    stock_id = data['stock_id']

    try:
        addToWatchlist(user_id, stock_id)
        return jsonify({
            "status": "success",
            "message": "Stock added to watchlist successfully."
        }), 200

    except Exception as e:
        print(f"Add to Watchlist Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/remove_wishlist', methods=['POST'])
def remove_from_wishlist():
    data = request.get_json()

    required_fields = ['user_id', 'stock_id']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}."}), 400

    user_id = data['user_id']
    stock_id = data['stock_id']

    try:
        removeFromWatchlist(user_id, stock_id)
        return jsonify({
            "status": "success",
            "message": "Stock removed from watchlist successfully."
        }), 200

    except Exception as e:
        print(f"Remove from Watchlist Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@stock_bp.route('/get_wishlist', methods=['GET'])
def get_wishlist():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter."}), 400

    try:
        watchlist = get_user_watchlist(user_id)
        return jsonify({
            "status": "success",
            "watchlist": watchlist
        }), 200

    except Exception as e:
        print(f"Get Watchlist Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500