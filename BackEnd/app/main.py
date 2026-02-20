from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import movies, sessions, tickets
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание приложения
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Настройка CORS (чтобы фронтенд мог обращаться)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене заменить на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(movies.router)
app.include_router(sessions.router)
app.include_router(tickets.router)

@app.get("/")
async def root():
    return {
        "message": "🍿 Cinema API is running!",
        "docs": "/docs",
        "endpoints": [
            "/movies/now-playing",
            "/movies/{id}",
            "/sessions/{id}/seats",
            "/tickets/purchase"
        ]
    }

@app.get("/health")
async def health_check():
    """Проверка работоспособности"""
    from app.database import get_db_connection
    conn = get_db_connection()
    db_status = "connected" if conn else "disconnected"
    if conn:
        conn.close()

    return {
        "status": "healthy",
        "database": db_status,
        "version": settings.APP_VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )