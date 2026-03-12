from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_db_connection
import logging
from datetime import datetime, timedelta
from typing import List, Optional

router = APIRouter(prefix="/bookings", tags=["Бронирование"])
logger = logging.getLogger(__name__)

class BookingCreate(BaseModel):
    session_id: int
    seat_ids: List[int]
    user_id: Optional[int] = None

class BookingResponse(BaseModel):
    id: int
    session_id: int
    seat_id: int
    expires_at: datetime
    status: str

@router.post("/", response_model=List[BookingResponse])
async def create_booking(booking: BookingCreate):
    """
    Забронировать места на 15 минут
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        created_bookings = []

        for seat_id in booking.seat_ids:
            # Проверяем, свободно ли место (нет активной брони и не куплено)
            cursor.execute("""
                SELECT id FROM bookings 
                WHERE session_id = %s AND seat_id = %s AND status = 'active'
            """, (booking.session_id, seat_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail=f"Место {seat_id} уже забронировано")

            cursor.execute("""
                SELECT id FROM tickets 
                WHERE session_id = %s AND seat_id = %s
            """, (booking.session_id, seat_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail=f"Место {seat_id} уже куплено")

            # Создаём бронь
            cursor.execute("""
                INSERT INTO bookings (session_id, seat_id, user_id, expires_at, status)
                VALUES (%s, %s, %s, NOW() + INTERVAL '15 minutes', 'active')
                RETURNING id, session_id, seat_id, expires_at, status
            """, (booking.session_id, seat_id, booking.user_id))

            new_booking = cursor.fetchone()
            created_bookings.append({
                "id": new_booking[0],
                "session_id": new_booking[1],
                "seat_id": new_booking[2],
                "expires_at": new_booking[3],
                "status": new_booking[4]
            })

        conn.commit()
        return created_bookings

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Ошибка бронирования: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/{booking_id}")
async def cancel_booking(booking_id: int):
    """
    Отменить бронь
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE bookings 
            SET status = 'cancelled' 
            WHERE id = %s AND status = 'active'
            RETURNING id
        """, (booking_id,))

        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Бронь не найдена или уже неактивна")

        conn.commit()
        return {"message": "Бронь отменена"}

    except Exception as e:
        logger.error(f"Ошибка отмены: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()