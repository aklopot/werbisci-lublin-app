# System Wersjonowania Aplikacji

## Historia Zmian

### 0.6.0 (2025-11-10)
- **Dodano**: Nowy moduł "Logowania" dla administratorów
- **Dodano**: Śledzenie wszystkich logowań i wylogowań użytkowników w bazie danych
- **Dodano**: Widok logowań w zakładce "Użytkownicy" (tylko dla administratorów)
- **Dodano**: Rozróżnienie powodów wylogowania: ręczne, automatyczne (1h nieaktywności), wygaśnięcie tokenu
- **Dodano**: Kaskadowe usuwanie sesji logowania przy usuwaniu użytkownika
- **Dodano**: Licznik aktywnych sesji z ostrzeżeniem przed aktualizacją aplikacji
- **Dodano**: Funkcjonalność wyszukiwania i filtrowania logowań (po użytkowniku, statusie aktywności)
- **Dodano**: Administracja bazą logowań (wyczyść dane, odtwórz schemat)
- **Dodano**: Endpoint `/api/auth/logout` do rejestrowania wylogowań w bazie
- **Dodano**: Skrypty resetowania bazy danych (`reset-db.sh`, `reset-db.ps1`)
- **Dodano**: Automatyczne tworzenie użytkownika admin przy starcie aplikacji
- **Dodano**: Domyślne dane logowania: `admin` / `admin123` (można zmienić przez `.env`)
- **Zmieniono**: Integracja frontendu z backendem - automatyczne wysyłanie informacji o wylogowaniu
- **Zmieniono**: Typ kolumny `id` w tabeli `login_sessions` na BIGINT (wspiera miliardy rekordów)
- **Naprawiono**: Problem z TypeScript podczas buildu Dockera (`NodeJS.Timeout` → `number`)
- **MIGRACJA**: Przy upgrade z wcześniejszej wersji zobacz `MIGRATION_0.6.0.md`
- **RESET DB**: Jeśli baza się zepsuła lub zapomniałeś hasła, zobacz `DATABASE_RESET.md`

### 0.5.4 (2025-11-10)
- **Naprawiono**: Problem z wylogowywaniem przy odświeżeniu strony (F5)
- **Naprawiono**: Problem z wylogowywaniem przy zmianie URL (np. usunięcie części adresu)
- **Dodano**: Auto-logout po 1 godzinie nieaktywności użytkownika
- **Dodano**: Sprawdzanie ważności JWT tokenu (exp)
- **Dodano**: Tracking aktywności użytkownika (mousedown, keydown, scroll, touchstart, click)
- **Dodano**: Stan `isLoading` w AuthProvider zapobiegający przedwczesnemu przekierowaniu
- **Dodano**: Infrastruktura pod przyszły tracking sesji w bazie danych (komentarze TODO)
- **Zmieniono**: Główny route `/` teraz inteligentnie przekierowuje do `/app` jeśli użytkownik jest zalogowany

### 0.5.3
- Poprzednie wersje (bez szczegółowej dokumentacji)

## Przegląd

Aplikacja Werbisci Lublin wykorzystuje system wersjonowania semantycznego (SemVer) dla image Docker i aplikacji.

## Struktura wersjonowania

### Pliki konfiguracyjne

- `VERSION` - Główny plik wersji zawierający numer wersji semantycznej (np. `1.0.0`)
- `backend/app/version.json` - Generowany automatycznie podczas budowania
- `frontend/public/version.json` - Generowany automatycznie podczas budowania

### Format wersji

Wersje używają formatu: `MAJOR.MINOR.PATCH`
- **MAJOR** - Zmiany niekompatybilne wstecz
- **MINOR** - Nowe funkcjonalności kompatybilne wstecz
- **PATCH** - Poprawki błędów kompatybilne wstecz

### Tagi Docker

Każdy build tworzy następujące tagi:
- `werbisci-lublin-backend:1.0.0` (wersja)
- `werbisci-lublin-backend:1.0.0-abc123` (wersja + commit hash)
- `werbisci-lublin-backend:latest`

## Narzędzia buildowania

### Windows (PowerShell)

```powershell
# Budowanie lokalnie
.\build.ps1

# Deployment na serwerze
.\deploy.ps1
```

### Linux/Mac (Bash)

```bash
# Budowanie lokalnie
./build.sh

# Deployment na serwerze
./deploy.sh
```

## Proces deployment

### Stary proces (NIE UŻYWAĆ)
```bash
docker compose down && git pull && docker compose up -d --build
```

### Nowy proces (ZALECANY)

Na serwerze wykonaj:

```bash
# 1. Upewnij się że skrypty są wykonywalne
chmod +x build.sh deploy.sh

# 2. Wykonaj deployment
./deploy.sh
```

