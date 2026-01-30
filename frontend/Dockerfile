# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь код
COPY . .

# Dev сервер
CMD ["npm", "start"]
