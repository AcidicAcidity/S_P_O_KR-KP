from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

# ----- МОДЕЛИ ДЛЯ ФИЛЬМОВ -----
class MovieBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int
    genre: Optional[str] = None
    release_date: Optional[date] = None
    rating: Optional[float] = Field(None, ge=0, le=10)
    poster_url: Optional[str] = None

class MovieCreate(MovieBase):
    pass

class MovieResponse(MovieBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Для главной страницы (фильм + сеансы на сегодня)
class TodaySession(BaseModel):
    session_id: int
    time: str  # "18:30"
    price: float
    hall_name: str

class MovieCardResponse(BaseModel):
    id: int
    title: str
    poster_url: Optional[str] = None
    genre: Optional[str] = None
    rating: Optional[float] = None
    today_sessions: List[TodaySession] = []

# ----- МОДЕЛИ ДЛЯ ЗАЛОВ И МЕСТ -----
class Seat(BaseModel):
    id: int
    row_number: int
    seat_number: int
    seat_type: str
    is_available: bool

class Hall(BaseModel):
    id: int
    name: str
    hall_type: str
    capacity: int

# ----- МОДЕЛИ ДЛЯ БИЛЕТОВ -----
class TicketPurchase(BaseModel):
    session_id: int
    seat_id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None

class TicketResponse(BaseModel):
    id: int
    session_id: int
    seat_id: int
    price: float
    purchase_date: datetime
    status: str
    movie_title: Optional[str] = None
    session_time: Optional[datetime] = None
    hall_name: Optional[str] = None
    row: int
    seat: int