Skrypt automatycznie:
1. Pobierze najnowszy kod z git
2. Odczyta wersję z pliku VERSION
3. **Sprawdzi czy nie deployujesz tej samej wersji** (zabezpieczenie)
4. Zatrzyma działające kontenery
5. Wygeneruje git commit hash
6. Zbuduje image Docker z odpowiednimi tagami i labelami
7. Uruchomi kontenery z wersjonowanymi image

### Zabezpieczenie wersji

Jeśli spróbujesz uruchomić `./deploy.sh` bez zmiany wersji, zobaczysz:

```
❌ ERROR: Version conflict detected!

Current running version: 0.6.0
Version in VERSION file: 0.6.0

You are trying to deploy the SAME version that is currently running.

Please update the VERSION file before deploying:
  1. Edit VERSION file and increment the version number
  2. Example: 0.6.0 → 0.6.1 (patch) or 0.7.0 (minor) or 1.0.0 (major)
  3. Commit the change: git add VERSION && git commit -m 'Bump version to X.Y.Z'
  4. Push: git push
  5. Run deploy.sh again
```

To zapobiega przypadkowemu wdrożeniu bez zmiany wersji.

### Ręczne budowanie

Jeśli potrzebujesz ręcznie zbudować z konkretną wersją:

```bash
# Ustaw zmienne środowiskowe
export VERSION="1.0.0"
export GIT_COMMIT=$(git rev-parse --short HEAD)
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export APP_VERSION="${VERSION}-${GIT_COMMIT}"

# Buduj z docker compose
docker compose build

# Uruchom
docker compose up -d
```

## Zmiana wersji

### Aktualizacja numeru wersji

1. Edytuj plik `VERSION`:
```bash
echo "1.1.0" > VERSION
```

2. Commit i push:
```bash
git add VERSION
git commit -m "Bump version to 1.1.0"
git push
```

3. Deploy na serwerze:
```bash
./deploy.sh
```

### Wersjonowanie semantyczne - przykłady

- `1.0.0` → `1.0.1` - Poprawka błędu
- `1.0.0` → `1.1.0` - Nowa funkcjonalność
- `1.0.0` → `2.0.0` - Zmiana łamiąca kompatybilność

## Sprawdzanie wersji

### W aplikacji

Po zalogowaniu przejdź do zakładki **"Informacje"** w menu głównym.
Zobaczysz:
- Wersję aplikacji
- Git commit hash
- Datę budowy
- Tag Docker image

### Przez API

```bash
curl http://localhost:8000/api/version
```

Odpowiedź:
```json
{
  "version": "1.0.0",
  "commit": "abc123",
  "buildDate": "2024-11-08T12:00:00Z"
}
```

### Docker image labels

```bash
docker inspect werbisci-lublin-backend:latest | grep -A 5 Labels
```

## Debugowanie

### Problem: Version.json nie istnieje

Skrypty `build.sh` / `build.ps1` automatycznie generują te pliki.
Jeśli budowanie odbywa się bez skryptów, aplikacja użyje zmiennych środowiskowych lub wartości domyślnych.

### Problem: Stare tagi Docker

Usuń stare image:
```bash
docker image prune -a
```

### Problem: Deployment pokazuje starą wersję

1. Sprawdź czy plik VERSION został zaktualizowany
2. Sprawdź czy git pull pobrał zmiany
3. Przebuduj z `--no-cache`:
```bash
docker compose build --no-cache
```

## Dla developerów w Cursor

### Lokalne uruchamianie z wersją

W Cursor/lokalnie możesz uruchomić bez wersjonowania:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Wersja będzie domyślnie ustawiona na `dev` / `unknown`.

### Testowanie systemu wersjonowania lokalnie

```powershell
# Windows
.\build.ps1
docker compose up

# Sprawdź http://localhost:5173/app/info
```

```bash
# Linux/Mac
./build.sh
docker compose up

# Sprawdź http://localhost:5173/app/info
```

## Najlepsze praktyki

1. **Zawsze używaj deploy.sh/deploy.ps1** na serwerze produkcyjnym
2. **Aktualizuj VERSION** przed każdym deployment do produkcji
3. **Taguj release'y w git** aby śledzić wersje:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
4. **Dokumentuj zmiany** w CHANGELOG.md (jeśli istnieje)
5. **Testuj na development** przed deployment do produkcji

## Migracja ze starego systemu

Jeśli korzystałeś z poprzedniego procesu deployment:

1. Usuń stare kontenery:
```bash
docker compose down
```

2. Usuń stare image (opcjonalnie):
```bash
docker image rm werbisci-lublin-backend werbisci-lublin-frontend
```

3. Użyj nowego procesu:
```bash
./deploy.sh
```

## Wsparcie

W razie problemów sprawdź:
- Logi Docker: `docker compose logs -f`
- Status kontenerów: `docker compose ps`
- Wersję w aplikacji: zakładka "Informacje"

