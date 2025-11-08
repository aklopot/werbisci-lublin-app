# Scenariusze Deployment - Werbisci Lublin App

Ten dokument opisuje różne scenariusze deployment i jak je obsłużyć.

## Scenariusz 1: Pierwsze uruchomienie na nowym serwerze

### Krok po kroku

1. **Przygotowanie serwera**
```bash
# Zainstaluj Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Zainstaluj git (jeśli nie ma)
sudo apt update
sudo apt install git -y
```

2. **Sklonuj repozytorium**
```bash
git clone <your-repo-url>
cd werbisci-lublin-app
```

3. **Konfiguracja zmiennych środowiskowych**
```bash
# Skopiuj przykładowe pliki
cp .env.example .env
cp .env.frontend.example .env.frontend

# Edytuj .env - WAŻNE: Zmień JWT_SECRET i hasło admina!
nano .env
```

Przykład `.env`:
```env
APP_ENV=production
JWT_SECRET=bardzo_długi_losowy_sekret_minimum_32_znaki_abc123xyz
ADMIN_LOGIN=admin
ADMIN_EMAIL=admin@werbisci-lublin.pl
ADMIN_PASSWORD=Bezpieczne_Haslo_123!
SQLITE_DB_PATH=/data/werbisci-app.db
CORS_ORIGINS=http://your-domain.com,http://your-ip:5173
```

Przykład `.env.frontend`:
```env
VITE_API_BASE_URL=http://your-domain.com:8000
```

4. **Nadaj uprawnienia skryptom**
```bash
chmod +x build.sh deploy.sh
```

5. **Pierwszy deployment**
```bash
./deploy.sh
```

6. **Sprawdź status**
```bash
docker compose ps
docker compose logs -f
```

7. **Otwórz w przeglądarce**
```
http://your-server-ip:5173
```

8. **Zaloguj się**
- Login: admin (lub z .env)
- Hasło: Bezpieczne_Haslo_123! (lub z .env)

9. **Sprawdź wersję**
- Przejdź do zakładki "Informacje"
- Zweryfikuj wersję: 1.0.0

---

## Scenariusz 2: Aktualizacja aplikacji (nowa funkcjonalność)

### Minor version bump: 1.0.0 → 1.1.0

1. **Na serwerze deweloperskim - zrób backup**
```bash
# Backup bazy danych
docker cp $(docker compose ps -q backend):/data/werbisci-app.db ./backup-before-1.1.0.db
```

2. **Pobierz najnowszy kod**
```bash
git pull origin main
```

3. **Sprawdź co się zmieniło**
```bash
git log --oneline -n 5
```

4. **Uruchom deployment**
```bash
./deploy.sh
```

5. **Monitoruj logi podczas uruchomienia**
```bash
docker compose logs -f
```

6. **Sprawdź czy działa**
- Otwórz aplikację w przeglądarce
- Zaloguj się
- Przejdź do "Informacje" - sprawdź wersję 1.1.0
- Przetestuj nowe funkcjonalności

7. **Jeśli coś nie działa - rollback**
```bash
docker compose down
git checkout v1.0.0  # Wróć do poprzedniej wersji
./deploy.sh
```

---

## Scenariusz 3: Hotfix (poprawka krytycznego błędu)

### Patch version bump: 1.0.0 → 1.0.1

1. **Developer naprawił bug i stworzył hotfix branch**
```bash
git checkout main
git pull
git checkout -b hotfix/1.0.1
# ... napraw bug ...
```

2. **Developer zmienia VERSION**
```bash
echo "1.0.1" > VERSION
git add VERSION
git commit -m "Hotfix: Fix critical bug in contact export"
git push origin hotfix/1.0.1
```

3. **Merge do main**
```bash
git checkout main
git merge hotfix/1.0.1
git tag -a v1.0.1 -m "Hotfix 1.0.1 - Contact export fix"
git push origin main --tags
```

4. **Na serwerze - szybki deployment**
```bash
cd /path/to/app
./deploy.sh
```

5. **Weryfikacja**
```bash
# Sprawdź wersję API
curl http://localhost:8000/api/version

# Powinno zwrócić:
# {"version":"1.0.1","commit":"...","buildDate":"..."}
```

---

## Scenariusz 4: Major release (zmiana łamiąca kompatybilność)

### Major version bump: 1.5.3 → 2.0.0

1. **Przed deployment - komunikat dla użytkowników**
```
UWAGA: Wersja 2.0.0 zawiera zmiany w strukturze danych.
Backup bazy danych jest wymagany!
```

2. **Backup przed upgrade**
```bash
# Zatrzymaj aplikację
docker compose down

# Backup bazy
docker cp $(docker compose ps -q backend):/data/werbisci-app.db ./backup-before-2.0.0.db

# Backup volume (opcjonalnie)
docker run --rm -v werbisci-lublin-app_backend_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/volume-backup-2.0.0.tar.gz /data
```

3. **Deployment nowej wersji**
```bash
git pull origin main
./deploy.sh
```

4. **Uruchom migrację (jeśli potrzebna)**
```bash
docker compose exec backend python app/migrations/migrate_to_v2.py
```

5. **Weryfikacja**
```bash
# Sprawdź logi
docker compose logs -f

# Sprawdź wersję
curl http://localhost:8000/api/version

# Testuj w przeglądarce
```

6. **Plan rollback (jeśli coś pójdzie nie tak)**
```bash
# Zatrzymaj
docker compose down

# Przywróć backup bazy
docker cp ./backup-before-2.0.0.db $(docker compose ps -q backend):/data/werbisci-app.db

# Wróć do v1.5.3
git checkout v1.5.3
./deploy.sh
```

---

