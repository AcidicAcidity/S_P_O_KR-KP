from fastapi import APIRouter, HTTPException, Query
from app.database import get_db_connection
from app.models import MovieResponse, MovieCardResponse, TodaySession
import logging
from typing import List

router = APIRouter(prefix="/movies", tags=["Фильмы"])
logger = logging.getLogger(__name__)

@router.get("/now-playing", response_model=List[MovieCardResponse])
async def get_now_playing():
    """Фильмы с сеансами на сегодня"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, poster_url, genre, rating
            FROM movies
            ORDER BY rating DESC
        """)
        movies = cursor.fetchall()

        result = []
        for movie in movies:
            # Сеансы для каждого фильма
            cursor.execute("""
                SELECT
                    s.id,
                    to_char(s.start_time, 'HH24:MI'),
                    s.price,
                    h.name as hall_name,
                    to_char(s.start_time, 'YYYY-MM-DD') as session_date
                FROM sessions s
                JOIN halls h ON s.hall_id = h.id
                WHERE s.movie_id = %s
                    AND s.start_time > CURRENT_TIMESTAMP
                ORDER BY s.start_time
                LIMIT 10
            """, (movie[0],))

            sessions = cursor.fetchall()
            today_sessions = []
            for s in sessions:
                today_sessions.append({
                    "session_id": s[0],
                    "time": s[1],
                    "price": float(s[2]),
                    "hall_name": s[3],
                    "session_date": s[4]
                })

            result.append({
                "id": movie[0],
                "title": movie[1],
                "poster_url": movie[2],
                "genre": movie[3],
                "rating": float(movie[4]) if movie[4] else None,
                "today_sessions": today_sessions
            })

        return result

    except Exception as e:
        logger.error(f"Ошибка в get_now_playing: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@router.get("/{movie_id}", response_model=MovieResponse)
async def get_movie(movie_id: int):
    """Детальная информация о фильме"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        
        # Получаем данные фильма
        cursor.execute("""
            SELECT id, title, description, duration_minutes,
                   genre, release_date, rating, poster_url,
                   director, actors, country, trailer_url
            FROM movies
            WHERE id = %s
        """, (movie_id,))

        movie = cursor.fetchone()
        if not movie:
            raise HTTPException(status_code=404, detail="Фильм не найден")

        # Получаем сеансы для этого фильма
        cursor.execute("""
            SELECT
                s.id as session_id,
                to_char(s.start_time, 'HH24:MI') as time,
                s.price,
                h.name as hall_name,
                to_char(s.start_time, 'YYYY-MM-DD') as session_date
            FROM sessions s
            JOIN halls h ON s.hall_id = h.id
            WHERE s.movie_id = %s
            ORDER BY s.start_time
        """, (movie_id,))

        sessions_data = cursor.fetchall()
        
        today_sessions = []
        for s in sessions_data:
            today_sessions.append({
                "session_id": s[0],
                "time": s[1],
                "price": float(s[2]),
                "hall_name": s[3],
                "session_date": s[4]
            })

        return {
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
            "trailer_url": movie[11],
            "today_sessions": today_sessions
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка в get_movie: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()