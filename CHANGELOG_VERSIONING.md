# Changelog - System Wersjonowania

Data: 8 listopada 2024

## Podsumowanie

Dodano kompletny system wersjonowania dla aplikacji Werbisci Lublin, obejmujący:
- Wersjonowanie semantyczne (SemVer)
- Automatyczne tagowanie Docker images
- Śledzenie git commit hash
- Nową zakładkę "Informacje" z wersją aplikacji
- Skrypty deployment dla Windows i Linux

## Nowe pliki

### Konfiguracja wersjonowania
- `VERSION` - Główny plik z numerem wersji (obecnie: 1.0.0)
- `.gitignore` - Zaktualizowany o pliki version.json

### Skrypty buildowania i deployment
- `build.sh` - Skrypt budowania dla Linux/Mac
- `build.ps1` - Skrypt budowania dla Windows (PowerShell)
- `deploy.sh` - Skrypt deployment dla Linux/Mac
- `deploy.ps1` - Skrypt deployment dla Windows (PowerShell)

### Dokumentacja
- `VERSIONING.md` - Kompletna dokumentacja systemu wersjonowania
- `CURSOR_DEVELOPMENT.md` - Przewodnik dla developerów w Cursor
- `QUICK_START.md` - Szybki start dla developerów i adminów
- `CHANGELOG_VERSIONING.md` - Ten plik

## Zmodyfikowane pliki

### Backend

#### `backend/Dockerfile`
- Dodano build arguments: VERSION, GIT_COMMIT, BUILD_DATE
- Dodano environment variables dla wersji
- Dodano labels do Docker image

#### `backend/app/main.py`
- Dodano import: json, os, Path
- Dodano endpoint `GET /api/version` zwracający informacje o wersji

### Frontend

#### `frontend/Dockerfile`
- Dodano build arguments: VERSION, GIT_COMMIT, BUILD_DATE
- Dodano automatyczne generowanie version.json
- Dodano labels do Docker image

#### `frontend/src/modules/InfoPage.tsx` (nowy plik)
- Nowa strona "Informacje"
- Wyświetla wersję backendu i frontendu
- Pokazuje commit hash i datę budowy
- Informacje o Misjonarzach Werbistach w Lublinie

#### `frontend/src/app/router.tsx`
- Dodano import InfoPage
- Dodano route `/app/info`

#### `frontend/src/app/ui/AppLayout.tsx`
- Dodano link "Informacje" w nawigacji

### Docker

#### `docker-compose.yml`
- Dodano image tags z wersją: `${APP_VERSION:-latest}`
- Dodano build args dla VERSION, GIT_COMMIT, BUILD_DATE
- Dodano `restart: unless-stopped` dla obu serwisów

### Dokumentacja

#### `README.md`
- Zaktualizowano sekcję "Uruchomienie przez Docker Compose"
- Dodano instrukcje deployment z wersjonowaniem
- Dodano endpoint `/api/version` do dokumentacji API
- Zaktualizowano opis UI o zakładkę "Informacje"
- Dodano instrukcje aktualizacji wersji

## Pliki generowane automatycznie (nie commitować)

Te pliki są generowane podczas budowania przez skrypty build.sh/build.ps1:

- `backend/app/version.json` - Wersja backendu
- `frontend/public/version.json` - Wersja frontendu

Format:
```json
{
  "version": "1.0.0",
  "buildDate": "2024-11-08T12:00:00Z"
}
```

## Jak działa system wersjonowania

### 1. Plik VERSION
Zawiera numer wersji w formacie SemVer: `MAJOR.MINOR.PATCH`
- MAJOR: Zmiany łamiące kompatybilność
- MINOR: Nowe funkcjonalności (kompatybilne wstecz)
- PATCH: Poprawki błędów

### 2. Skrypty budowania
`build.sh` / `build.ps1`:
- Odczytują wersję z pliku VERSION
- Generują timestamp
- Tworzą pliki version.json
- Budują Docker images z pojedynczym tagiem wersji:
  - `werbisci-lublin-backend:1.0.0`
  - `werbisci-lublin-frontend:1.0.0`

### 3. Skrypty deployment
`deploy.sh` / `deploy.ps1`:
- Zatrzymują kontenery
- Pobierają zmiany z git (git pull)
- Uruchamiają build.sh/build.ps1
- Startują kontenery z nową wersją
- Pokazują informacje o wdrożonej wersji

### 4. Docker Compose
- Używa zmiennych środowiskowych do tagowania
- Przekazuje build args do Dockerfiles
- Tworzy labels w images

### 5. Backend API
Endpoint `/api/version`:
- Próbuje odczytać version.json
- Jeśli nie istnieje, używa zmiennych środowiskowych
- Fallback do wartości domyślnych ("dev", "unknown")

### 6. Frontend UI
Zakładka "Informacje":
- Pobiera wersję z backendu API (`/api/version`)
- Wyświetla wersję w dużym, czytelnym formacie
- Pokazuje datę budowy
- Informacje o Misjonarzach Werbistach w Lublinie

