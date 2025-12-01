import os
import psycopg2
# You may not even need dotenv if you only use DATABASE_URL

def get_db_conn():
    # Render's DATABASE_URL already includes sslmode=require if it's external
    db_url = os.getenv("DATABASE_URL")

    # Check if we are using the simple URL or the full set of variables
    if db_url:
        return psycopg2.connect(db_url, connect_timeout=5)
    else:
        # Fallback to separate variables for local testing
        host = os.getenv("DB_HOST", "localhost")
        sslmode = "disable" if host in ("localhost", "127.0.0.1") else "require"

        return psycopg2.connect(
            host=host,
            port=os.getenv("DB_PORT", "5432"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            sslmode=sslmode,
            connect_timeout=5
        )