## Scenariusz 5: Development w Cursor (lokalne testowanie)

1. **Uruchomienie bez Docker**
```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# .\venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Aplikacja dostępna: http://localhost:5173
Wersja będzie: "dev" / "unknown"

2. **Testowanie systemu wersjonowania lokalnie**
```bash
# Zcommituj zmiany (nawet testowe)
git add .
git commit -m "Test changes"

# Zbuduj z wersją
./build.ps1  # Windows
./build.sh   # Linux/Mac

# Uruchom
docker compose up

# Sprawdź http://localhost:5173/app/info
```

---

## Scenariusz 6: Automatyczny deployment przez CI/CD

### GitHub Actions (przykład)

Stwórz `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/werbisci-lublin-app
            ./deploy.sh
```

Workflow:
1. Developer zmienia VERSION na 1.2.0
2. Commit i tag: `git tag -a v1.2.0 -m "Release 1.2.0"`
3. Push: `git push origin main --tags`
4. GitHub Actions automatycznie deployuje na serwer
5. Sprawdź wersję w aplikacji

---

## Scenariusz 7: Monitoring wersji w produkcji

### Skrypt do monitorowania

Stwórz `check-version.sh`:

```bash
#!/bin/bash
# Check version of running application

echo "=== Werbisci Lublin App - Version Check ==="
echo ""

# API Version
echo "Backend API Version:"
curl -s http://localhost:8000/api/version | jq .
echo ""

# Frontend Version
echo "Frontend Version:"
curl -s http://localhost:5173/version.json | jq .
echo ""

# Docker Image Tags
echo "Docker Images:"
docker images | grep werbisci-lublin
echo ""

# Running Containers
echo "Running Containers:"
docker compose ps
echo ""

# Uptime
echo "Container Uptime:"
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

Użycie:
```bash
chmod +x check-version.sh
./check-version.sh
```

### Cron job do sprawdzania wersji

```bash
# Dodaj do crontab
0 */4 * * * /path/to/check-version.sh >> /var/log/werbisci-version.log 2>&1
```

---

## Scenariusz 8: Rollback do konkretnej wersji

### Sytuacja: Wersja 1.3.0 ma bug, chcemy wrócić do 1.2.0

1. **Sprawdź dostępne wersje**
```bash
git tag -l
# v1.0.0
# v1.1.0
# v1.2.0
# v1.3.0
```

2. **Backup aktualnej bazy**
```bash
docker cp $(docker compose ps -q backend):/data/werbisci-app.db ./backup-before-rollback.db
```

3. **Zatrzymaj aplikację**
```bash
docker compose down
```

4. **Wróć do wersji 1.2.0**
```bash
git checkout v1.2.0
```

5. **Deploy**
```bash
./deploy.sh
```

6. **Weryfikacja**
```bash
curl http://localhost:8000/api/version
# Powinno pokazać version: "1.2.0"
```

7. **Po naprawieniu buga - wróć do main**
```bash
git checkout main
git pull
./deploy.sh
```

---

## Scenariusz 9: Multi-environment (dev, staging, production)

### Struktura

```
/home/user/
├── werbisci-dev/           # Development
├── werbisci-staging/       # Staging
└── werbisci-production/    # Production
```

### Development (port 5173, 8000)
```bash
cd ~/werbisci-dev
git checkout develop
./deploy.sh
```

### Staging (port 5174, 8001)
```bash
cd ~/werbisci-staging
# docker-compose.yml z portami 5174, 8001
git checkout staging
./deploy.sh
```

### Production (port 80, 8002)
```bash
cd ~/werbisci-production
# docker-compose.yml z portami 80, 8002
git checkout main
./deploy.sh
```

---

## Najczęstsze problemy i rozwiązania

### Problem: "Port already in use"
```bash
# Sprawdź co używa portu
sudo lsof -i :8000
# Zatrzymaj proces lub zmień port w docker-compose.yml
```

### Problem: "Cannot connect to Docker daemon"
```bash
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

### Problem: "Version shows as 'dev'"
```bash
# Sprawdź czy version.json istnieje
docker compose exec backend cat /app/app/version.json
# Jeśli nie ma - rebuild z build.sh
./build.sh
docker compose up -d
```

### Problem: "Database locked"
```bash
# Zatrzymaj wszystkie kontenery
docker compose down
# Uruchom ponownie
docker compose up -d
```

---

## Checklist przed deployment do produkcji

- [ ] Przetestowano na środowisku deweloperskim
- [ ] Zaktualizowano VERSION
- [ ] Utworzono tag w git: `git tag -a v1.x.x -m "..."`
- [ ] Wykonano backup bazy danych
- [ ] Sprawdzono logi z poprzedniego deployment
- [ ] Przygotowano plan rollback
- [ ] Poinformowano użytkowników o planowanym update
- [ ] Sprawdzono dostępność backupu
- [ ] Zweryfikowano zmienne środowiskowe (.env)
- [ ] Przygotowano monitoring po deployment

## Checklist po deployment

- [ ] Sprawdzono logi: `docker compose logs -f`
- [ ] Zweryfikowano wersję w zakładce "Informacje"
- [ ] Przetestowano kluczowe funkcjonalności
- [ ] Sprawdzono API: `curl http://localhost:8000/api/version`
- [ ] Zweryfikowano że baza danych działa
- [ ] Sprawdzono czy użytkownicy mogą się zalogować
- [ ] Zweryfikowano backup (czy działa restore)

---

Aby uzyskać więcej informacji, zobacz:
- `VERSIONING.md` - Szczegóły systemu wersjonowania
- `CURSOR_DEVELOPMENT.md` - Development guide
- `QUICK_START.md` - Szybki start
- `README.md` - Ogólna dokumentacja

