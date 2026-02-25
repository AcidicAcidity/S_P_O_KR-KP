import pg8000
from pg8000 import DatabaseError
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Создает подключение к PostgreSQL через pg8000"""
    try:
        conn = pg8000.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            database=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD
        )
        logger.info("✅ Подключение к БД успешно")
        return conn
    except Exception as e:
        logger.error(f"❌ Ошибка подключения к БД: {e}")
        return None

def test_connection():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            result = cursor.fetchone()
            print(f"✅ PostgreSQL версия: {result[0]}")
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            print(f"❌ Ошибка при запросе: {e}")
            return False
    return False