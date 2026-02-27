from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_db_connection
import logging

router = APIRouter(prefix="/auth", tags=["Авторизация"])
logger = logging.getLogger(__name__)

# Модели для запросов/ответов
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@router.post("/register")
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
        
        # ИСПРАВЛЕНО: убрали created_at, используем registration_date
        cursor.execute("""
            INSERT INTO customers (full_name, email, phone, registration_date)
            VALUES (%s, %s, %s, NOW())
            RETURNING id, full_name, email
        """, (user.name, user.email, None))  # В реальном проекте: хеш пароля нужно хранить!
        
        new_user = cursor.fetchone()
        conn.commit()
        
        return {
            "message": "Регистрация успешна",
            "user": {
                "id": new_user[0],
                "name": new_user[1],
                "email": new_user[2]
            }
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
        
        # ИСПРАВЛЕНО: используем правильные названия полей
        cursor.execute("""
            SELECT id, full_name, email FROM customers
            WHERE email = %s
        """, (user.email,))  # В реальном проекте нужно проверять пароль!
        
        db_user = cursor.fetchone()
        if not db_user:
            raise HTTPException(status_code=401, detail="Неверный email или пароль")
        
        # В реальном проекте здесь создается JWT токен
        return {
            "message": "Вход выполнен",
            "user": {
                "id": db_user[0],
                "name": db_user[1],
                "email": db_user[2]
            },
            "token": "fake-jwt-token"  # Заглушка!
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