from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.database import get_db_connection
from passlib.context import CryptContext
import logging
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Авторизация"])
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Модели для запросов/ответов
class UserRegister(BaseModel):
    name: str
    email: EmailStr  # Используем EmailStr для валидации
    phone: Optional[str] = None  # Добавил телефон как опциональный
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    isAdmin: bool = False

@router.post("/register", response_model=UserResponse)
async def register(user: UserRegister):
    """
    Регистрация нового пользователя
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        cursor = conn.cursor()
        
        # Проверяем, есть ли уже пользователь с таким email
        cursor.execute(
            "SELECT id FROM customers WHERE email = %s",
            (user.email,)
        )
        existing = cursor.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
        
        # Хешируем пароль
        hashed_password = get_password_hash(user.password)
        
        # Добавляем пользователя с паролем
        cursor.execute("""
            INSERT INTO customers (full_name, email, phone, password_hash, registration_date)
            VALUES (%s, %s, %s, %s, NOW())
            RETURNING id, full_name, email, phone
        """, (user.name, user.email, user.phone, hashed_password))
        
        new_user = cursor.fetchone()
        conn.commit()
        
        return {
            "id": new_user[0],
            "name": new_user[1],
            "email": new_user[2],
            "phone": new_user[3]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка регистрации: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при регистрации")
    finally:
        conn.close()

@router.post("/login")
async def login(user: UserLogin):
    """
    Вход пользователя
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")
    
    try:
        cursor = conn.cursor()
        
        # Добавляем is_admin в SELECT
        cursor.execute("""
            SELECT id, full_name, email, phone, password_hash, is_admin
            FROM customers
            WHERE email = %s
        """, (user.email,))
        
        db_user = cursor.fetchone()
        
        if not db_user:
            raise HTTPException(status_code=401, detail="Неверный email или пароль")
        
        # Проверяем пароль
        if not verify_password(user.password, db_user[4]):
            raise HTTPException(status_code=401, detail="Неверный email или пароль")
        
        # Возвращаем пользователя с is_admin
        return {
            "message": "Вход выполнен",
            "user": {
                "id": db_user[0],
                "name": db_user[1],
                "email": db_user[2],
                "phone": db_user[3],
                "isAdmin": db_user[5]  # Добавляем флаг админа
            },
            "token": "fake-jwt-token"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка входа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при входе")
    finally:
        conn.close()

@router.get("/me")
async def get_current_user():
    """
    Получить информацию о текущем пользователе
    """
    # В реальном проекте здесь проверяется JWT токен
    return {
        "message": "Нужно реализовать проверку токена"
    }

@router.get("/bonus")
async def get_bonus_points(user_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT bonus_points FROM customers WHERE id = %s", (user_id,))
        points = cursor.fetchone()
        return {"bonus_points": points[0] if points else 0}
    finally:
        conn.close()

@router.get("/bonus/{user_id}")
async def get_user_bonus(user_id: int):
    """
    Получить баланс бонусов пользователя
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT bonus_points FROM customers WHERE id = %s",
            (user_id,)
        )
        result = cursor.fetchone()
        return {"bonus_points": result[0] if result else 0}
    finally:
        conn.close()