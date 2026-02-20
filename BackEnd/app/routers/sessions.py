from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.models import Seat
import logging

router = APIRouter(prefix="/sessions", tags=["Сеансы"])
logger = logging.getLogger(__name__)

@router.get("/{session_id}/seats")
async def get_session_seats(session_id: int):
    """
    Получить все места на конкретный сеанс
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Информация о сеансе
        cursor.execute("""
            SELECT s.*, h.name as hall_name, h.capacity, m.title as movie_title
            FROM sessions s
            JOIN halls h ON s.hall_id = h.id
            JOIN movies m ON s.movie_id = m.id
            WHERE s.id = %s
        """, (session_id,))

        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Сеанс не найден")

        # Все места в зале с отметкой о доступности
        cursor.execute("""
            SELECT
                seats.id,
                seats.row_number,
                seats.seat_number,
                seats.seat_type,
                CASE
                    WHEN tickets.id IS NOT NULL THEN false
                    ELSE true
                END as is_available
            FROM seats
            LEFT JOIN tickets ON seats.id = tickets.seat_id
                AND tickets.session_id = %s
                AND tickets.status != 'Возврат'
            WHERE seats.hall_id = %s
            ORDER BY seats.row_number, seats.seat_number
        """, (session_id, session[3]))  # session[3] это hall_id

        seats_data = cursor.fetchall()

        # Группируем по рядам
        seats_by_row = {}
        for seat in seats_data:
            row = seat[1]
            if row not in seats_by_row:
                seats_by_row[row] = []
            seats_by_row[row].append({
                "id": seat[0],
                "row": seat[1],
                "seat": seat[2],
                "type": seat[3],
                "available": seat[4]
            })

        return {
            "session_id": session_id,
            "movie_title": session[8],  # movie_title
            "start_time": session[1],   # start_time
            "hall_name": session[5],     # hall_name
            "price": float(session[2]),  # price
            "seats_by_row": seats_by_row,
            "total_seats": session[6],   # capacity
            "available_seats": session[4]  # available_seats
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()