from .. import db

def is_market_holiday():
    conn = db.get_db_conn()
    cur = conn.cursor()

    cur.execute("SELECT 1 FROM market_holidays WHERE holiday_date = CURRENT_DATE;")
    result = cur.fetchone()

    cur.close()
    conn.close()

    return result is not None


def get_holidays():
    conn = db.get_db_conn()
    cur = conn.cursor()

    cur.execute("SELECT id, holiday_date, name FROM market_holidays ORDER BY holiday_date;")
    rows = cur.fetchall()

    cur.close()
    conn.close()

    return [
        {
            "id": row[0],
            "date": str(row[1]),
            "name": row[2]
        }
        for row in rows
    ]


def add_holiday(holiday_date, name):
    conn = db.get_db_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO market_holidays (holiday_date, name)
        VALUES (%s, %s)
        ON CONFLICT (holiday_date) DO NOTHING;
    """, (holiday_date, name))

    conn.commit()
    cur.close()
    conn.close()


def delete_holiday(holiday_id):
    conn = db.get_db_conn()
    cur = conn.cursor()

    cur.execute("DELETE FROM market_holidays WHERE id = %s;", (holiday_id,))
    conn.commit()

    cur.close()
    conn.close()
