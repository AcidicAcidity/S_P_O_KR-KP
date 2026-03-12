from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import movies, sessions, tickets, auth, admin, bookings, rentals
from app import scheduler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# CORS - ВАЖНО: должно быть ПЕРЕД подключением роутеров
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Твой фронтенд
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(movies.router)
app.include_router(sessions.router)
app.include_router(tickets.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(bookings.router)
app.include_router(rentals.router)

@app.get("/")
async def root():
    return {
        "message": "🍿 Cinema API is running!",
        "docs": "/docs"
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