from datetime import datetime, date
from typing import Optional

def format_date(date_obj: date) -> str:
    """Форматирует дату в строку"""
    return date_obj.strftime("%d.%m.%Y")

def format_datetime(dt: datetime) -> str:
    """Форматирует дату и время"""
    return dt.strftime("%d.%m.%Y %H:%M")

def parse_date(date_str: str) -> Optional[date]:
    """Парсит строку в дату"""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except:
        return None