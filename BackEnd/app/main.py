from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    movies_router,
    sessions_router,
    tickets_router,
    halls_router,
    auth_router  # 👈 Добавили импорт
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(movies_router)
app.include_router(sessions_router)
app.include_router(tickets_router)
app.include_router(halls_router)
app.include_router(auth_router)  # 👈 Добавили роутер

@app.get("/")
async def root():
    return {
        "message": "🍿 Cinema API is running!",
        "docs": "/docs",
        "endpoints": [
            "GET    /movies",
            "GET    /movies/now-playing",
            "GET    /movies/{id}",
            "GET    /movies/{id}/sessions?date=YYYY-MM-DD",
            "GET    /sessions",
            "GET    /sessions/{id}",
            "GET    /sessions/{id}/seats",
            "POST   /tickets/purchase",
            "GET    /halls",
            "GET    /halls/{id}/seats",
            "POST   /auth/register",      # 👈 Новые
            "POST   /auth/login",          # 👈 Новые
            "GET    /auth/me"               # 👈 Новые
        ]
    }

@app.get("/health")
async def health_check():
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