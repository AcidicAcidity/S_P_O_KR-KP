from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.models import Hall, Seat
import logging
from typing import List

router = APIRouter(prefix="/halls", tags=["Залы"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[Hall])
async def get_halls():
    """Список всех залов"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, capacity, hall_type FROM halls ORDER BY id")
        halls = cursor.fetchall()
        return [
            Hall(id=h[0], name=h[1], capacity=h[2], hall_type=h[3])
            for h in halls
        ]
    finally:
        conn.close()

@router.get("/{hall_id}", response_model=Hall)
async def get_hall(hall_id: int):
    """Информация о конкретном зале"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, name, capacity, hall_type FROM halls WHERE id = %s",
            (hall_id,)
        )
        hall = cursor.fetchone()
        if not hall:
            raise HTTPException(status_code=404, detail="Зал не найден")

        return Hall(id=hall[0], name=hall[1], capacity=hall[2], hall_type=hall[3])
    finally:
        conn.close()

@router.get("/{hall_id}/seats", response_model=List[Seat])
async def get_hall_seats(hall_id: int):
    """Схема всех мест в зале"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, row_number, seat_number, seat_type
            FROM seats
            WHERE hall_id = %s
            ORDER BY row_number, seat_number
        """, (hall_id,))

        seats = cursor.fetchall()
        return [
            Seat(id=s[0], row_number=s[1], seat_number=s[2], seat_type=s[3])
            for s in seats
        ]
    finally:
        conn.close()