## Migracja ze starego systemu

### Stary proces (nie używać)
```bash
docker compose down && git pull && docker compose up -d --build
```

Problemy:
- Brak śledzenia wersji
- Wszystko tagowane jako "latest"
- Brak informacji o git commit
- Trudno zidentyfikować uruchomioną wersję

### Nowy proces (zalecany)
```bash
./deploy.sh  # Linux/Mac
.\deploy.ps1 # Windows
```

Korzyści:
- Automatyczne wersjonowanie
- Tagi z numerem wersji i commit hash
- Łatwe śledzenie wersji w aplikacji
- Możliwość rollback do konkretnej wersji
- Docker image labels z metadanymi

## Workflow developmentu

### Development w Cursor
```bash
# Bez wersjonowania - szybki development
cd backend
uvicorn app.main:app --reload

cd frontend
npm run dev
```

### Testowanie wersjonowania lokalnie
```powershell
# Windows
.\build.ps1
docker compose up
```

```bash
# Linux/Mac
./build.sh
docker compose up
```

### Release nowej wersji
```bash
# 1. Zaktualizuj VERSION
echo "1.1.0" > VERSION

# 2. Commit
git add VERSION
git commit -m "Bump version to 1.1.0"
git tag -a v1.1.0 -m "Version 1.1.0"
git push origin main --tags

# 3. Deploy na serwerze
ssh user@server
cd /path/to/app
./deploy.sh
```

## Sprawdzanie wersji

### W aplikacji
1. Zaloguj się
2. Przejdź do zakładki "Informacje"
3. Zobacz wersję backend, frontend i Docker image tag

### Przez API
```bash
curl http://localhost:8000/api/version
```

### Docker image
```bash
docker inspect werbisci-lublin-backend:latest | grep -A 5 Labels
```

## Rollback (powrót do poprzedniej wersji)

Jeśli nowa wersja ma problemy:

```bash
# 1. Zatrzymaj kontenery
docker compose down

# 2. Cofnij zmiany w git
git checkout v1.0.0  # lub konkretny tag/commit

# 3. Rebuild i uruchom
./deploy.sh
```

Lub użyj konkretnego tagu Docker:
```bash
docker compose down

# Edytuj docker-compose.yml lub ustaw zmienną
export APP_VERSION=1.0.0-abc123

docker compose up -d
```

## Najlepsze praktyki

1. **Zawsze aktualizuj VERSION** przed release do produkcji
2. **Taguj release'y w git**: `git tag -a v1.0.0 -m "Release 1.0.0"`
3. **Testuj lokalnie** przed deployment: `./build.sh && docker compose up`
4. **Dokumentuj zmiany** w commit messages
5. **Backup bazy** przed każdym update: `docker cp ...`
6. **Sprawdzaj wersję** po deployment: zakładka "Informacje"

## Dla użytkowników końcowych

Po deployment użytkownicy mogą sprawdzić wersję aplikacji:
1. Zalogować się do aplikacji
2. Kliknąć zakładkę "Informacje" w górnym menu
3. Zobaczyć:
   - Informacje o aplikacji
   - Wersję backendu (np. 1.0.0, commit abc123)
   - Wersję frontendu (np. 1.0.0, commit abc123)
   - Tag Docker image (np. 1.0.0-abc123)
   - Daty budowy

## Wsparcie techniczne

W razie problemów:
1. Sprawdź logi: `docker compose logs -f`
2. Sprawdź status: `docker compose ps`
3. Sprawdź wersję API: `curl http://localhost:8000/api/version`
4. Zobacz dokumentację: `VERSIONING.md`, `CURSOR_DEVELOPMENT.md`

## Co dalej?

Sugerowane kolejne kroki:
1. ✅ Przetestuj lokalnie: `./build.ps1` (Windows) lub `./build.sh` (Linux)
2. ✅ Sprawdź zakładkę "Informacje" w aplikacji
3. ✅ Zcommituj zmiany do git
4. ✅ Deploy na serwer testowy/produkcyjny: `./deploy.sh`
5. ✅ Sprawdź wersję po deployment
6. 📝 Opcjonalnie: Dodaj automatyczny backup przed deployment
7. 📝 Opcjonalnie: Skonfiguruj CI/CD dla automatycznego deployment

## Podsumowanie zmian

- ✅ Plik VERSION z numerem wersji semantycznej
- ✅ Skrypty build.sh/build.ps1 do budowania z wersją
- ✅ Skrypty deploy.sh/deploy.ps1 do deployment
- ✅ Endpoint API `/api/version`
- ✅ Zakładka "Informacje" w UI z wersją
- ✅ Docker images z tagami wersji
- ✅ Automatyczne generowanie version.json
- ✅ Pełna dokumentacja (VERSIONING.md, CURSOR_DEVELOPMENT.md, QUICK_START.md)
- ✅ Zaktualizowany README.md
- ✅ .gitignore dla version.json

System wersjonowania jest gotowy do użycia! 🎉

