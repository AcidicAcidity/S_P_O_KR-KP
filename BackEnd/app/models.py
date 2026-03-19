from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

# ----- МОДЕЛИ ДЛЯ СЕАНСОВ -----
class TodaySession(BaseModel):
    session_id: int
    time: str
    price: float
    hall_name: str
    session_date: Optional[str] = None

    class Config:
        from_attributes = True

# ----- МОДЕЛИ ДЛЯ ФИЛЬМОВ -----
class MovieBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    genre: Optional[str] = None
    release_date: Optional[date] = None
    rating: Optional[float] = Field(None, ge=0, le=10)
    poster_url: Optional[str] = None
    director: Optional[str] = None
    actors: Optional[str] = None
    country: Optional[str] = None
    trailer_url: Optional[str] = None

class MovieCreate(MovieBase):
    pass

class MovieResponse(MovieBase):
    id: int
    today_sessions: List[TodaySession] = []

    class Config:
        from_attributes = True

# ----- МОДЕЛИ ДЛЯ КАРТОЧЕК ФИЛЬМОВ -----
class MovieCardResponse(BaseModel):
    id: int
    title: str
    poster_url: Optional[str] = None
    genre: Optional[str] = None
    rating: Optional[float] = None
    today_sessions: List[TodaySession] = []

    class Config:
        from_attributes = True

# ----- МОДЕЛИ ДЛЯ ЗАЛОВ И МЕСТ -----
class Hall(BaseModel):
    id: int
    name: str
    hall_type: str
    capacity: int

class Seat(BaseModel):
    id: int
    row_number: int
    seat_number: int
    seat_type: str

class SeatWithStatus(BaseModel):
    id: int
    row: int
    seat: int
    type: str
    available: bool

# ----- СЕАНСЫ -----
class SessionInfo(BaseModel):
    id: int
    start_time: datetime
    price: float
    available_seats: int
    hall_id: int
    hall_name: str
    hall_type: Optional[str] = None
    movie_id: Optional[int] = None
    movie_title: Optional[str] = None

class SessionSeatsResponse(BaseModel):
    session_id: int
    movie_title: str
    start_time: datetime
    hall_name: str
    price: float
    seats_by_row: dict
    total_seats: int
    available_seats: int

# ----- БИЛЕТЫ -----
class TicketPurchase(BaseModel):
    session_id: int
    seat_ids: List[int]
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    used_bonus: Optional[int] = 0

class TicketResponse(BaseModel):
    id: int
    session_id: int
    seat_ids: List[int]
    total_price: float
    original_price: Optional[float] = None
    used_bonus: Optional[int] = 0
    bonus_earned: Optional[int] = 0
    bonus_balance: Optional[int] = None
    purchase_date: datetime
    status: str
    movie_title: Optional[str] = None
    session_time: Optional[datetime] = None
    hall_name: Optional[str] = None
    row: int
    seat: int
    customer_name: Optional[str] = None

# ----- МОДЕЛИ ДЛЯ АДМИНКИ -----
class SessionResponse(BaseModel):
    id: int
    movie_id: int
    hall_id: int
    start_time: datetime
    price: float
    available_seats: int
    movie_title: Optional[str] = None
    hall_name: Optional[str] = None

class HallResponse(BaseModel):
    id: int
    name: str
    hall_type: str
    capacity: int

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    registration_date: datetime

class BookingCreate(BaseModel):
    session_id: int
    seat_ids: List[int]

class BookingResponse(BaseModel):
    id: int
    session_id: int
    seat_id: int
    expires_at: datetime
    status: str

class TicketPurchase(BaseModel):
    session_id: int
    seat_ids: List[int]
    customer_name: Optional[str] = None
    user_id: Optional[int] = None
    use_bonus: bool = False

