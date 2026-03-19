from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_db_connection
import logging
from datetime import datetime, timedelta
from typing import Optional, List
import json

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
    renter_id: Optional[int] = None

# ============ ПУБЛИЧНЫЕ ЭНДПОИНТЫ ============

@router.post("/", response_model=RentalResponse)
async def create_rental(rental: RentalCreate):
    """
    Создать заявку на аренду зала с учетом дополнительных услуг
    """
    print(f"📥 Получен запрос: {rental}")
    print(f"📦 Доп. услуги: {rental.service_ids}")
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        # Преобразуем строки в datetime (UTC)
        start_time_utc = datetime.fromisoformat(rental.start_time.replace('Z', '+00:00'))
        end_time_utc = datetime.fromisoformat(rental.end_time.replace('Z', '+00:00'))
        
        # Добавляем 3 часа для московского времени
        start_time = start_time_utc + timedelta(hours=3)
        end_time = end_time_utc + timedelta(hours=3)
        
        print(f"🕐 UTC время: {start_time_utc} - {end_time_utc}")
        print(f"🕐 МСК время: {start_time} - {end_time}")
        
        cursor = conn.cursor()
        
        # Проверяем существование зала
        cursor.execute("""
            SELECT id, name, price_per_hour 
            FROM halls 
            WHERE id = %s
        """, (rental.hall_id,))
        
        hall = cursor.fetchone()
        if not hall:
            raise HTTPException(status_code=404, detail=f"Зал с id {rental.hall_id} не найден")
        
        hall_id, hall_name, price_per_hour = hall
        
        # Проверяем цену зала
        if price_per_hour is None or price_per_hour <= 0:
            price_per_hour = 1000.00
            print(f"⚠️ Цена для зала {hall_name} не установлена, используется 1000 руб/час")
        else:
            price_per_hour = float(price_per_hour)
        
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
        print(f"👤 Создан арендатор с ID: {renter_id}")
        
        # Считаем часы
        hours = (end_time - start_time).total_seconds() / 3600
        
        # Определяем скидку по МСК времени
        start_hour = start_time.hour
        discount_percent = 0
        
        if start_hour == 10:
            discount_percent = 20
        elif start_hour == 22:
            discount_percent = 30
            
        print(f"🎯 Час начала (МСК): {start_hour}, скидка: {discount_percent}%")
        
        # Базовая цена зала (БЕЗ СКИДКИ)
        base_price = hours * price_per_hour
        base_price = round(base_price, 2)
        
        # Применяем скидку
        discount_amount = base_price * (discount_percent / 100)
        discount_amount = round(discount_amount, 2)
        price_after_discount = base_price - discount_amount
        
        # Рассчитываем стоимость дополнительных услуг
        services_price = 0
        services_details = []
        
        services_catalog = {
            "popcorn": {"name": "Попкорн-комбо", "price": 1500, "type": "fixed"},
            "console": {"name": "Игровая приставка", "price": 2000, "type": "per_hour"},
            "karaoke": {"name": "Караоке", "price": 2500, "type": "per_hour"},
            "decoration": {"name": "Украшение зала", "price": 3000, "type": "fixed"}
        }
        
        if rental.service_ids and len(rental.service_ids) > 0:
            for service_id in rental.service_ids:
                if service_id in services_catalog:
                    service = services_catalog[service_id]
                    
                    if service["type"] == "per_hour":
                        service_cost = service["price"] * hours
                    else:
                        service_cost = service["price"]
                    
                    services_price += service_cost
                    services_details.append({
                        "id": service_id,
                        "name": service["name"],
                        "price": service["price"],
                        "type": service["type"],
                        "hours": hours if service["type"] == "per_hour" else None,
                        "total": service_cost
                    })
        
        services_price = round(services_price, 2)
        
        # Общая стоимость
        total_price = price_after_discount + services_price
        total_price = round(total_price, 2)
        
        print(f"\n💰 РАСЧЕТ ДЛЯ ЗАЛА {hall_name}:")
        print(f"  📅 Время: {start_time.strftime('%d.%m.%Y %H:%M')} - {end_time.strftime('%d.%m.%Y %H:%M')}")
        print(f"  ⏱ Часов: {hours}")
        print(f"  💵 Цена за час: {price_per_hour:,.0f} руб")
        print(f"  📊 Базовая цена: {base_price:,.0f} руб")
        if discount_percent > 0:
            print(f"  🏷 Скидка: {discount_percent}% (-{discount_amount:,.0f} руб)")
        print(f"  💰 Цена зала со скидкой: {price_after_discount:,.0f} руб")
        if services_price > 0:
            print(f"  🎯 Услуги: {services_price:,.0f} руб")
            for s in services_details:
                print(f"     - {s['name']}: {s['total']:,.0f} руб")
        print(f"  💎 ИТОГО К ОПЛАТЕ: {total_price:,.0f} руб\n")
        
        # Генерируем номер договора
        contract_number = f"R-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{rental.hall_id}"
        
        # Сохраняем информацию в базу
        cursor.execute("""
            INSERT INTO rental_contracts 
            (contract_number, renter_id, hall_id, start_time, end_time, 
             duration_hours, price_per_hour, total_price, status, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
            RETURNING id, contract_number
        """, (
            contract_number, renter_id, rental.hall_id, 
            start_time, end_time,
            hours, price_per_hour, 
            total_price,
            rental.notes
        ))
        
        contract_id, contract_num = cursor.fetchone()
        
        conn.commit()
        
        result = {
            "id": contract_id,
            "contract_number": contract_num,
            "hall_name": hall_name,
            "start_time": start_time,
            "end_time": end_time,
            "total_price": total_price,
            "status": "pending",
            "renter_id": renter_id  # ВАЖНО: возвращаем ID арендатора
        }
        
        print(f"✅ Заявка создана: {result}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Ошибка создания аренды: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/user/{renter_id}")
