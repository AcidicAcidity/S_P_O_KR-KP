from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.models import TicketPurchase, TicketResponse
import logging
from datetime import datetime

router = APIRouter(prefix="/tickets", tags=["Билеты"])
logger = logging.getLogger(__name__)

@router.post("/purchase", response_model=TicketResponse)
async def purchase_tickets(purchase: TicketPurchase):
    """
    Купить билеты (несколько мест сразу)
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        conn.autocommit = False
        cursor = conn.cursor()

        session_id = purchase.session_id
        seat_ids = purchase.seat_ids

        # Проверяем, что все места свободны
        placeholders = ','.join(['%s'] * len(seat_ids))
        cursor.execute(f"""
            SELECT seat_id FROM tickets
            WHERE session_id = %s
                AND seat_id IN ({placeholders})
                AND status != 'Возврат'
        """, [session_id] + seat_ids)

        occupied = cursor.fetchall()
        if occupied:
            occupied_ids = [o[0] for o in occupied]
            raise HTTPException(
                status_code=400,
                detail=f"Места {occupied_ids} уже заняты"
            )

        # Получаем цену сеанса
        cursor.execute("SELECT price, movie_id FROM sessions WHERE id = %s", (session_id,))
        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Сеанс не найден")

        price = float(session[0])

        # Создаем билеты
        tickets_created = []
        for seat_id in seat_ids:
            cursor.execute("""
                INSERT INTO tickets (session_id, seat_id, price, status)
                VALUES (%s, %s, %s, 'Куплен')
                RETURNING id
            """, (session_id, seat_id, price))
            ticket_id = cursor.fetchone()[0]
            tickets_created.append(ticket_id)

        # Обновляем количество доступных мест
        cursor.execute("""
            UPDATE sessions
            SET available_seats = available_seats - %s
            WHERE id = %s
        """, (len(seat_ids), session_id))

        # Получаем информацию о купленных билетах
        placeholders = ','.join(['%s'] * len(tickets_created))
        cursor.execute(f"""
            SELECT
                t.id,
                t.seat_id,
                s.price,
                s.start_time,
                m.title,
                h.name,
                seats.row_number,
                seats.seat_number
            FROM tickets t
            JOIN sessions s ON t.session_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN halls h ON s.hall_id = h.id
            JOIN seats ON t.seat_id = seats.id
            WHERE t.id IN ({placeholders})
        """, tickets_created)

        tickets_info = cursor.fetchall()

        conn.commit()

        # Формируем ответ
        seats_list = [f"{t[6]} ряд {t[7]} место" for t in tickets_info]

        return TicketResponse(
            id=tickets_created[0] if len(tickets_created) == 1 else tickets_created,
            session_id=session_id,
            seat_ids=seat_ids,
            total_price=price * len(seat_ids),
            purchase_date=datetime.now(),
            status="Куплен",
            movie_title=tickets_info[0][4],
            session_time=tickets_info[0][3],
            hall_name=tickets_info[0][5],
            seats=seats_list
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