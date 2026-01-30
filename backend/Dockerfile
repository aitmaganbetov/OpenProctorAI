# backend/Dockerfile

FROM python:3.10-slim

# Отключаем буферизацию вывода (чтобы логи сразу летели в консоль Docker)
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Установка системных зависимостей
# gcc и pkg-config нужны для компиляции некоторых python-пакетов
# libmariadb-dev нужен для mysqlclient (если будем использовать его) или aiomysql
RUN apt-get update && apt-get install -y \
    gcc \
    pkg-config \
    libmariadb-dev \
    && rm -rf /var/lib/apt/lists/*

# Сначала копируем requirements, чтобы закешировать слои Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код приложения
COPY . .

# Команда запуска (в docker-compose мы её переопределяем для dev-режима, но для прода это default)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
