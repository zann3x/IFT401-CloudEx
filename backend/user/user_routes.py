import bcrypt
from flask import Blueprint, request, jsonify
from .user_repo import add_funds_to_user, add_user_transaction, edit_user, get_user_by_id, get_user_id_by_email, get_user_id_by_username, get_user_watchlist, get_user_stocks, delete_user, get_user_transactions, get_portfolio, get_user_balance, get_daily_portfolio_change, get_full_watchlist

user_bp = Blueprint('user', __name__, url_prefix='/user')

@user_bp.route('/delete_user', methods=['DELETE'])
def delete_user_route():
    data = request.get_json()
    
    if 'user_id' not in data:
        return jsonify({"error": "Missing user_id."}), 400

    user_id = data['user_id']

    try:
        delete_user(user_id)  
        
        return jsonify({
            "status": "success",
            "message": "User deleted successfully."
        }), 200
        
    except Exception as e:
        print(f"Delete User Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500



@user_bp.route('/user_stocks', methods=['GET'])
def user_stocks():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter."}), 400

    try:
        stocks = get_user_stocks(user_id)  
        
        return jsonify({
            "status": "success",
            "stocks": stocks
        }), 200
        
    except Exception as e:
        print(f"User Stocks Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

@user_bp.route('/user_watchlist', methods=['GET'])
def get_watchlist():
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
    



@user_bp.route('/user_profile', methods=['GET'])
def get_user_profile():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter."}), 400

    try:
        user_record = get_user_by_id(user_id)  
        
        if not user_record:
            return jsonify({"error": "User not found."}), 404
        
        return jsonify({
            "status": "success",
            "user": {
                "user_id": user_record[0],
                "username": user_record[1],
                "email": user_record[2],
            }
        }), 200
        
    except Exception as e:
        print(f"Get User Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

@user_bp.route('/edit_profile', methods=['PUT'])
def edit_profile():
    data = request.get_json()

    required_fields = ['user_id', 'username', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}."}), 400

    user_id = data['user_id']
    username = data['username']
    email = data['email']
    password = data.get('password_hash')
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()) if password else None

    try:
        edit_user(user_id, email, username, password_hash)
        return jsonify({
            "status": "success",
            "message": "User profile updated successfully."
        }), 200
        
    except Exception as e:
        print(f"Edit Profile Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
    
@user_bp.route('/transactions', methods=['GET'])
def get_transactions():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter."}), 400

    try:
        transactions = get_user_transactions(user_id)  
        
        return jsonify({
            "status": "success",
            "transactions": transactions
        }), 200
        
    except Exception as e:
        print(f"Get Transactions Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@user_bp.route('/add_transaction', methods=['POST'])
def add_transaction():
    data = request.get_json()
    
    required_fields = ['user_id', 'stock_id', 'transaction_type', 'shares', 'price_per_share', 'fee_amount', 'executed_at']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing {field}."}), 400

    user_id = data['user_id']
    stock_id = data['stock_id']
    transaction_type = data['transaction_type']
    shares = data['shares']
    price_per_share = data['price_per_share']
    fee_amount = data['fee_amount']
    executed_at = data['executed_at']

    try:
        add_user_transaction(user_id, stock_id, transaction_type, shares, price_per_share, fee_amount, executed_at)  
        
        return jsonify({
            "status": "success",
            "message": "Transaction added successfully."
        }), 200
        
    except Exception as e:
        print(f"Add Transaction Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
    
@user_bp.route('/get_portfolio', methods=['GET'])
def get_portfolio_route():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter."}), 400

    try:
        portfolio = get_portfolio(user_id)  
        
        return jsonify({
            "status": "success",
            "portfolio": portfolio
        }), 200
        
    except Exception as e:
        print(f"Get Portfolio Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
    
@user_bp.route('/get_user_id', methods=['GET'])
def get_user_id_email():
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Missing email parameter."}), 400

    try:
        user = get_user_id_by_email(email)  
        
        if not user:
            return jsonify({"error": "User not found."}), 404
        
        return jsonify({
            "status": "success",
            "user_id": user[0]
        }), 200
        
    except Exception as e:
        print(f"Get User ID Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
    
@user_bp.route('/get_user_by_username', methods=['GET'])
def get_user_by_username_route():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Missing username parameter."}), 400

    try:
        user = get_user_id_by_username(username)  
        
        if not user:
            return jsonify({"error": "User not found."}), 404
        
        return jsonify({
            "status": "success",
            "user_id": user[0]
        }), 200
        
    except Exception as e:
        print(f"Get User by Username Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
    
@user_bp.route('/get_user_balance', methods=['GET'])
def get_user_balance_route():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter."}), 400

    try:
        balance = get_user_balance(user_id)  
        
        return jsonify({
            "status": "success",
            "balance": balance
        }), 200
        
    except Exception as e:
        print(f"Get User Balance Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
    
@user_bp.route('/add_funds', methods=['POST'])
def add_funds_route():
    data = request.get_json()
    
    required_fields = ['user_id', 'amount']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}."}), 400

    user_id = data['user_id']
    amount = data['amount']

    try:
        new_balance = add_funds_to_user(user_id, amount) 
        
        return jsonify({
            "status": "success",
            "message": "Funds added successfully.",
            "new_balance": new_balance
        }), 200
        
    except Exception as e:
        print(f"Add Funds Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
    
@user_bp.route('withdraw_funds', methods=['POST'])
def withdraw_funds_route():
    data = request.get_json()
    
    required_fields = ['user_id', 'amount']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}."}), 400

    user_id = data['user_id']
    amount = data['amount']

    try:
        add_funds_to_user(user_id, -amount)  
        
        return jsonify({
            "status": "success",
            "message": "Funds withdrawn successfully."
        }), 200
        
    except Exception as e:
        print(f"Withdraw Funds Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
    
@user_bp.route('/daily_portfolio_change', methods=['GET'])
def daily_portfolio_change_route():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter."}), 400

    try:
        daily_change = get_daily_portfolio_change(user_id)  
        
        return jsonify({
            "status": "success",
            "daily_portfolio_change": daily_change
        }), 200
        
    except Exception as e:
        print(f"Get Daily Portfolio Change Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
    
    
@user_bp.route('/full_wishlist', methods=['GET'])
def full_watchlist_route():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter."}), 400

    try:
        watchlist = get_full_watchlist(user_id)  
        
        return jsonify({
            "status": "success",
            "watchlist": watchlist
        }), 200
        
    except Exception as e:
        print(f"Get Full Watchlist Error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500