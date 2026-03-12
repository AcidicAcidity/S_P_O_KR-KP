from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.models import MovieResponse, MovieCreate, SessionResponse, HallResponse, UserResponse, TicketResponse
import logging
from typing import List
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Администрирование"])
logger = logging.getLogger(__name__)

# ========== ФИЛЬМЫ ==========

@router.get("/movies", response_model=List[MovieResponse])
async def get_all_movies():
    """
    Получить все фильмы для админ-панели
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, description, duration_minutes, genre,
                   release_date, rating, poster_url, director, actors, country, trailer_url
            FROM movies
            ORDER BY id DESC
        """)

        movies = cursor.fetchall()
        result = []
        for movie in movies:
            result.append({
                "id": movie[0],
                "title": movie[1],
                "description": movie[2],
                "duration_minutes": movie[3],
                "genre": movie[4],
                "release_date": movie[5],
                "rating": float(movie[6]) if movie[6] else None,
                "poster_url": movie[7],
                "director": movie[8],
                "actors": movie[9],
                "country": movie[10],
                "trailer_url": movie[11]
            })
        return result
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/movies", response_model=MovieResponse)
async def create_movie(movie: MovieCreate):
    """
    Создать новый фильм
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO movies (title, description, duration_minutes, genre,
                               release_date, rating, poster_url, director, actors, country, trailer_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, title, description, duration_minutes, genre,
                      release_date, rating, poster_url, director, actors, country, trailer_url
        """, (
            movie.title, movie.description, movie.duration_minutes, movie.genre,
            movie.release_date, movie.rating, movie.poster_url, movie.director,
            movie.actors, movie.country, movie.trailer_url
        ))

        new_movie = cursor.fetchone()
        conn.commit()

        return {
            "id": new_movie[0],
            "title": new_movie[1],
            "description": new_movie[2],
            "duration_minutes": new_movie[3],
            "genre": new_movie[4],
            "release_date": new_movie[5],
            "rating": float(new_movie[6]) if new_movie[6] else None,
            "poster_url": new_movie[7],
            "director": new_movie[8],
            "actors": new_movie[9],
            "country": new_movie[10],
            "trailer_url": new_movie[11]
        }
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/movies/{movie_id}", response_model=MovieResponse)
async def update_movie(movie_id: int, movie: MovieCreate):
    """
    Обновить информацию о фильме
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE movies
            SET title = %s, description = %s, duration_minutes = %s, genre = %s,
                release_date = %s, rating = %s, poster_url = %s, director = %s,
                actors = %s, country = %s, trailer_url = %s
            WHERE id = %s
            RETURNING id, title, description, duration_minutes, genre,
                      release_date, rating, poster_url, director, actors, country, trailer_url
        """, (
            movie.title, movie.description, movie.duration_minutes, movie.genre,
            movie.release_date, movie.rating, movie.poster_url, movie.director,
            movie.actors, movie.country, movie.trailer_url, movie_id
        ))

        updated_movie = cursor.fetchone()
        if not updated_movie:
            raise HTTPException(status_code=404, detail="Фильм не найден")

        conn.commit()

        return {
            "id": updated_movie[0],
            "title": updated_movie[1],
            "description": updated_movie[2],
            "duration_minutes": updated_movie[3],
            "genre": updated_movie[4],
            "release_date": updated_movie[5],
            "rating": float(updated_movie[6]) if updated_movie[6] else None,
            "poster_url": updated_movie[7],
            "director": updated_movie[8],
            "actors": updated_movie[9],
            "country": updated_movie[10],
            "trailer_url": updated_movie[11]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/movies/{movie_id}")
async def delete_movie(movie_id: int):
    """
    Удалить фильм
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Проверяем, есть ли сеансы у этого фильма
        cursor.execute("SELECT id FROM sessions WHERE movie_id = %s LIMIT 1", (movie_id,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Нельзя удалить фильм, у которого есть сеансы")

        cursor.execute("DELETE FROM movies WHERE id = %s RETURNING id", (movie_id,))
        deleted = cursor.fetchone()

        if not deleted:
            raise HTTPException(status_code=404, detail="Фильм не найден")

        conn.commit()
        return {"message": "Фильм успешно удален"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ========== СЕАНСЫ ==========

@router.get("/sessions")
async def get_all_sessions():
    """
    Получить все сеансы
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                s.id, s.movie_id, s.hall_id, s.start_time, s.price, s.available_seats,
                m.title as movie_title, h.name as hall_name
            FROM sessions s
            JOIN movies m ON s.movie_id = m.id
            JOIN halls h ON s.hall_id = h.id
            ORDER BY s.start_time DESC
        """)

        sessions = cursor.fetchall()
        result = []
        for s in sessions:
            result.append({
                "id": s[0],
                "movie_id": s[1],
                "hall_id": s[2],
                "start_time": s[3],
                "price": float(s[4]),
                "available_seats": s[5],
                "movie_title": s[6],
                "hall_name": s[7]
            })
        return result
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/sessions")
async def create_session(session_data: dict):
    """
    Создать новый сеанс
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Проверяем, что все необходимые поля есть
        required_fields = ["movie_id", "hall_id", "start_time", "price", "available_seats"]
        for field in required_fields:
            if field not in session_data:
                raise HTTPException(status_code=400, detail=f"Отсутствует поле {field}")

        cursor.execute("""
            INSERT INTO sessions (movie_id, hall_id, start_time, price, available_seats)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            int(session_data["movie_id"]),
            int(session_data["hall_id"]),
            session_data["start_time"],
            float(session_data["price"]),
            int(session_data["available_seats"])
        ))

        new_id = cursor.fetchone()[0]
        conn.commit()

        return {"id": new_id, "message": "Сеанс создан"}

    except Exception as e:
        conn.rollback()
        logger.error(f"Ошибка при создании сеанса: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: int):
    """
    Удалить сеанс
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Проверяем, есть ли билеты на этот сеанс
        cursor.execute("SELECT id FROM tickets WHERE session_id = %s LIMIT 1", (session_id,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Нельзя удалить сеанс, на который есть билеты")

        cursor.execute("DELETE FROM sessions WHERE id = %s RETURNING id", (session_id,))
        deleted = cursor.fetchone()

        if not deleted:
            raise HTTPException(status_code=404, detail="Сеанс не найден")

        conn.commit()
        return {"message": "Сеанс успешно удален"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ========== ЗАЛЫ ==========

@router.get("/halls")
async def get_all_halls():
    """
    Получить все залы
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, hall_type, capacity FROM halls ORDER BY id")

        halls = cursor.fetchall()
        result = []
        for h in halls:
            result.append({
                "id": h[0],
                "name": h[1],
                "hall_type": h[2],
                "capacity": h[3]
            })
        return result
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/halls")
async def create_hall(hall_data: dict):
    """
    Создать новый зал
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO halls (name, hall_type, capacity)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (
            hall_data["name"],
            hall_data["hall_type"],
            hall_data["capacity"]
        ))

        new_id = cursor.fetchone()[0]
        conn.commit()

        return {"id": new_id, "message": "Зал создан"}
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/halls/{hall_id}")
async def delete_hall(hall_id: int):
    """
    Удалить зал
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Проверяем, есть ли сеансы в этом зале
        cursor.execute("SELECT id FROM sessions WHERE hall_id = %s LIMIT 1", (hall_id,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Нельзя удалить зал, в котором есть сеансы")

        cursor.execute("DELETE FROM halls WHERE id = %s RETURNING id", (hall_id,))
        deleted = cursor.fetchone()

        if not deleted:
            raise HTTPException(status_code=404, detail="Зал не найден")

        conn.commit()
        return {"message": "Зал успешно удален"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ========== ПОЛЬЗОВАТЕЛИ ==========

@router.get("/users")
async def get_all_users():
    """
    Получить всех пользователей
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, full_name, email, phone, registration_date
            FROM customers
            ORDER BY registration_date DESC
        """)

        users = cursor.fetchall()
        result = []
        for u in users:
            result.append({
                "id": u[0],
                "full_name": u[1],
                "email": u[2],
                "phone": u[3],
                "registration_date": u[4]
            })
        return result
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ========== БИЛЕТЫ ==========

@router.get("/tickets")
async def get_all_tickets():
    """
    Получить все билеты
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
                seats.seat_number,
                c.full_name as customer_name
            FROM tickets t
            JOIN sessions s ON t.session_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN halls h ON s.hall_id = h.id
            JOIN seats ON t.seat_id = seats.id
            LEFT JOIN customers c ON t.customer_id = c.id
            ORDER BY t.purchase_date DESC
        """)

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
                "seat": t[10],
                "customer_name": t[11]
            })
        return result
    except Exception as e:
        logger.error(f"Ошибка при получении билетов: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/tickets/clear-refunded")
async def clear_refunded_tickets():
    """
    Удалить все возвращенные билеты из базы данных
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Удаляем все билеты со статусом 'Возврат'
        cursor.execute("DELETE FROM tickets WHERE status = 'Возврат'")

        # Получаем количество удаленных строк
        deleted_count = cursor.rowcount

        conn.commit()

        return {"count": deleted_count, "message": f"Удалено {deleted_count} возвращенных билетов"}

    except Exception as e:
        conn.rollback()
        logger.error(f"Ошибка при очистке возвращенных билетов: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/tickets/clear-all")
async def clear_all_tickets():
    """
    Удалить ВСЕ билеты (только для админа!)
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Получаем все сеансы и их залы для сброса мест
        cursor.execute("""
            SELECT s.id, h.capacity
            FROM sessions s
            JOIN halls h ON s.hall_id = h.id
        """)
        sessions = cursor.fetchall()

        # Получаем количество билетов до удаления
        cursor.execute("SELECT COUNT(*) FROM tickets")
        count_before = cursor.fetchone()[0]

        # Удаляем все билеты
        cursor.execute("DELETE FROM tickets")

        # Сбрасываем счетчик мест в каждом сеансе на полную вместимость
        for session_id, capacity in sessions:
            cursor.execute("""
                UPDATE sessions
                SET available_seats = %s
                WHERE id = %s
            """, (capacity, session_id))

        conn.commit()

        return {
            "message": f"Удалено {count_before} билетов. Все места освобождены.",
            "count": count_before
        }

    except Exception as e:
        conn.rollback()
        logger.error(f"Ошибка при очистке всех билетов: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: int):
    """
    Удалить билет (возврат) и освободить место
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Начинаем транзакцию
        conn.autocommit = False

        # Проверяем, существует ли билет и получаем информацию о сеансе
        cursor.execute("""
            SELECT t.id, t.session_id, t.status, s.available_seats, s.id
            FROM tickets t
            JOIN sessions s ON t.session_id = s.id
            WHERE t.id = %s
        """, (ticket_id,))

        ticket = cursor.fetchone()

        if not ticket:
            raise HTTPException(status_code=404, detail="Билет не найден")

        if ticket[2] == 'Возврат':
            raise HTTPException(status_code=400, detail="Билет уже возвращен")

        # Обновляем статус билета на "Возврат"
        cursor.execute("""
            UPDATE tickets
            SET status = 'Возврат'
            WHERE id = %s
            RETURNING id
        """, (ticket_id,))

        # Увеличиваем количество доступных мест в сеансе
        cursor.execute("""
            UPDATE sessions
            SET available_seats = available_seats + 1
            WHERE id = %s
            RETURNING available_seats
        """, (ticket[1],))

        updated_seats = cursor.fetchone()

        conn.commit()

        logger.info(f"✅ Билет {ticket_id} возвращен. Свободных мест в сеансе: {updated_seats[0]}")

        return {
            "message": "Билет успешно возвращен",
            "id": ticket_id,
            "available_seats": updated_seats[0]
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Ошибка при возврате билета: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.autocommit = True
        conn.close()


# ========== АРЕНДА ЗАЛОВ ==========

@router.get("/rentals")
async def get_all_rentals():
    """
    Получить все заявки на аренду (для админки)
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
                rc.price_per_hour,
                rc.total_price,
                rc.status,
                rc.notes,
                rc.created_at,
                r.id as renter_id,
                r.full_name as renter_name,
                r.email as renter_email,
                r.phone as renter_phone,
                r.company_name
            FROM rental_contracts rc
            JOIN halls h ON rc.hall_id = h.id
            JOIN renters r ON rc.renter_id = r.id
            ORDER BY rc.created_at DESC
        """)
        
        rentals = cursor.fetchall()
        result = []
        for r in rentals:
            result.append({
                "id": r[0],
                "contract_number": r[1],
                "hall_id": r[2],
                "hall_name": r[3],
                "start_time": r[4],
                "end_time": r[5],
                "duration_hours": float(r[6]),
                "price_per_hour": float(r[7]),
                "total_price": float(r[8]),
                "status": r[9],
                "notes": r[10],
                "created_at": r[11],
                "renter": {
                    "id": r[12],
                    "full_name": r[13],
                    "email": r[14],
                    "phone": r[15],
                    "company_name": r[16]
                }
            })
        return result
    except Exception as e:
        logger.error(f"Ошибка при получении заявок на аренду: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.patch("/rentals/{rental_id}")
async def update_rental_status(rental_id: int, status_data: dict):
    """
    Обновить статус заявки на аренду
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        new_status = status_data.get("status")
        
        if new_status not in ["pending", "confirmed", "cancelled", "completed"]:
            raise HTTPException(status_code=400, detail="Неверный статус")
        
        cursor.execute("""
            UPDATE rental_contracts
            SET status = %s
            WHERE id = %s
            RETURNING id, contract_number, status
        """, (new_status, rental_id))
        
        updated = cursor.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="Заявка не найдена")
        
        conn.commit()
        
        return {
            "id": updated[0],
            "contract_number": updated[1],
            "status": updated[2],
            "message": f"Статус изменен на {new_status}"
        }
        
    except Exception as e:
        logger.error(f"Ошибка при обновлении статуса: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/clear-all")
async def clear_all_rentals():
    """
    Полностью очищает все заявки на аренду из базы данных
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        cursor = conn.cursor()
        
        # Получаем количество записей перед удалением
        cursor.execute("SELECT COUNT(*) FROM rental_contracts")
        rentals_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM renters")
        renters_count = cursor.fetchone()[0]
        
        # Удаляем все договоры аренды
        cursor.execute("DELETE FROM rental_contracts")
        deleted_rentals = cursor.rowcount
        
        # Удаляем всех арендаторов
        cursor.execute("DELETE FROM renters")
        deleted_renters = cursor.rowcount
        
        conn.commit()
        
        logger.info(f"✅ Очищено договоров: {deleted_rentals}, арендаторов: {deleted_renters}")
        
        return {
            "success": True,
            "message": f"Удалено {deleted_rentals} договоров и {deleted_renters} арендаторов",
            "deleted_rentals": deleted_rentals,
            "deleted_renters": deleted_renters
        }
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Ошибка при очистке: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/")
async def get_all_rentals():
    """
    Получить все заявки на аренду с полной информацией
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
                rc.notes,
                rc.created_at,
                r.id as renter_id,
                r.full_name,
                r.email,
                r.phone,
                r.company_name
            FROM rental_contracts rc
            JOIN halls h ON rc.hall_id = h.id
            JOIN renters r ON rc.renter_id = r.id
            ORDER BY rc.created_at DESC
        """)
        
        rentals = cursor.fetchall()
        result = []
        
        for row in rentals:
            result.append({
                "id": row[0],
                "contract_number": row[1],
                "hall_id": row[2],
                "hall_name": row[3],
                "start_time": row[4].isoformat() if row[4] else None,
                "end_time": row[5].isoformat() if row[5] else None,
                "duration_hours": float(row[6]) if row[6] else 0,
                "total_price": float(row[7]) if row[7] else 0,
                "status": row[8],
                "notes": row[9],
                "created_at": row[10].isoformat() if row[10] else None,
                "renter": {
                    "id": row[11],
                    "full_name": row[12],
                    "email": row[13],
                    "phone": row[14],
                    "company_name": row[15]
                }
            })
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Ошибка при загрузке: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()