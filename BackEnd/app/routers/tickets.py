from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.models import TicketPurchase, TicketResponse
import logging
from datetime import datetime

# СОЗДАЕМ РОУТЕР
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

        # Получаем цену и проверяем наличие мест
        cursor.execute("""
            SELECT price, available_seats, movie_id, hall_id
            FROM sessions WHERE id = %s
        """, (purchase.session_id,))

        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Сеанс не найден")

        price = float(session[0])

        # Создаем билеты для каждого места
        tickets_created = []
        for seat_id in seat_ids:
            cursor.execute("""
                INSERT INTO tickets (session_id, seat_id, price, status, purchase_date)
                VALUES (%s, %s, %s, 'Куплен', NOW())
                RETURNING id
            """, (purchase.session_id, seat_id, price))
            
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

        # Формируем ответ - возвращаем информацию о первом билете
        first_ticket = tickets_info[0] if tickets_info else None
        
        if first_ticket:
            return TicketResponse(
                id=tickets_created[0],
                session_id=session_id,
                seat_ids=seat_ids,
                total_price=price * len(seat_ids),
                purchase_date=datetime.now(),
                status="Куплен",
                movie_title=first_ticket[4],
                session_time=first_ticket[3],
                hall_name=first_ticket[5],
                row=first_ticket[6],
                seat=first_ticket[7],
                customer_name=purchase.customer_name
            )
        else:
            raise HTTPException(status_code=500, detail="Не удалось создать билеты")

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
