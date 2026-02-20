from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.models import TicketPurchase, TicketResponse
import logging
from datetime import datetime

router = APIRouter(prefix="/tickets", tags=["Билеты"])
logger = logging.getLogger(__name__)

@router.post("/purchase", response_model=TicketResponse)
async def purchase_ticket(purchase: TicketPurchase):
    """
    Купить билет
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        # Начинаем транзакцию
        conn.autocommit = False
        cursor = conn.cursor()

        # Проверяем, свободно ли место
        cursor.execute("""
            SELECT id FROM tickets
            WHERE session_id = %s AND seat_id = %s
            AND status != 'Возврат'
        """, (purchase.session_id, purchase.seat_id))

        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Это место уже занято")

        # Получаем цену и проверяем наличие мест
        cursor.execute("""
            SELECT price, available_seats, movie_id
            FROM sessions WHERE id = %s
        """, (purchase.session_id,))

        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Сеанс не найден")

        if session[1] <= 0:
            raise HTTPException(status_code=400, detail="Нет свободных мест")

        # Создаем билет
        cursor.execute("""
            INSERT INTO tickets (session_id, seat_id, price, status)
            VALUES (%s, %s, %s, 'Куплен')
            RETURNING id, purchase_date
        """, (purchase.session_id, purchase.seat_id, float(session[0])))

        ticket = cursor.fetchone()

        # Обновляем количество мест
        cursor.execute("""
            UPDATE sessions
            SET available_seats = available_seats - 1
            WHERE id = %s
        """, (purchase.session_id,))

        # Получаем полную информацию о билете
        cursor.execute("""
            SELECT
                t.id,
                t.session_id,
                t.seat_id,
                t.price,
                t.purchase_date,
                t.status,
                m.title as movie_title,
                s.start_time as session_time,
                h.name as hall_name,
                seats.row_number,
                seats.seat_number
            FROM tickets t
            JOIN sessions s ON t.session_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN halls h ON s.hall_id = h.id
            JOIN seats ON t.seat_id = seats.id
            WHERE t.id = %s
        """, (ticket[0],))

        full_ticket = cursor.fetchone()

        conn.commit()

        return TicketResponse(
            id=full_ticket[0],
            session_id=full_ticket[1],
            seat_id=full_ticket[2],
            price=float(full_ticket[3]),
            purchase_date=full_ticket[4],
            status=full_ticket[5],
            movie_title=full_ticket[6],
            session_time=full_ticket[7],
            hall_name=full_ticket[8],
            row=full_ticket[9],
            seat=full_ticket[10]
        )

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.autocommit = True
        conn.close()