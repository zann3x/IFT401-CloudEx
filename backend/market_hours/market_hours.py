from .. import db

def get_market_hours():
    conn = db.get_db_conn()
    cur = conn.cursor()

    cur.execute("SELECT open_time, close_time FROM market_hours LIMIT 1;")
    row = cur.fetchone()

    cur.close()
    conn.close()

    if not row:
        return None, None

    return row[0], row[1]


def set_market_hours(open_time_str, close_time_str):
    conn = db.get_db_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE market_hours
        SET open_time = %s, close_time = %s
        WHERE id = 1;
    """, (open_time_str, close_time_str))

    conn.commit()
    cur.close()
    conn.close()
