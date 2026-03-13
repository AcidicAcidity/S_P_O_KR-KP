# Инструкция по установке

## 1. Обновление pip

Если у вас уже установлен Python и библиотека pip, то перед установкой нужно её обновить.

```python
~/S_O_P_KR-KP/BackEnd> python -m pip install --upgrade pip
```

## 2. Создание и активация виртуального окружения

Сначала нужно создать виртуальное окружение с помощью команды.

```python
~/S_O_P_KR-KP/BackEnd> python -m venv venv
```

Далее мы активируем виртуальное окружение для установки всех библиотек и зависимостей в него (шаг 3).

```python
~/S_O_P_KR-KP/BackEnd> venv/Scripts/activate
```

## 3. Скачивание библиотек и установка зависимостей

Теперь, для того чтобы установить библиотеки для запуска нашего проекта мы запускаем установку из файла requirements.txt

```python
~/S_O_P_KR-KP/BackEnd> pip install -r requirements.txt
```

## 4. Настройка окружения для работы с БД

Копируем файл .env.example, переименовывая его в .env и заполняем свои данные для подключения к БД.

```
~/S_O_P_KR-KP/BackEnd> cp .env.example .env
```

## 5. Запуск сервера

```
~/S_O_P_KR-KP/BackEnd> uvicorn app.main:app --reload
```

## Важная ремарка
С учётом того что бекэнд был переделан, необходимо установить библиотеки, которые ещё не были добавлены в requirements.txt

```
~/S_O_P_KR-KP/BackEnd> pip uninstall passlib bcrypt -y
```
```
~/S_O_P_KR-KP/BackEnd>pip install passlib[bcrypt]
```
```
~/S_O_P_KR-KP/BackEnd>pip install bcrypt==3.2.0
```
