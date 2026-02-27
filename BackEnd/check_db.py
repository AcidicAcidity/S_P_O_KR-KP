import pg8000

try:
    # Подключение к стандартной базе postgres (она есть всегда)
    conn = pg8000.connect(
        host="localhost",
        port=5432,
        database="postgres",  # стандартная системная база
        user="postgres",
        password="Rt290406"
    )
    
    cursor = conn.cursor()
    
    # Проверяем, существует ли наша база
    cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'DB_S_P_O'")
    exists = cursor.fetchone()
    
    if exists:
        print("✅ База данных DB_S_P_O существует")
    else:
        print("❌ База данных DB_S_P_O НЕ существует")
        print("Создаю базу данных...")
        # В отключенном режиме нужно переключиться на другую базу для создания
        conn.close()
        
        # Подключаемся с autocommit для создания базы
        conn = pg8000.connect(
            host="localhost",
            port=5432,
            database="postgres",
            user="postgres",
            password="Rt290406"
        )
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute('CREATE DATABASE "DB_S_P_O"')
        print("✅ База данных DB_S_P_O создана!")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Ошибка подключения: {e}")