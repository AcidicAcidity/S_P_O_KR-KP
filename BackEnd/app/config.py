from dotenv import load_dotenv
import os
from pathlib import Path

# Получаем путь к файлу .env в папке BackEnd (из той же папки где запускается скрипт)
# Сначала пробуем из папки где запущен скрипт, потом из папки BackEnd
script_cwd = Path(os.getcwd())
backenv_dir = Path(__file__).resolve().parent.parent

# Проверяем разные варианты расположения .env
env_paths_to_try = [
    script_cwd / ".env",           # из папки откуда запущен скрипт
    backenv_dir / ".env",         # из папки BackEnd
    script_cwd / "BackEnd" / ".env",  # BackEnd в корне проекта
]

env_path = None
for path in env_paths_to_try:
    if path.exists():
        env_path = path
        break

if env_path is None:
    env_path = backenv_dir / ".env"  # используем последний вариант по умолчанию

# Загружаем .env файл из папки BackEnd
load_dotenv(env_path)

# ВРЕМЕННАЯ ОТЛАДКА: посмотрим, что загрузилось из .env
print("=" * 50)
print("🔍 ОТЛАДКА: Проверка загрузки переменных из .env")
print("=" * 50)
print(f"📁 Текущая директория: {os.getcwd()}")
print(f"📁 .env файл существует: {os.path.exists(env_path)}")
print(f"📁 .env путь: {os.path.abspath(env_path)}")
print("-" * 50)
print(f"DB_HOST: {os.getenv('DB_HOST')}")
print(f"DB_PORT: {os.getenv('DB_PORT')}")
print(f"DB_NAME: {os.getenv('DB_NAME')}")
print(f"DB_USER: {os.getenv('DB_USER')}")
password = os.getenv('DB_PASSWORD')
print(f"DB_PASSWORD: {'*' * len(password) if password else 'НЕ ЗАГРУЖЕН'}")
print(f"DB_PASSWORD длина: {len(password) if password else 0}")
print("-" * 50)
print(f"APP_NAME: {os.getenv('APP_NAME')}")
print(f"APP_VERSION: {os.getenv('APP_VERSION')}")
print(f"DEBUG: {os.getenv('DEBUG')}")
print("=" * 50)


class Settings:
    # База данных
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    # Приложение
    APP_NAME: str
    APP_VERSION: str
    DEBUG: bool

    def __init__(self) -> None:
        # База данных - без значений по умолчанию!
        self.DB_HOST = os.getenv("DB_HOST")
        self.DB_PORT = int(os.getenv("DB_PORT")) if os.getenv("DB_PORT") else None
        self.DB_NAME = os.getenv("DB_NAME")
        self.DB_USER = os.getenv("DB_USER")
        self.DB_PASSWORD = os.getenv("DB_PASSWORD")

        # Приложение
        self.APP_NAME = os.getenv("APP_NAME")
        self.APP_VERSION = os.getenv("APP_VERSION")
        self.DEBUG = os.getenv("DEBUG") == "True" if os.getenv("DEBUG") else None

        # Проверка, что все переменные загружены
        missing_vars = []
        if not self.DB_HOST:
            missing_vars.append("DB_HOST")
        if not self.DB_PORT:
            missing_vars.append("DB_PORT")
        if not self.DB_NAME:
            missing_vars.append("DB_NAME")
        if not self.DB_USER:
            missing_vars.append("DB_USER")
        if not self.DB_PASSWORD:
            missing_vars.append("DB_PASSWORD")
        if not self.APP_NAME:
            missing_vars.append("APP_NAME")
        if not self.APP_VERSION:
            missing_vars.append("APP_VERSION")
        if self.DEBUG is None:
            missing_vars.append("DEBUG")

        if missing_vars:
            error_msg = f"❌ Не все переменные окружения загружены! Отсутствуют: {', '.join(missing_vars)}"
            print("=" * 50)
            print(error_msg)
            print("=" * 50)
            raise ValueError(error_msg)
        else:
            print("✅ Все переменные окружения успешно загружены!")

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


# Создаем экземпляр настроек
settings = Settings()

# Дополнительная отладка после создания settings
print("=" * 50)
print("🔍 Настройки после инициализации:")
print(f"DB_HOST: {settings.DB_HOST}")
print(f"DB_PORT: {settings.DB_PORT}")
print(f"DB_NAME: {settings.DB_NAME}")
print(f"DB_USER: {settings.DB_USER}")
print(f"DB_PASSWORD: {'*' * len(settings.DB_PASSWORD) if settings.DB_PASSWORD else 'НЕТ'}")
print(f"DATABASE_URL: {settings.DATABASE_URL.replace(settings.DB_PASSWORD, '****') if settings.DB_PASSWORD else 'НЕТ'}")
print("=" * 50)