from fastapi import APIRouter, HTTPException, Query
from app.database import get_db_connection
from app.models import MovieResponse, MovieCardResponse, TodaySession
import logging
from typing import List, Optional
from datetime import date

router = APIRouter(prefix="/movies", tags=["Фильмы"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[MovieResponse])
async def get_all_movies():
    """Получить все фильмы"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, description, duration_minutes, genre,
                   release_date, rating, poster_url,
                   actors, director, country
            FROM movies
            ORDER BY release_date DESC
        """)

        movies = cursor.fetchall()
        result = []
        for m in movies:
            result.append({
                "id": m[0],
                "title": m[1],
                "description": m[2],
                "duration_minutes": m[3],
                "genre": m[4],
                "release_date": m[5],
                "rating": float(m[6]) if m[6] else None,
                "poster_url": m[7],
                "actors": m[8],
                "director": m[9],
                "country": m[10]
            })
        return result
    finally:
        conn.close()

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
            cursor.execute("""
                SELECT
                    s.id,
                    to_char(s.start_time, 'HH24:MI'),
                    s.price,
                    h.name
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
    finally:
        conn.close()

@router.get("/{movie_id}", response_model=MovieResponse)
async def get_movie(movie_id: int):
    """Детальная информация о фильме"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, description, duration_minutes, genre,
                   release_date, rating, poster_url,
                   actors, director, country
            FROM movies
            WHERE id = %s
        """, (movie_id,))

        movie = cursor.fetchone()
        if not movie:
            raise HTTPException(status_code=404, detail="Фильм не найден")

        return {
            "id": movie[0],
            "title": movie[1],
            "description": movie[2],
            "duration_minutes": movie[3],
            "genre": movie[4],
            "release_date": movie[5],
            "rating": float(movie[6]) if movie[6] else None,
            "poster_url": movie[7],
            "actors": movie[8],
            "director": movie[9],
            "country": movie[10]
        }
    finally:
        conn.close()

@router.get("/{movie_id}/sessions")
async def get_movie_sessions(
    movie_id: int,
    date_param: date = Query(..., description="Дата в формате ГГГГ-ММ-ДД")
):
    """Получить сеансы фильма на конкретную дату"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                s.id,
                s.start_time,
                s.price,
                s.available_seats,
                h.id,
                h.name,
                h.hall_type
            FROM sessions s
            JOIN halls h ON s.hall_id = h.id
            WHERE s.movie_id = %s
                AND DATE(s.start_time) = %s
                AND s.start_time > CURRENT_TIMESTAMP
            ORDER BY s.start_time
        """, (movie_id, date_param))

        sessions = cursor.fetchall()

        return [
            {
                "id": s[0],
                "start_time": s[1],
                "price": float(s[2]),
                "available_seats": s[3],
                "hall": {
                    "id": s[4],
                    "name": s[5],
                    "type": s[6]
                }
            }
            for s in sessions
        ]
    finally:
        conn.close()

@router.get("/genres/list", response_model=List[str])
async def get_genres():
    """Получить все уникальные жанры"""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT genre FROM movies WHERE genre IS NOT NULL ORDER BY genre")
        return [row[0] for row in cursor.fetchall()]
    finally:
        conn.close()