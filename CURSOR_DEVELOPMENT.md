# Rozwój aplikacji w Cursor

Ten dokument opisuje jak pracować z aplikacją Werbisci Lublin w środowisku Cursor.

## Szybki start

### Uruchomienie backendu (lokalnie, bez Docker)

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend będzie dostępny pod: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Uruchomienie frontendu (lokalnie, bez Docker)

```bash
cd frontend
npm install
npm run dev
```

Frontend będzie dostępny pod: `http://localhost:5173`

### Uruchomienie z Docker (lokalne testowanie)

```bash
# Zwykły build bez wersji (dla dewelopmentu)
docker compose up --build

# Build z wersjonowaniem (testowanie produkcyjnego procesu)
# Windows
.\build.ps1
docker compose up

# Linux/Mac
./build.sh
docker compose up
```

## System wersjonowania

### Podczas developmentu w Cursor

Podczas normalnej pracy developowej **NIE MUSISZ** używać systemu wersjonowania.
Aplikacja będzie działać z domyślnymi wartościami:
- Version: `dev`
- Commit: `unknown`
- Build Date: `unknown`

### Testowanie wersjonowania lokalnie

Jeśli chcesz przetestować system wersjonowania:

1. Upewnij się że masz zacommitowane zmiany:
```bash
git add .
git commit -m "Test versioning"
```

2. Uruchom skrypt budowania:
```powershell
# Windows
.\build.ps1
```

```bash
# Linux/Mac
./build.sh
```

3. Sprawdź wersję w aplikacji:
- Uruchom: `docker compose up`
- Zaloguj się do aplikacji
- Przejdź do zakładki "Informacje"

### Zmiana wersji aplikacji

Gdy jesteś gotowy do release'u nowej wersji:

1. Zaktualizuj plik `VERSION`:
```bash
echo "1.1.0" > VERSION
```

2. Commit zmian:
```bash
git add VERSION
git commit -m "Bump version to 1.1.0"
git push
```

3. Na serwerze deployment odbywa się automatycznie przez `./deploy.sh`

## Struktura projektu

```
werbisci-lublin-app/
├── VERSION                    # Numer wersji aplikacji (SemVer)
├── build.sh / build.ps1       # Skrypty budowania z wersją
├── deploy.sh / deploy.ps1     # Skrypty deployment na serwer
├── docker-compose.yml         # Orkiestracja kontenerów
├── VERSIONING.md              # Dokumentacja wersjonowania
├── CURSOR_DEVELOPMENT.md      # Ten plik
│
├── backend/
│   ├── app/
│   │   ├── main.py           # Punkt wejścia, endpoint /api/version
│   │   ├── version.json      # Generowany podczas build (nie commitować)
│   │   ├── core/             # Config, DB, Security
│   │   ├── api/              # Auth routes
│   │   └── modules/
│   │       ├── users/        # Zarządzanie użytkownikami
│   │       ├── addresses/    # Baza kontaktów
│   │       └── printing/     # Generowanie PDF (etykiety, koperty)
│   ├── Dockerfile
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── router.tsx    # Routing + route /app/info
    │   │   ├── auth.tsx      # Kontekst autoryzacji
    │   │   └── ui/
    │   │       └── AppLayout.tsx  # Layout + nawigacja
    │   └── modules/
    │       ├── InfoPage.tsx       # Strona informacji o wersji
    │       ├── contacts/          # Zarządzanie kontaktami
    │       └── users/             # Zarządzanie użytkownikami (admin)
    ├── public/
    │   └── version.json      # Generowany podczas build (nie commitować)
    ├── Dockerfile
    └── package.json
```

## Pliki do .gitignore

Następujące pliki są generowane podczas budowania i NIE powinny być commitowane:

```
backend/app/version.json
frontend/public/version.json
```

Upewnij się że są dodane do `.gitignore`.

## Workflow developmentu

### 1. Praca nad nową funkcjonalnością

```bash
# 1. Utwórz branch
git checkout -b feature/nowa-funkcjonalnosc

# 2. Pracuj normalnie (bez wersjonowania)
# Backend: uvicorn app.main:app --reload
# Frontend: npm run dev

# 3. Testuj lokalnie

# 4. Commit i push
git add .
git commit -m "Add: nowa funkcjonalność"
git push origin feature/nowa-funkcjonalnosc

# 5. Merge do main (przez PR lub bezpośrednio)
```

### 2. Release nowej wersji

```bash
# 1. Zaktualizuj VERSION
echo "1.2.0" > VERSION

# 2. Commit
git add VERSION
git commit -m "Release version 1.2.0"
git tag -a v1.2.0 -m "Version 1.2.0"
git push origin main --tags

# 3. Na serwerze uruchom deployment
ssh user@server
cd /path/to/app
./deploy.sh
```

## Debugowanie

### Backend

```bash
cd backend
# Aktywuj venv
uvicorn app.main:app --reload --log-level debug
```

Logi będą pokazywać szczegółowe informacje o requestach.

### Frontend

```bash
cd frontend
npm run dev
```

Vite pokaże błędy kompilacji w konsoli i przeglądarce.

### Docker

```bash
# Logi wszystkich serwisów
docker compose logs -f

# Logi konkretnego serwisu
docker compose logs -f backend
docker compose logs -f frontend

# Sprawdź status
docker compose ps

# Rebuild bez cache
docker compose build --no-cache
```

### Sprawdzenie wersji

**Backend:**
```bash
curl http://localhost:8000/api/version
```

**Frontend:**
```bash
curl http://localhost:5173/version.json
```

**Docker labels:**
```bash
docker inspect werbisci-lublin-backend:latest | grep -A 5 Labels
```

## Częste problemy

### Problem: "Module not found"

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Problem: Port zajęty

Zmień port w docker-compose.yml lub zatrzymaj proces zajmujący port.

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <pid> /F

# Linux/Mac
lsof -i :8000
kill -9 <pid>
```

### Problem: Baza danych nie istnieje

Backend automatycznie tworzy bazę SQLite przy pierwszym uruchomieniu.
Sprawdź czy ścieżka w `.env` jest prawidłowa:

```
SQLITE_DB_PATH=./data/werbisci-app.db  # Lokalne
SQLITE_DB_PATH=/data/werbisci-app.db   # Docker
```

### Problem: CORS errors

Upewnij się że `CORS_ORIGINS` w `.env` zawiera URL frontendu:

```
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Problem: Version.json nie istnieje

To normalne podczas developmentu. Aplikacja użyje wartości domyślnych.
Jeśli chcesz przetestować wersjonowanie, użyj `build.sh`/`build.ps1`.

## Testy

### Backend

```bash
cd backend
pytest
# lub konkretny test
pytest tests/test_auth.py
```

### Frontend

```bash
cd frontend
npm run test
```

## Best Practices

1. **Nie commituj** `version.json` - są generowane podczas build
2. **Używaj semantic versioning** - MAJOR.MINOR.PATCH
3. **Taguj release'y w git** - ułatwia tracking wersji
4. **Testuj lokalnie** przed pushowaniem
5. **Dokumentuj zmiany** w commit messages
6. **Używaj feature branches** dla większych zmian

## Dodatkowe zasoby

- `VERSIONING.md` - Pełna dokumentacja wersjonowania
- `README.md` - Ogólna dokumentacja projektu
- `DEPLOYMENT_INSTRUCTIONS.md` - Instrukcje deployment
- `backend/app/main.py` - API endpoints
- `frontend/src/app/router.tsx` - Frontend routes

