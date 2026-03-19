from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.models import TicketPurchase, TicketResponse
import logging
from datetime import datetime
from typing import List

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

        print(f"\n🔥 ПОКУПКА БИЛЕТОВ:")
        print(f"  Сеанс: {session_id}")
        print(f"  Места: {seat_ids}")
        print(f"  Пользователь: {purchase.user_id}")

        # 1. Получаем информацию о сеансе
        cursor.execute("""
            SELECT price, available_seats, movie_id, hall_id
            FROM sessions WHERE id = %s
        """, (purchase.session_id,))

        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Сеанс не найден")

        price = float(session[0])
        total_price = price * len(seat_ids)
        final_price = total_price
        used_bonus = 0

        # 2. Проверяем каждое место отдельно
        unavailable_seats = []
        booked_by_others = []
        
        for seat_id in seat_ids:
            # Проверяем в таблице tickets (купленные билеты)
            cursor.execute("""
                SELECT id FROM tickets
                WHERE session_id = %s AND seat_id = %s AND status != 'Возврат'
            """, (session_id, seat_id))
            
            if cursor.fetchone():
                unavailable_seats.append(seat_id)
                continue
            
            # Проверяем в таблице bookings (активные брони)
            if purchase.user_id:
                # Проверяем, не забронировано ли место другим пользователем
                cursor.execute("""
                    SELECT id FROM bookings
                    WHERE session_id = %s AND seat_id = %s 
                    AND status = 'active' AND user_id != %s
                """, (session_id, seat_id, purchase.user_id))
            else:
                # Для неавторизованных - проверяем любые активные брони
                cursor.execute("""
                    SELECT id FROM bookings
                    WHERE session_id = %s AND seat_id = %s AND status = 'active'
                """, (session_id, seat_id))
            
            if cursor.fetchone():
                booked_by_others.append(seat_id)
                continue
            
            # Проверяем, нет ли уже записи со статусом 'purchased' в bookings
            cursor.execute("""
                SELECT id FROM bookings
                WHERE session_id = %s AND seat_id = %s AND status = 'purchased'
            """, (session_id, seat_id))
            
            if cursor.fetchone():
                unavailable_seats.append(seat_id)

        # Если есть недоступные места
        if unavailable_seats:
            raise HTTPException(
                status_code=400,
                detail=f"Места {unavailable_seats} уже куплены"
            )
        
        if booked_by_others:
            raise HTTPException(
                status_code=400,
                detail=f"Места {booked_by_others} забронированы другим пользователем"
            )

        print(f"  ✅ Все места доступны для покупки")

        # 3. Обработка бонусов
        if hasattr(purchase, 'used_bonus') and purchase.used_bonus and purchase.used_bonus > 0 and purchase.user_id:
            used_bonus = purchase.used_bonus
            final_price = total_price - used_bonus
            
            if final_price < 0:
                final_price = 0
                used_bonus = total_price
            
            # Списание бонусов
            cursor.execute("""
                UPDATE customers
                SET bonus_points = bonus_points - %s
                WHERE id = %s
            """, (used_bonus, purchase.user_id))
            
            print(f"  🎟 Списано бонусов: {used_bonus}")

        # 4. Создаем билеты для каждого места
        tickets_created = []
        for seat_id in seat_ids:
            cursor.execute("""
                INSERT INTO tickets (session_id, seat_id, price, status, purchase_date, customer_id)
                VALUES (%s, %s, %s, 'Куплен', NOW(), %s)
                RETURNING id
            """, (purchase.session_id, seat_id, price, purchase.user_id))
            
            ticket_id = cursor.fetchone()[0]
            tickets_created.append(ticket_id)

            # 5. Обновляем бронь (если была)
            cursor.execute("""
                UPDATE bookings
                SET status = 'purchased'
                WHERE session_id = %s AND seat_id = %s AND status = 'active'
            """, (purchase.session_id, seat_id))

        print(f"  🎫 Создано билетов: {len(tickets_created)}")

        # 6. Обновляем количество доступных мест
        cursor.execute("""
            UPDATE sessions
            SET available_seats = available_seats - %s
            WHERE id = %s
        """, (len(seat_ids), session_id))

        # 7. Начисляем бонусы (10% от потраченной суммы)
        bonus_earned = 0
        if purchase.user_id:
            bonus_earned = int(total_price * 0.1)
            if bonus_earned > 0:
                cursor.execute("""
                    UPDATE customers
                    SET bonus_points = bonus_points + %s
                    WHERE id = %s
                """, (bonus_earned, purchase.user_id))
                print(f"  ⭐ Начислено бонусов: {bonus_earned}")

        conn.commit()

        # 8. Получаем информацию о первом билете для ответа
        cursor.execute("""
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
            WHERE t.id = %s
        """, (tickets_created[0],))

        first_ticket = cursor.fetchone()

        # 9. Получаем обновлённый баланс бонусов
        bonus_balance = None
        if purchase.user_id:
            cursor.execute("SELECT bonus_points FROM customers WHERE id = %s", (purchase.user_id,))
            balance = cursor.fetchone()
            bonus_balance = balance[0] if balance else 0

        print(f"  ✅ Покупка завершена успешно!\n")

        if first_ticket:
            return TicketResponse(
                id=tickets_created[0],
                session_id=session_id,
                seat_ids=seat_ids,
                total_price=final_price,
                original_price=total_price,
                used_bonus=used_bonus,
                bonus_earned=bonus_earned,
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
        logger.error(f"❌ Ошибка: {e}")
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
                "price": float(t[3]) if t[3] else 0,
                "purchase_date": t[4],
                "status": t[5],
                "movie_title": t[6],
                "session_time": t[7],
                "hall_name": t[8],
                "row": t[9],
                "seat": t[10]
            })
        return result
    except Exception as e:
        logger.error(f"❌ Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()