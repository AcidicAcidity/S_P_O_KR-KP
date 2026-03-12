import threading
import time
from app.database import get_db_connection
import logging

logger = logging.getLogger(__name__)

def cleanup_expired_bookings():
    """Удаляет или помечает истёкшие брони"""
    while True:
        time.sleep(60)  # Проверяем каждую минуту
        try:
            conn = get_db_connection()
            if not conn:
                continue
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE bookings 
                SET status = 'expired' 
                WHERE status = 'active' AND expires_at < NOW()
                RETURNING id
            """)
            expired = cursor.rowcount
            if expired > 0:
                logger.info(f"Очищено {expired} просроченных броней")
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Ошибка очистки броней: {e}")

# Запуск в отдельном потоке
thread = threading.Thread(target=cleanup_expired_bookings, daemon=True)
thread.start()