from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
import logging

router = APIRouter(prefix="/halls", tags=["Залы"])
logger = logging.getLogger(__name__)

@router.get("/")
async def get_halls():
    """
    Получить список всех залов
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                id, 
                name, 
                hall_type, 
                capacity,
                price_per_hour,
                description,
                is_active
            FROM halls 
            ORDER BY id
        """)
        
        halls = cursor.fetchall()
        result = []
        
        for hall in halls:
            result.append({
                "id": hall[0],
                "name": hall[1],
                "hall_type": hall[2],
                "capacity": hall[3],
                "price_per_hour": float(hall[4]) if hall[4] else 0,
                "description": hall[5],
                "is_active": hall[6]
            })
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Ошибка при загрузке залов: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/{hall_id}")
async def get_hall(hall_id: int):
    """
    Получить информацию о конкретном зале
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                id, 
                name, 
                hall_type, 
                capacity,
                price_per_hour,
                description,
                is_active
            FROM halls 
            WHERE id = %s
        """, (hall_id,))
        
        hall = cursor.fetchone()
        if not hall:
            raise HTTPException(status_code=404, detail="Зал не найден")
        
        return {
            "id": hall[0],
            "name": hall[1],
            "hall_type": hall[2],
            "capacity": hall[3],
            "price_per_hour": float(hall[4]) if hall[4] else 0,
            "description": hall[5],
            "is_active": hall[6]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка при загрузке зала: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()