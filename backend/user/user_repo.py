import psycopg2
from .. import db

def get_user_transactions(user_id):
    """
    Retrieves the transaction history for a user, including the stock name and symbol,
    by joining the transaction_history and stocks tables.
    """
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = """
        SELECT 
            th.transaction_id, 
            th.stock_id, 
            th.transaction_type, 
            th.shares, 
            th.price_per_share, 
            th.executed_at, 
            th.fee_amount, 
            s.company_name,   -- Index 7
            s.symbol          -- Index 8
        FROM transaction_history th
        INNER JOIN stocks s ON th.stock_id = s.stock_id
        WHERE th.user_id = %s
        ORDER BY th.executed_at DESC;
        """
        cursor.execute(query, (user_id,))
        transactions = cursor.fetchall()
        return [
            {
                "transaction_id": row[0],
                "stock_id": row[1],
                "transaction_type": row[2],
                "shares": row[3],
                "price_per_share": row[4],
                "transaction_date": row[5],
                "total_amount": row[6],
                "stock_name": row[7],
                "symbol": row[8]
            }
            for row in transactions
        ] 
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def delete_user(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        delete_query = "DELETE FROM cloudex_users WHERE user_id = %s;"
        cursor.execute(delete_query, (user_id,))
        conn.commit()
        
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



def get_user_stocks(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = """
                SELECT
                s.symbol, s.company_name, p.total_shares, p.average_cost FROM
                portfolio p JOIN
                stocks s ON p.stock_id = s.stock_id WHERE
                p.user_id = %s;
                """
        cursor.execute(query, (user_id,))
        
        stocks = [row[0] for row in cursor.fetchall()]
        return stocks  
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def get_user_watchlist(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = """
            SELECT stock_id
            FROM watchlist 
            WHERE user_id = %s;
        """
        cursor.execute(query, (user_id,))
        
        watchlist = [row[0] for row in cursor.fetchall()]
        return watchlist  
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def get_full_watchlist(user_id):
    """
    Retrieves the full details (ID, symbol, company_name, price) 
    for all stocks associated with the given user_id in the 'watchlist' table.
    """
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        query = """
        SELECT s.stock_id, s.symbol, s.company_name, s.price
        FROM stocks s
        INNER JOIN watchlist w ON s.stock_id = w.stock_id
        WHERE w.user_id = %s;
        """
        cursor.execute(query, (user_id,))
        
        raw_results = cursor.fetchall()
        
        watchlist = []
        for row in raw_results:
            stock_data = {
                'stock_id': row[0],
                'symbol': row[1],
                'company_name': row[2],
                'price': row[3]
            }
            watchlist.append(stock_data)
            
        return watchlist
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            

def get_user_by_id(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = "SELECT user_id, username, email FROM cloudex_users WHERE user_id = %s;"
        cursor.execute(query, (user_id,))
        
        user_record = cursor.fetchone()
        return user_record  
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def edit_user(user_id, email, username, password_hash=None):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn()
        cursor = conn.cursor()
        if password_hash:
            query = """
                UPDATE cloudex_users
                SET email = %s,
                    username = %s,
                    password_hash = %s
                WHERE user_id = %s;
            """
            cursor.execute(query, (email, username, password_hash, user_id))
        else:
            query = """
                UPDATE cloudex_users
                SET email = %s,
                    username = %s
                WHERE user_id = %s;
            """
            cursor.execute(query, (email, username, user_id))
        conn.commit()
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error in edit_user: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

            
def add_user_transaction(user_id, stock_id, transaction_type, shares, price_per_share, fee_amount):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO transaction_history (user_id, stock_id, transaction_type, shares, price_per_share, executed_at, fee_amount)
            VALUES (%s, %s, %s, %s, %s, NOW(), %s);
        """
        cursor.execute(insert_query, (user_id, stock_id, transaction_type, shares, price_per_share, fee_amount))
        conn.commit()
        
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_user_id_by_email(email):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = "SELECT user_id FROM cloudex_users WHERE email = %s;"
        cursor.execute(query, (email,))
        
        result = cursor.fetchone()
        if result:
            return result
        return None  
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_user_id_by_username(username):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        query = "SELECT user_id FROM cloudex_users WHERE username = %s;"
        cursor.execute(query, (username,))
        
        result = cursor.fetchone()
        if result:
            return result
        return None  
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_portfolio(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = """
            SELECT stock_id, total_shares, average_cost
            FROM portfolio
            WHERE user_id = %s;
        """
        cursor.execute(query, (user_id,))
        
        portfolio = cursor.fetchall()
        return [
            {
                "stock_id": row[0],
                "total_shares": row[1],
                "average_cost": row[2]
            }
            for row in portfolio
        ]  
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_user_balance(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = "SELECT balance FROM cloudex_users WHERE user_id = %s;"
        cursor.execute(query, (user_id,))
        
        result = cursor.fetchone()
        if result:
            return result[0]
        return 0.0  
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def add_funds_to_user(user_id, amount):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        update_query = "UPDATE cloudex_users SET balance = balance + %s WHERE user_id = %s;"
        cursor.execute(update_query, (amount, user_id))
        
        select_query = "SELECT balance FROM cloudex_users WHERE user_id = %s;"
        cursor.execute(select_query, (user_id,))
        new_balance = cursor.fetchone()[0]
        
        conn.commit()
        
        return new_balance
        
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_daily_portfolio_change(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = """
            SELECT 
                SUM((p.total_shares * s.price) - p.previous_total_value) AS daily_change
            FROM 
                portfolio p
            JOIN 
                stocks s ON p.stock_id = s.stock_id
            WHERE 
                p.user_id = %s;
        """
        cursor.execute(query, (user_id,))
        
        result = cursor.fetchone()
        return result[0] if result[0] is not None else 0.0  
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        
def withdraw_funds(user_id, amount):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        update_query = "UPDATE cloudex_users SET balance = balance - %s WHERE user_id = %s AND balance >= %s;"
        cursor.execute(update_query, (amount, user_id, amount))
        if cursor.rowcount == 0:
            raise ValueError("Insufficient funds.")
        conn.commit()
        
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def update_portfolio_previous_value():
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn()
        cursor = conn.cursor()

        query = """
        UPDATE portfolio AS p
        SET previous_total_value = p.total_shares * s.price
        FROM stocks AS s
        WHERE p.stock_id = s.stock_id;
        """
        
        cursor.execute(query)
        conn.commit()

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()