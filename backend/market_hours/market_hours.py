from datetime import datetime

current_open = "09:30"
current_close = "16:00"

def get_market_hours():
    open_t = datetime.strptime(current_open, "%H:%M").time()
    close_t = datetime.strptime(current_close, "%H:%M").time()
    return open_t, close_t

def set_market_hours(open_time_str, close_time_str):
    global current_open, current_close

    datetime.strptime(open_time_str, "%H:%M")
    datetime.strptime(close_time_str, "%H:%M")

    current_open = open_time_str
    current_close = close_time_str