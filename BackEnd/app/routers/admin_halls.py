from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import movies, sessions, halls, admin_halls, admin_rentals
from app.database import init_db
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Cinema API")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация базы данных при запуске
@app.on_event("startup")
async def startup():
    try:
        init_db()
        logger.info("✅ База данных инициализирована")
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации БД: {e}")

# Подключение роутеров
app.include_router(movies.router)
app.include_router(sessions.router)
app.include_router(halls.router)  # публичный роутер для залов
app.include_router(admin_halls.router)  # админский роутер для залов
app.include_router(admin_rentals.router)  # админский роутер для аренды

@app.get("/")
async def root():
    return {"message": "Cinema API is running", "status": "OK"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}