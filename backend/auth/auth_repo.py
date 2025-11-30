import bcrypt
import psycopg2
from .. import db

def logout_user(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        update_query = """
            UPDATE cloudex_users
            SET is_logged_in = FALSE
            WHERE user_id = %s;
        """
        cursor.execute(update_query, (user_id,))
        conn.commit()
        
    except psycopg2.Error as e:
        print(f"Database error in logout_user: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def login_user(email, username, plaintext_password):
    conn = None
    cursor = None
    user_record = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        auth_query = """
            SELECT user_id, username, email, password_hash
            FROM cloudex_users 
            WHERE email = %s OR username = %s;
        """
        cursor.execute(auth_query, (email, username))
        user_record = cursor.fetchone()

        if user_record is None:
            return None

        stored_hash = user_record[3].encode('utf-8')
        
        if bcrypt.checkpw(plaintext_password.encode('utf-8'), stored_hash):
            
            user_id = user_record[0]
            update_query = """
                UPDATE cloudex_users
                SET is_logged_in = TRUE, last_login_at = NOW()
                WHERE user_id = %s;
            """
            cursor.execute(update_query, (user_id,))
            conn.commit()
            
            return user_record[:3] 
        else:
            return None 

    except psycopg2.Error as e:
        print(f"Database error in login_user: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def create_user(user_data):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO cloudex_users 
                (username, email, password_hash, is_logged_in, user_role_id)
            VALUES 
                (%s, %s, %s, FALSE, %s)
            RETURNING user_id;
        """
        
        data_tuple = (
            user_data['username'],
            user_data['email'],
            user_data['password_hash'],
            user_data['user_role_id']
        )
        
        cursor.execute(insert_query, data_tuple)
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        
        return user_id
    
    except psycopg2.IntegrityError as e:
        if conn:
            conn.rollback()
        raise ValueError("Username or Email already exists.") from e 

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error in create_user: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
# Will update in the future for higher security (e.g., hashing)
def get_user_id(email, username):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = "SELECT user_id FROM cloudex_users WHERE email = %s AND username = %s;"
        cursor.execute(query, (email, username))
        
        result = cursor.fetchone()
        return result[0] if result else None 
    
    except psycopg2.Error as e:
        print(f"Database error in get_user_id: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def check_login_status(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = "SELECT is_logged_in FROM cloudex_users WHERE user_id = %s;"
        cursor.execute(query, (user_id,))
        
        result = cursor.fetchone()
        if result:
            return result[0]  
        return False  
    
    except psycopg2.Error as e:
        print(f"Database error in check_login_status: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
def getUserRoleByUserId(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_db_conn() 
        cursor = conn.cursor()
        
        query = """
        SELECT r.role_name
        FROM cloudex_users cu
        JOIN roles r ON cu.user_role_id = r.role_id
        WHERE cu.user_id = %s;
        """
        
        cursor.execute(query, (user_id,))
        
        result = cursor.fetchone()
        if result:
            return result[0] 
        return None 
    
    except psycopg2.Error as e:
        print(f"Database error in getUserRoleByUserId: {e}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()