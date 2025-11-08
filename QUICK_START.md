# Szybki Start - Werbisci Lublin App

## Dla developera (Cursor)

### 1. Lokalne uruchomienie (bez Docker)

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Otwórz przeglądarkę:** http://localhost:5173

### 2. Uruchomienie z Docker (testowanie)

```bash
docker compose up --build
```

**Otwórz przeglądarkę:** http://localhost:5173

---

## Dla administratora serwera

### Pierwsze uruchomienie

1. **Sklonuj repozytorium:**
```bash
git clone <repo-url>
cd werbisci-lublin-app
```

2. **Skonfiguruj zmienne środowiskowe:**
```bash
# Skopiuj przykładowe pliki i edytuj
cp .env.example .env
cp .env.frontend.example .env.frontend

# Edytuj .env (ustaw silny JWT_SECRET, hasło admina, etc.)
nano .env
nano .env.frontend
```

3. **Nadaj uprawnienia skryptom (Linux/Mac):**
```bash
chmod +x build.sh deploy.sh
```

4. **Uruchom deployment:**
```bash
# Linux/Mac
./deploy.sh

# Windows
.\deploy.ps1
```

5. **Sprawdź status:**
```bash
docker compose ps
docker compose logs -f
```

### Aktualizacja aplikacji

```bash
# Linux/Mac
./deploy.sh

# Windows
.\deploy.ps1
```

Skrypt automatycznie:
- Zatrzyma kontenery
- Pobierze zmiany z git
- Zbuduje z nową wersją
- Uruchomi ponownie

### Zmiana wersji

1. **Edytuj plik VERSION:**
```bash
echo "1.1.0" > VERSION
```

2. **Commit i push:**
```bash
git add VERSION
git commit -m "Bump version to 1.1.0"
git push
```

3. **Deploy na serwerze:**
```bash
./deploy.sh
```

4. **Sprawdź wersję w aplikacji:**
- Zaloguj się
- Przejdź do zakładki "Informacje"

---

## Użyteczne komendy

### Docker

```bash
# Status kontenerów
docker compose ps

# Logi
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Restart
docker compose restart

# Zatrzymanie
docker compose down

# Usunięcie wszystkiego (z danymi!)
docker compose down -v

# Rebuild bez cache
docker compose build --no-cache
```

### Git

```bash
# Status
git status

# Pobranie zmian
git pull

# Historia
git log --oneline -n 10

# Tagi (wersje)
git tag
```

### Sprawdzanie wersji

```bash
# API endpoint
curl http://localhost:8000/api/version

# Frontend version file
curl http://localhost:5173/version.json

# Docker image labels
docker inspect werbisci-lublin-backend:latest | grep -A 5 Labels
```

---

## Domyślne dane logowania

Po pierwszym uruchomieniu aplikacja tworzy użytkownika admin:

- **Login:** admin (lub z .env: `ADMIN_LOGIN`)
- **Hasło:** ChangeMe123! (lub z .env: `ADMIN_PASSWORD`)

**WAŻNE:** Zmień hasło admina po pierwszym zalogowaniu!

---

## Backup bazy danych

Baza SQLite znajduje się w volume Docker:

```bash
# Backup
docker compose exec backend cat /data/werbisci-app.db > backup-$(date +%Y%m%d).db

# Lub skopiuj z volume
docker cp $(docker compose ps -q backend):/data/werbisci-app.db ./backup.db
```

**Zalecane:** Skonfiguruj cron job do automatycznego backupu:

```bash
# Dodaj do crontab (codziennie o 2:00)
0 2 * * * cd /path/to/app && docker cp $(docker compose ps -q backend):/data/werbisci-app.db /backups/werbisci-$(date +\%Y\%m\%d).db
```

---

## Troubleshooting

### Port już zajęty

Zmień port w `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Zmień 8000 na 8001
  frontend:
    ports:
      - "8080:80"    # Zmień 5173 na 8080
```

### Aplikacja nie odpowiada

```bash
# Sprawdź logi
docker compose logs -f

# Restart
docker compose restart

# Jeśli nie pomaga - rebuild
docker compose down
docker compose up --build -d
```

### Brak dostępu do bazy

Sprawdź volume:
```bash
docker volume ls
docker volume inspect werbisci-lublin-app_backend_data
```

### CORS errors

Sprawdź `.env`:
```
CORS_ORIGINS=http://localhost:5173,http://your-domain.com
```

---

## Dokumentacja

- `README.md` - Ogólny przegląd projektu
- `VERSIONING.md` - System wersjonowania
- `CURSOR_DEVELOPMENT.md` - Development w Cursor
- `DEPLOYMENT_INSTRUCTIONS.md` - Szczegółowe instrukcje deployment

---

## Wsparcie

W razie problemów sprawdź:
1. Logi Docker: `docker compose logs -f`
2. Status serwisów: `docker compose ps`
3. Wersję API: `curl http://localhost:8000/api/version`
4. Dokumentację API: http://localhost:8000/docs

