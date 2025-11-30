import psycopg2
from psycopg2 import errors
from decimal import Decimal
import random
from .. import db

def get_stocks():
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = "SELECT * FROM stocks WHERE is_tradable = true;"
        cursor.execute(query)
        
        stocks = cursor.fetchall()
        return stocks  
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_top_losers():
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = """
            SELECT 
                stock_id,
                symbol,
                company_name,
                price,
                previous_price,
                ((previous_price - price) / previous_price) * 100 AS percentage_loss
            FROM stocks
            WHERE 
                previous_price IS NOT NULL 
                AND previous_price > 0 
            ORDER BY percentage_loss DESC
            LIMIT 3;
        """
        cursor.execute(query)
        
        losers = cursor.fetchall()
        return losers  
    
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error in get_top_losers: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_top_gainers():
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = """
            SELECT 
                stock_id,
                symbol,
                company_name,
                price,
                previous_price,
                ((price - previous_price) / previous_price) * 100 AS percentage_change
            FROM stocks
            WHERE 
                previous_price IS NOT NULL 
                AND previous_price > 0 
            ORDER BY percentage_change DESC
            LIMIT 3;
        """
        cursor.execute(query)
        
        gainers = cursor.fetchall()
        return gainers  
    
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error in get_top_gainers: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_stock_by_id(stock_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = "SELECT * FROM stocks WHERE stock_id = %s;"
        cursor.execute(query, (stock_id,))
        
        stock_record = cursor.fetchone()
        return stock_record  
    
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def create_stock(stock_data):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO stocks (company_name, symbol, price, description, previous_price, image_data)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING stock_id;
        """
        
        image_data = stock_data.get('image_data', '')
        
        cursor.execute(insert_query, (
            stock_data['company_name'],
            stock_data['symbol'],
            stock_data['price'],
            stock_data['description'],
            stock_data['price'],
            image_data
        ))
        stock_id = cursor.fetchone()[0]
        conn.commit()
        
        return stock_id 
    
    except errors.UniqueViolation:
        if conn:
            conn.rollback()
        raise ValueError(f"The stock symbol '{stock_data['symbol']}' already exists.")
        
    except psycopg2.Error as e:
        print(f"Database error in create_stock: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def delete_stock(stock_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        delete_transactions_query = "DELETE FROM transaction_history WHERE stock_id = %s;"
        cursor.execute(delete_transactions_query, (stock_id,))
        print(f"Deleted {cursor.rowcount} associated transaction records for stock ID {stock_id}.")
        
        delete_stock_query = "DELETE FROM stocks WHERE stock_id = %s;"
        cursor.execute(delete_stock_query, (stock_id,))
        
        if cursor.rowcount == 0:
             raise ValueError(f"Stock ID {stock_id} not found.")
             
        conn.commit()
        
    except ValueError:
        if conn:
            conn.rollback()
        raise
        
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error during deletion: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def update_stock(stock_id, stock_data):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        update_query = """
            UPDATE stocks
            SET company_name = %s,
                description = %s
            WHERE stock_id = %s;
        """
        
        cursor.execute(update_query, (
            stock_data['company_name'],
            stock_data['description'],
            stock_id
        ))
        
        rows_affected = cursor.rowcount
        conn.commit()
        
        if rows_affected == 0:
            return False
        return True
        
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error in update_stock: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

from decimal import Decimal
import psycopg2 

def buy_sell_stock(user_id, stock_id, shares, price_per_share, fee_amount, transaction_type):
    conn = None
    cursor = None

    try:
        shares = Decimal(str(shares))
        fee_amount = Decimal(str(fee_amount))
        price_per_share = Decimal(str(price_per_share))
    except Exception:
        raise ValueError("Invalid number format for shares, price, or fee_amount.")

    amount = shares * price_per_share

    if transaction_type.upper() == 'BUY':
        net_cash_change = -(amount + fee_amount)
        shares_delta = shares
    elif transaction_type.upper() == 'SELL':
        net_cash_change = amount - fee_amount
        shares_delta = -shares
    else:
        raise ValueError("Invalid transaction_type. Must be 'BUY' or 'SELL'.")

    if not price_per_share or price_per_share <= 0:
        raise ValueError("Invalid stock price provided for transaction.")

    try:
        conn = db.get_db_conn()
        cursor = conn.cursor()

        cursor.execute("SELECT balance FROM cloudex_users WHERE user_id = %s FOR UPDATE;", (user_id,))
        current_balance_record = cursor.fetchone()
        if current_balance_record is None:
            raise ValueError(f"User ID {user_id} not found.")

        current_balance = current_balance_record[0]
        new_balance = current_balance + net_cash_change
        
        if transaction_type.upper() == 'BUY' and new_balance < 0:
            raise ValueError(f"Insufficient funds. Current balance: ${current_balance:.2f}. Required for purchase: ${(amount + fee_amount):.2f}.")

        cursor.execute("SELECT total_shares, average_cost FROM portfolio WHERE user_id = %s AND stock_id = %s;", (user_id, stock_id))
        portfolio_record = cursor.fetchone()
        current_shares = portfolio_record[0] if portfolio_record else Decimal('0')
        current_avg_cost = portfolio_record[1] if portfolio_record else Decimal('0.00')

        new_total_shares = current_shares + shares_delta
        if transaction_type.upper() == 'SELL' and new_total_shares < 0:
            raise ValueError("Insufficient shares to complete this sale.")

        if transaction_type.upper() == 'BUY' and new_total_shares > 0:
            new_average_cost = ((current_shares * current_avg_cost) + (shares * price_per_share)) / new_total_shares
        else:
            new_average_cost = current_avg_cost if new_total_shares > 0 else Decimal('0.00')

        cursor.execute("UPDATE cloudex_users SET balance = %s WHERE user_id = %s;", (new_balance, user_id))

        cursor.execute("""
            INSERT INTO portfolio (user_id, stock_id, total_shares, average_cost, previous_total_value)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id, stock_id) DO UPDATE
            SET total_shares = EXCLUDED.total_shares,
                average_cost = EXCLUDED.average_cost
        """, (user_id, stock_id, new_total_shares, new_average_cost, Decimal('0.00')))

        cursor.execute("""
            INSERT INTO transaction_history 
                (user_id, stock_id, shares, price_per_share, transaction_type, fee_amount, executed_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING transaction_id;
        """, (user_id, stock_id, shares, price_per_share, transaction_type.upper(), fee_amount))

        transaction_id = cursor.fetchone()[0]
        conn.commit()
        return transaction_id

    except ValueError:
        if conn:
            conn.rollback()
        raise
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def search_stocks(keyword):
    if not keyword or not isinstance(keyword, str) or len(keyword.strip()) == 0:
        return []

    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        search_query = """
            SELECT stock_id, symbol
            FROM stocks
            WHERE symbol ILIKE %s
            ORDER BY
                CASE
                    WHEN symbol ILIKE %s THEN 1
                    WHEN symbol ILIKE %s THEN 2
                    ELSE 3
                END,
                symbol ASC
            LIMIT 3;
        """
        
        exact_pattern = keyword 
        starts_with_pattern = f"{keyword}%"
        like_pattern = f"%{keyword}%"

        params = (
            like_pattern,
            exact_pattern,
            starts_with_pattern
        )

        cursor.execute(search_query, params)
        
        results = cursor.fetchall()
        return results 
    
    except psycopg2.Error as e:
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_shares(user_id, stock_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = "SELECT total_shares FROM portfolio WHERE user_id = %s AND stock_id = %s;"
        cursor.execute(query, (user_id, stock_id))
        
        result = cursor.fetchone()
        
        if result is None:
            return Decimal('0')
            
        return result[0]  
    
    except psycopg2.Error as e:
        print(f"Database error in get_amount_of_stocks_owned: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def search_stocks_bar(keyword):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        search_query = """
            SELECT stock_id, symbol, company_name
            FROM stocks
            WHERE 
                symbol ILIKE %s OR
                company_name ILIKE %s OR
                symbol ILIKE %s OR
                company_name ILIKE %s
            ORDER BY symbol ASC
            LIMIT 5;
        """
        
        start_pattern = f"{keyword}%"
        like_pattern = f"%{keyword}%"

        params = (
            start_pattern,
            start_pattern,
            like_pattern,
            like_pattern
        )

        cursor.execute(search_query, params)
        
        results = cursor.fetchall()
        
        return [
            {
                "stock_id": row[0],
                "symbol": row[1],
                "company_name": row[2]
            } for row in results
        ]
    
    except psycopg2.Error as e:
        print(f"Database error in search_stocks_bar: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_stock_price(stock_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = "SELECT price FROM stocks WHERE stock_id = %s;"
        cursor.execute(query, (stock_id,))
        
        result = cursor.fetchone()
        
        if result is None:
            raise ValueError(f"Stock ID {stock_id} does not exist.")
            
        return result[0] 
    
    except psycopg2.Error as e:
        print(f"Database error in get_stock_price: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def get_stock_id_by_symbol(symbol):
        conn = None
        cursor = None
        try:
            conn = db.get_db_conn() 
            cursor = conn.cursor()
            
            query = "SELECT stock_id FROM stocks WHERE symbol = %s;"
            cursor.execute(query, (symbol,))
            
            result = cursor.fetchone()
            if result is None:
                return None
            return result[0]  
        
        except psycopg2.Error as e:
            print(f"Database error in get_stock_id_by_symbol: {e}")
            raise
            
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
                
def update_all_stock_prices():
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        cursor.execute("SELECT stock_id, price FROM stocks;")
        stocks = cursor.fetchall()
        
        if not stocks:
            return 0
            
        updated_count = 0
        
        for stock_id, old_price in stocks:
            change_percent = Decimal(str(random.uniform(-0.01, 0.01))) 
            change_amount = old_price * change_percent
            new_price = old_price + change_amount
            if new_price < Decimal('0.01'):
                new_price = Decimal('0.01')
            update_query = """
                UPDATE stocks
                SET previous_price = price,
                    price = %s
                WHERE stock_id = %s;
            """
            cursor.execute(update_query, (new_price, stock_id))
            updated_count += cursor.rowcount
            
        conn.commit()
        return updated_count

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error during price update simulation: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def addToWatchlist(user_id, stock_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO watchlist (user_id, stock_id)
            VALUES (%s, %s);
        """
        
        cursor.execute(insert_query, (user_id, stock_id))
        conn.commit()
        
    except errors.UniqueViolation:
        if conn:
            conn.rollback()
        raise ValueError(f"Stock ID '{stock_id}' is already in the watchlist for User ID '{user_id}'.")
        
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error in addToWatchlist: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def removeFromWatchlist(user_id, stock_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        delete_query = """
            DELETE FROM watchlist
            WHERE user_id = %s AND stock_id = %s;
        """
        
        cursor.execute(delete_query, (user_id, stock_id))
        
        if cursor.rowcount == 0:
            raise ValueError(f"Stock ID '{stock_id}' not found in watchlist for User ID '{user_id}'.")
        
        conn.commit()
        
    except ValueError:
        if conn:
            conn.rollback()
        raise
        
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error in removeFromWatchlist: {e}")
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
SELECT s.stock_id
                FROM watchlist w
                JOIN stocks s ON w.stock_id = s.stock_id
                WHERE w.user_id = %s;
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