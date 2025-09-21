## 01. Szablon projektu i Docker Compose

Zakres: tylko podstawowa struktura katalogów, minimalne pliki konfiguracyjne, `docker-compose.yml`, puste `Dockerfile` (z sensownymi bazami) oraz `.env` i `.env.frontend`. Bez implementacji logiki.

Wykonaj kroki:
1) Utwórz strukturę katalogów zgodnie z README (bez dodatkowych folderów):
```
backend/app/{core,modules,api}
frontend/src/{app,modules,shared}
docker/nginx/
```

2) Dodaj minimalny `backend/Dockerfile`:
```
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

3) Dodaj minimalny `backend/requirements.txt` (tylko niezbędne pakiety, bez nadmiaru):
```
fastapi==0.115.0
uvicorn[standard]==0.30.6
SQLAlchemy==2.0.36
pydantic==2.9.2
python-multipart==0.0.9
passlib[bcrypt]==1.7.4
PyJWT==2.9.0
```

4) Dodaj minimalny `backend/app/main.py` (prosty healthcheck, bez auth) oraz ustaw nazwę pliku DB na `werbisci-app.db` w kolejnych etapach:
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

5) Dodaj minimalny `frontend/Dockerfile`:
```
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

6) Dodaj minimalny `frontend/package.json` (Vite + React + TS) i `index.html`, oraz `src/main.tsx` i `src/App.tsx` z placeholderem „Werbiści Lublin App”. Nie dodawaj UI frameworka na tym etapie.

7) Dodaj `.env` i `.env.frontend` zgodnie z README z przykładowymi wartościami.

`.env` (przykład):
```
APP_ENV=development
JWT_SECRET=change_me_dev
ADMIN_LOGIN=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=DevAdmin123!
SQLITE_DB_PATH=/data/werbisci-app.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

8) Dodaj `docker-compose.yml` (jeden plik, uruchamia 2 serwisy):
```
services:
  backend:
    build: ./backend
    env_file:
      - ./.env
    volumes:
      - backend_data:/data
    ports:
      - "8000:8000"
  frontend:
    build: ./frontend
    env_file:
      - ./.env.frontend
    ports:
      - "5173:80"
volumes:
  backend_data:
```

9) Zweryfikuj lokalnie: `docker compose up -d --build`, sprawdź `GET /health` i stronę frontu (statyczny placeholder).

Uwaga: nie implementuj auth ani modułów — tylko skeleton i uruchamianie kontenerów.

Koniec etapu: Struktura istnieje, kontenery startują, health działa, bez implementacji auth/modułów.