async def get_user_rentals(renter_id: int):
    """
    Получить аренду по ID арендатора (из таблицы renters)
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        cursor = conn.cursor()
        
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
                rc.created_at,
                rc.renter_id
            FROM rental_contracts rc
            JOIN halls h ON rc.hall_id = h.id
            WHERE rc.renter_id = %s
            ORDER BY rc.created_at DESC
        """, (renter_id,))
        
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
                "created_at": r[9].isoformat() if r[9] else None,
                "renter_id": r[10]
            })
        
        print(f"📦 Найдено {len(result)} записей аренды для рентера {renter_id}")
        return result
        
    except Exception as e:
        print(f"❌ Ошибка при загрузке аренды: {e}")
        return []
    finally:
        conn.close()

# ============ АДМИНСКИЕ ЭНДПОИНТЫ ============

@router.get("/admin/rentals")
async def admin_get_all_rentals():
    """
    Получить все заявки на аренду (для админа)
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                rc.id,
                rc.contract_number,
                rc.renter_id,
                r.full_name,
                r.email,
                r.phone,
                r.company_name,
                rc.hall_id,
                h.name as hall_name,
                rc.start_time,
                rc.end_time,
                rc.duration_hours,
                rc.total_price,
                rc.status,
                rc.notes,
                rc.created_at
            FROM rental_contracts rc
            JOIN renters r ON rc.renter_id = r.id
            JOIN halls h ON rc.hall_id = h.id
            ORDER BY rc.created_at DESC
        """)
        
        rentals = cursor.fetchall()
        result = []
        
        for r in rentals:
            result.append({
                "id": r[0],
                "contract_number": r[1],
                "renter_id": r[2],
                "renter": {
                    "full_name": r[3],
                    "email": r[4],
                    "phone": r[5],
                    "company_name": r[6]
                },
                "hall_id": r[7],
                "hall_name": r[8],
                "start_time": r[9].isoformat() if r[9] else None,
                "end_time": r[10].isoformat() if r[10] else None,
                "duration_hours": float(r[11]) if r[11] else 0,
                "total_price": float(r[12]) if r[12] else 0,
                "status": r[13],
                "notes": r[14],
                "created_at": r[15].isoformat() if r[15] else None
            })
        
        return result
        
    except Exception as e:
        print(f"❌ Ошибка при загрузке всех заявок: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.patch("/admin/rentals/{rental_id}")
async def admin_update_rental_status(rental_id: int, status_data: dict):
    """
    Обновить статус заявки на аренду
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        status = status_data.get("status")
        if not status:
            raise HTTPException(status_code=400, detail="Статус не указан")
        
        valid_statuses = ["pending", "confirmed", "completed", "cancelled"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Недопустимый статус. Допустимые: {valid_statuses}")
        
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE rental_contracts 
            SET status = %s 
            WHERE id = %s 
            RETURNING id, contract_number, status
        """, (status, rental_id))
        
        updated = cursor.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="Заявка не найдена")
        
        conn.commit()
        
        return {
            "id": updated[0],
            "contract_number": updated[1],
            "status": updated[2],
            "message": f"Статус изменен на {status}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Ошибка при обновлении статуса: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/admin/rentals/clear-all")
async def admin_clear_all_rentals():
    """
    Удалить все завершенные и отмененные заявки
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT COUNT(*) FROM rental_contracts 
            WHERE status IN ('pending', 'confirmed')
        """)
        active_count = cursor.fetchone()[0]
        
        if active_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Невозможно удалить все заявки. Есть {active_count} активных заявок"
            )
        
        cursor.execute("""
            DELETE FROM rental_contracts 
            WHERE status IN ('completed', 'cancelled')
            RETURNING id
        """)
        
        deleted_ids = cursor.fetchall()
        deleted_count = len(deleted_ids)
        
        conn.commit()
        
        return {
            "message": f"Удалено {deleted_count} заявок",
            "deleted_count": deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Ошибка при очистке заявок: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/admin/rentals/{rental_id}")
async def admin_delete_rental(rental_id: int):
    """
    Удалить конкретную заявку
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("SELECT status FROM rental_contracts WHERE id = %s", (rental_id,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Заявка не найдена")
        
        status = result[0]
        
        if status in ['pending', 'confirmed']:
            raise HTTPException(
                status_code=400, 
                detail="Нельзя удалить активную заявку"
            )
        
        cursor.execute("DELETE FROM rental_contracts WHERE id = %s", (rental_id,))
        conn.commit()
        
        return {"message": f"Заявка {rental_id} удалена"}
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Ошибка при удалении заявки: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()