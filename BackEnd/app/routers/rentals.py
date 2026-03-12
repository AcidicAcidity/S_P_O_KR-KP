from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_db_connection
import logging
from datetime import datetime
from typing import Optional, List

router = APIRouter(prefix="/rentals", tags=["Аренда залов"])
logger = logging.getLogger(__name__)

# Модели
class RenterCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    company_name: Optional[str] = None

class RentalCreate(BaseModel):
    hall_id: int
    start_time: str
    end_time: str
    renter: RenterCreate
    service_ids: Optional[List[str]] = []
    notes: Optional[str] = None

class RentalResponse(BaseModel):
    id: int
    contract_number: str
    hall_name: str
    start_time: datetime
    end_time: datetime
    total_price: float
    status: str

@router.post("/", response_model=RentalResponse)
async def create_rental(rental: RentalCreate):
    """
    Создать заявку на аренду зала
    """
    print(f"📥 Получен запрос: {rental}")
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        # Преобразуем строки в datetime
        start_time = datetime.fromisoformat(rental.start_time.replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(rental.end_time.replace('Z', '+00:00'))
        
        cursor = conn.cursor()
        
        # Проверяем, существует ли таблица rental_contracts
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'rental_contracts'
            )
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            # Создаём таблицы, если их нет
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS renters (
                    id SERIAL PRIMARY KEY,
                    full_name VARCHAR(200) NOT NULL,
                    email VARCHAR(200) NOT NULL,
                    phone VARCHAR(20) NOT NULL,
                    company_name VARCHAR(200),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rental_contracts (
                    id SERIAL PRIMARY KEY,
                    contract_number VARCHAR(50) UNIQUE NOT NULL,
                    renter_id INTEGER REFERENCES renters(id) ON DELETE CASCADE,
                    hall_id INTEGER NOT NULL,
                    start_time TIMESTAMP NOT NULL,
                    end_time TIMESTAMP NOT NULL,
                    duration_hours FLOAT NOT NULL,
                    price_per_hour FLOAT NOT NULL,
                    total_price FLOAT NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
        
        # Проверяем, свободен ли зал
        cursor.execute("""
            SELECT id FROM rental_contracts 
            WHERE hall_id = %s 
            AND status IN ('pending', 'confirmed')
            AND (
                (start_time <= %s AND end_time > %s) OR
                (start_time < %s AND end_time >= %s) OR
                (start_time >= %s AND end_time <= %s)
            )
        """, (
            rental.hall_id,
            start_time, start_time,
            end_time, end_time,
            start_time, end_time
        ))
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Зал занят в указанное время")
        
        # Создаём арендатора
        cursor.execute("""
            INSERT INTO renters (full_name, email, phone, company_name)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (
            rental.renter.full_name,
            rental.renter.email,
            rental.renter.phone,
            rental.renter.company_name
        ))
        renter_id = cursor.fetchone()[0]
        
        # Получаем цену зала (преобразуем Decimal в float)
        cursor.execute("SELECT name, COALESCE(price_per_hour, 500) as price_per_hour FROM halls WHERE id = %s", (rental.hall_id,))
        hall = cursor.fetchone()
        if not hall:
            raise HTTPException(status_code=404, detail="Зал не найден")
        
        hall_name = hall[0]
        price_per_hour = float(hall[1])  # 500 fallback if NULL
        
        # Считаем часы и цену
        hours = (end_time - start_time).total_seconds() / 3600
        total_price = hours * price_per_hour
        
        # Генерируем номер договора
        contract_number = f"R-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{rental.hall_id}"
        
        # Создаём договор
        cursor.execute("""
            INSERT INTO rental_contracts 
            (contract_number, renter_id, hall_id, start_time, end_time, 
             duration_hours, price_per_hour, total_price, status, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
            RETURNING id, contract_number
        """, (
            contract_number, renter_id, rental.hall_id, 
            start_time, end_time,
            hours, price_per_hour, total_price,
            rental.notes
        ))
        
        contract_id, contract_num = cursor.fetchone()
        
        conn.commit()
        
        return {
            "id": contract_id,
            "contract_number": contract_num,
            "hall_name": hall_name,
            "start_time": start_time,
            "end_time": end_time,
            "total_price": total_price,
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Ошибка создания аренды: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/user/{user_id}")
async def get_user_rentals(user_id: int):
    """
    Получить аренду пользователя по ID арендатора
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        cursor = conn.cursor()
        
        # Проверяем существование пользователя
        cursor.execute("SELECT id FROM renters WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return []  # Возвращаем пустой массив, если пользователь не найден
        
        cursor.execute("""
            SELECT 
                rc.id,
                rc.contract_number,
                rc.hall_id,
                h.name as hall_name,
                rc.start_time,
                rc.end_time,
                rc.duration_hours,
                rc.total_price,
                rc.status,
                rc.created_at
            FROM rental_contracts rc
            JOIN halls h ON rc.hall_id = h.id
            WHERE rc.renter_id = %s
            ORDER BY rc.created_at DESC
        """, (user_id,))
        
        rentals = cursor.fetchall()
        result = []
        
        for r in rentals:
            result.append({
                "id": r[0],
                "contract_number": r[1],
                "hall_id": r[2],
                "hall_name": r[3],
                "start_time": r[4].isoformat() if r[4] else None,
                "end_time": r[5].isoformat() if r[5] else None,
                "duration_hours": float(r[6]) if r[6] else 0,
                "total_price": float(r[7]) if r[7] else 0,
                "status": r[8],
                "created_at": r[9].isoformat() if r[9] else None
            })
        
        print(f"📦 Найдено {len(result)} записей аренды для пользователя {user_id}")
        return result
        
    except Exception as e:
        print(f"❌ Ошибка при загрузке аренды пользователя: {e}")
        return []  # Возвращаем пустой массив в случае ошибки
    finally:
        conn.close()