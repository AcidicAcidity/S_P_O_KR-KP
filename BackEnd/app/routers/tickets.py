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
    Учитывает:
    - Проверку бронирований
    - Списание бонусов (если указаны)
    - Начисление бонусов (только для зарегистрированных)
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        conn.autocommit = False
        cursor = conn.cursor()

        session_id = purchase.session_id
        seat_ids = purchase.seat_ids

        # Проверяем, что все места свободны (не куплены)
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
                detail=f"Места {occupied_ids} уже куплены"
            )

        # Проверяем, что места не забронированы (если бронь активна и принадлежит другому)
        # Если пользователь авторизован, можно разрешить покупать свои брони
        if purchase.user_id:
            cursor.execute(f"""
                SELECT seat_id FROM bookings
                WHERE session_id = %s
                    AND seat_id IN ({placeholders})
                    AND status = 'active'
                    AND (user_id != %s OR user_id IS NULL)
            """, [session_id] + seat_ids + [purchase.user_id])
        else:
            cursor.execute(f"""
                SELECT seat_id FROM bookings
                WHERE session_id = %s
                    AND seat_id IN ({placeholders})
                    AND status = 'active'
            """, [session_id] + seat_ids)

        booked = cursor.fetchall()
        if booked:
            booked_ids = [b[0] for b in booked]
            raise HTTPException(
                status_code=400,
                detail=f"Места {booked_ids} забронированы другим пользователем"
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

        # Расчёт итоговой цены с учётом бонусов
        final_price = price * len(seat_ids)
        used_bonus = 0

        # Если пользователь хочет использовать бонусы
        if purchase.use_bonus and purchase.user_id:
            cursor.execute("""
                SELECT bonus_points FROM customers
                WHERE id = %s
            """, (purchase.user_id,))
            user_bonus = cursor.fetchone()
            
            if user_bonus and user_bonus[0] > 0:
                max_discount = final_price * 0.3  # Максимум 30% оплаты бонусами
                available_bonus_rub = user_bonus[0]  # 1 бонус = 1 рубль
                
                used_bonus = min(int(max_discount), available_bonus_rub, final_price)
                if used_bonus > 0:
                    final_price -= used_bonus
                    
                    # Списание бонусов
                    cursor.execute("""
                        UPDATE customers
                        SET bonus_points = bonus_points - %s
                        WHERE id = %s
                    """, (used_bonus, purchase.user_id))

        # Создаем билеты для каждого места
        tickets_created = []
        for seat_id in seat_ids:
            cursor.execute("""
                INSERT INTO tickets (session_id, seat_id, price, status, purchase_date, customer_id)
                VALUES (%s, %s, %s, 'Куплен', NOW(), %s)
                RETURNING id
            """, (purchase.session_id, seat_id, price, purchase.user_id))
            
            ticket_id = cursor.fetchone()[0]
            tickets_created.append(ticket_id)

            # Удаляем бронь, если была
            cursor.execute("""
                UPDATE bookings
                SET status = 'purchased'
                WHERE session_id = %s AND seat_id = %s AND status = 'active'
            """, (purchase.session_id, seat_id))

        # Обновляем количество доступных мест
        cursor.execute("""
            UPDATE sessions
            SET available_seats = available_seats - %s
            WHERE id = %s
        """, (len(seat_ids), session_id))

        # Начисляем бонусы (10% от потраченной суммы)
        if purchase.user_id:
            bonus_earned = int(price * len(seat_ids) * 0.1)  # 10% бонусами
            if bonus_earned > 0:
                cursor.execute("""
                    UPDATE customers
                    SET bonus_points = bonus_points + %s
                    WHERE id = %s
                """, (bonus_earned, purchase.user_id))

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
        if tickets_info:
            first_ticket = tickets_info[0]
            
            # Получаем обновлённый баланс бонусов
            bonus_balance = None
            if purchase.user_id:
                cursor.execute("SELECT bonus_points FROM customers WHERE id = %s", (purchase.user_id,))
                balance = cursor.fetchone()
                bonus_balance = balance[0] if balance else 0

            return TicketResponse(
                id=tickets_created[0],
                session_id=session_id,
                seat_ids=seat_ids,
                total_price=final_price,
                original_price=price * len(seat_ids),
                used_bonus=used_bonus,
                bonus_earned=bonus_earned if purchase.user_id else 0,
                bonus_balance=bonus_balance,
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

@router.get("/user/{user_id}")
async def get_user_tickets(user_id: int):
    """
    Получить все билеты пользователя
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                t.id, t.session_id, t.seat_id, t.price, t.purchase_date, t.status,
                m.title as movie_title, s.start_time as session_time,
                h.name as hall_name, seats.row_number, seats.seat_number
            FROM tickets t
            JOIN sessions s ON t.session_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN halls h ON s.hall_id = h.id
            JOIN seats ON t.seat_id = seats.id
            WHERE t.customer_id = %s
            ORDER BY s.start_time DESC
        """, (user_id,))
        
        tickets = cursor.fetchall()
        result = []
        for t in tickets:
            result.append({
                "id": t[0],
                "session_id": t[1],
                "seat_id": t[2],
                "price": float(t[3]),
                "purchase_date": t[4],
                "status": t[5],
                "movie_title": t[6],
                "session_time": t[7],
                "hall_name": t[8],
                "row": t[9],
                "seat": t[10]
            })
        return result
    finally:
        conn.close()