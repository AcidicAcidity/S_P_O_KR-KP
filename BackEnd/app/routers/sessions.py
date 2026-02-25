from fastapi import APIRouter, HTTPException, Query
from app.database import get_db_connection
from app.models import SessionInfo, SessionSeatsResponse
import logging
from typing import Optional
from datetime import date

router = APIRouter(prefix="/sessions", tags=["Сеансы"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=list)
async def get_sessions(
    date_from: Optional[date] = Query(None, description="Дата от"),
    date_to: Optional[date] = Query(None, description="Дата до"),
    movie_id: Optional[int] = Query(None, description="ID фильма"),
    hall_id: Optional[int] = Query(None, description="ID зала")
):
    """Получить все сеансы с фильтрацией"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        query = """
            SELECT
                s.id, s.start_time, s.price, s.available_seats,
                h.id, h.name, h.hall_type,
                m.id, m.title
            FROM sessions s
            JOIN halls h ON s.hall_id = h.id
            JOIN movies m ON s.movie_id = m.id
            WHERE 1=1
        """
        params = []

        if date_from:
            query += " AND DATE(s.start_time) >= %s"
            params.append(date_from)
        if date_to:
            query += " AND DATE(s.start_time) <= %s"
            params.append(date_to)
        if movie_id:
            query += " AND s.movie_id = %s"
            params.append(movie_id)
        if hall_id:
            query += " AND s.hall_id = %s"
            params.append(hall_id)

        query += " ORDER BY s.start_time"

        cursor.execute(query, params)
        sessions = cursor.fetchall()

        return [
            {
                "id": s[0],
                "start_time": s[1],
                "price": float(s[2]),
                "available_seats": s[3],
                "hall": {"id": s[4], "name": s[5], "type": s[6]},
                "movie": {"id": s[7], "title": s[8]}
            }
            for s in sessions
        ]
    finally:
        conn.close()

@router.get("/{session_id}")
async def get_session_detail(session_id: int):
    """Получить детальную информацию о сеансе"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                s.id, s.start_time, s.price, s.available_seats,
                h.id, h.name, h.hall_type, h.capacity,
                m.id, m.title, m.poster_url, m.duration_minutes
            FROM sessions s
            JOIN halls h ON s.hall_id = h.id
            JOIN movies m ON s.movie_id = m.id
            WHERE s.id = %s
        """, (session_id,))

        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Сеанс не найден")

        return {
            "id": session[0],
            "start_time": session[1],
            "price": float(session[2]),
            "available_seats": session[3],
            "hall": {
                "id": session[4],
                "name": session[5],
                "type": session[6],
                "capacity": session[7]
            },
            "movie": {
                "id": session[8],
                "title": session[9],
                "poster": session[10],
                "duration": session[11]
            }
        }
    finally:
        conn.close()

@router.get("/{session_id}/seats", response_model=SessionSeatsResponse)
async def get_session_seats(session_id: int):
    """Получить все места на конкретный сеанс"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Информация о сеансе
        cursor.execute("""
            SELECT
                s.price, s.available_seats,
                h.id, h.name, h.capacity,
                m.title
            FROM sessions s
            JOIN halls h ON s.hall_id = h.id
            JOIN movies m ON s.movie_id = m.id
            WHERE s.id = %s
        """, (session_id,))

        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Сеанс не найден")

        # Все места с отметкой о доступности
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
        """, (session_id, session[2]))

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

        return SessionSeatsResponse(
            session_id=session_id,
            movie_title=session[5],
            start_time=session[0],  # нужно добавить start_time в запрос
            hall_name=session[3],
            price=float(session[0]),
            seats_by_row=seats_by_row,
            total_seats=session[4],
            available_seats=session[1]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()