# Экспортируем все роутеры для удобного импорта в main.py
from .movies import router as movies_router
from .sessions import router as sessions_router
from .tickets import router as tickets_router
from .halls import router as halls_router
from .auth import router as auth_router