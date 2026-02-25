from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import jwt
import bcrypt
from app.database import get_db_connection
import logging
import os

router = APIRouter(prefix="/auth", tags=["Авторизация"])
logger = logging.getLogger(__name__)

# =============================================
# НАСТРОЙКИ JWT
# =============================================
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# =============================================
# МОДЕЛИ
# =============================================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    registration_date: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

# =============================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =============================================
def hash_password(password: str) -> str:
    """Хеширует пароль с помощью bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет пароль"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создает JWT токен"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Получает текущего пользователя по токену"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, email, full_name, phone, registration_date FROM customers WHERE email = %s",
            (token_data.email,)
        )
        user = cursor.fetchone()
        if user is None:
            raise credentials_exception

        return {
            "id": user[0],
            "email": user[1],
            "full_name": user[2],
            "phone": user[3],
            "registration_date": user[4]
        }
    finally:
        conn.close()

# =============================================
# ЭНДПОИНТЫ
# =============================================

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    """
    Регистрация нового пользователя
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Проверяем, существует ли уже такой email
        cursor.execute("SELECT id FROM customers WHERE email = %s", (user.email,))
        existing_user = cursor.fetchone()
        if existing_user:
            raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

        # Хешируем пароль
        hashed_password = hash_password(user.password)

        # Создаем пользователя
        cursor.execute("""
            INSERT INTO customers (email, password_hash, full_name, phone, registration_date)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, email, full_name, phone, registration_date
        """, (user.email, hashed_password, user.full_name, user.phone, datetime.now()))

        new_user = cursor.fetchone()
        conn.commit()

        # Создаем токен
        access_token = create_access_token(data={"sub": user.email})

        return Token(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": new_user[0],
                "email": new_user[1],
                "full_name": new_user[2],
                "phone": new_user[3],
                "registration_date": new_user[4]
            }
        )

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Ошибка регистрации: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при регистрации")
    finally:
        conn.close()

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Вход в систему (получение токена)
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к БД")

    try:
        cursor = conn.cursor()

        # Ищем пользователя по email
        cursor.execute(
            "SELECT id, email, password_hash, full_name, phone, registration_date FROM customers WHERE email = %s",
            (form_data.username,)
        )
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=400, detail="Неверный email или пароль")

        # Проверяем пароль
        if not verify_password(form_data.password, user[2]):
            raise HTTPException(status_code=400, detail="Неверный email или пароль")

        # Создаем токен
        access_token = create_access_token(data={"sub": user[1]})

        return Token(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user[0],
                "email": user[1],
                "full_name": user[3],
                "phone": user[4],
                "registration_date": user[5]
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка входа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при входе")
    finally:
        conn.close()

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Получить информацию о текущем пользователе
    """
    return current_user

@router.post("/logout")
async def logout():
    """
    Выход из системы (на клиенте просто удаляют токен)
    """
    return {"message": "Успешный выход"}

@router.post("/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Обновить токен
    """
    new_token = create_access_token(data={"sub": current_user["email"]})
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "user": current_user
    }