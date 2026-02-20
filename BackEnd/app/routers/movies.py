from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.models import MovieResponse, MovieCardResponse, TodaySession
import logging

router = APIRouter(prefix="/movies", tags=["Фильмы"])
logger = logging.getLogger(__name__)

@router.get("/now-playing", response_model=list[MovieCardResponse])
async def get_now_playing():
    """
    Получить все фильмы с сеансами на сегодня
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Все фильмы
        cursor.execute("""
            SELECT id, title, poster_url, genre, rating
            FROM movies
            ORDER BY rating DESC
        """)
        movies = cursor.fetchall()

        result = []
        for movie in movies:
            # Сеансы на сегодня для каждого фильма
            cursor.execute("""
                SELECT
                    s.id as session_id,
                    to_char(s.start_time, 'HH24:MI') as time,
                    s.price,
                    h.name as hall_name
                FROM sessions s
                JOIN halls h ON s.hall_id = h.id
                WHERE s.movie_id = %s
                    AND DATE(s.start_time) = CURRENT_DATE
                    AND s.start_time > CURRENT_TIMESTAMP
                ORDER BY s.start_time
            """, (movie[0],))

            sessions = cursor.fetchall()
            today_sessions = [
                TodaySession(
                    session_id=s[0],
                    time=s[1],
                    price=float(s[2]),
                    hall_name=s[3]
                ) for s in sessions
            ]

            result.append(MovieCardResponse(
                id=movie[0],
                title=movie[1],
                poster_url=movie[2],
                genre=movie[3],
                rating=float(movie[4]) if movie[4] else None,
                today_sessions=today_sessions
            ))

        return result

    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/{movie_id}", response_model=MovieResponse)
async def get_movie(movie_id: int):
    """
    Получить детальную информацию о фильме
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, description, duration_minutes,
                   genre, release_date, rating, poster_url, created_at
            FROM movies
            WHERE id = %s
        """, (movie_id,))

        movie = cursor.fetchone()
        if not movie:
            raise HTTPException(status_code=404, detail="Фильм не найден")

        return MovieResponse(
            id=movie[0],
            title=movie[1],
            description=movie[2],
            duration_minutes=movie[3],
            genre=movie[4],
            release_date=movie[5],
            rating=float(movie[6]) if movie[6] else None,
            poster_url=movie[7],
            created_at=movie[8]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()