# Reset Bazy Danych - Instrukcja

## Kiedy używać?

Użyj skryptu `reset-db.sh` (Linux/Mac) lub `reset-db.ps1` (Windows) gdy:

- ❌ Nie możesz się zalogować (hasło admin nie działa)
- ❌ Baza danych jest uszkodzona
- ❌ Chcesz zacząć od czystej instalacji
- ❌ Migracja schematu się nie powiodła

⚠️ **UWAGA**: Ta operacja **USUNIE WSZYSTKIE DANE**:
- Wszystkich użytkowników
- Wszystkie adresy kontaktów
- Wszystkie sesje logowania

## Krok 1: Przygotowanie (WAŻNE!)

### Utwórz plik `.env` z danymi admina

**Na serwerze (Linux):**

```bash
cd /ścieżka/do/werbisci-lublin-app

# Utwórz plik .env z danymi admina
cat > .env << 'EOF'
# Admin credentials
ADMIN_LOGIN=twoj-login
ADMIN_PASSWORD=twoje-silne-haslo
ADMIN_EMAIL=twoj@email.com
EOF
```

**Lokalnie (Windows PowerShell):**

```powershell
cd d:\repositories\itsolutions\werbisci\werbisci-lublin-app

# Utwórz plik .env
@"
# Admin credentials
ADMIN_LOGIN=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@werbisci.local
"@ | Out-File -FilePath .env -Encoding UTF8
```

### Przykładowe wartości

```env
# Admin credentials
ADMIN_LOGIN=administrator
ADMIN_PASSWORD=SuperSecurePass123!
ADMIN_EMAIL=admin@werbisci.pl
```

## Krok 2: Uruchomienie skryptu

### Na serwerze (Linux):

```bash
# Nadaj uprawnienia do wykonania
chmod +x reset-db.sh

# Uruchom skrypt
./reset-db.sh

# Skrypt zapyta o potwierdzenie
# Wpisz: YES
```

### Lokalnie (Windows):

```powershell
# Uruchom skrypt PowerShell
.\reset-db.ps1

# Skrypt zapyta o potwierdzenie
# Wpisz: YES
```

## Co robi skrypt?

1. **Zatrzymuje kontenery** Docker
2. **Usuwa stary plik bazy** `data/werbisci-app.db`
3. **Usuwa pliki pomocnicze** (journal, WAL)
4. **Uruchamia kontenery** - backend automatycznie:
   - Tworzy wszystkie tabele (users, addresses, login_sessions)
   - Tworzy użytkownika admin z danych z `.env`
5. **Wyświetla dane logowania**

## Co zobaczysz?

```
======================================
DATABASE RESET SCRIPT
======================================

⚠️  WARNING: This will DELETE all data!
⚠️  All users, addresses, and login sessions will be LOST!

Are you sure you want to continue? Type 'YES' to confirm: YES

Starting database reset...

1. Stopping containers...
2. Removing old database file...
   ✓ Database file deleted
3. Starting containers...
4. Waiting for backend to initialize (10 seconds)...
   ✓ New database created

======================================
DATABASE RESET COMPLETE!
======================================

Admin credentials:
  Login:    administrator
  Password: SuperSecurePass123!

You can now log in to the application
======================================
```

## Weryfikacja

### Sprawdź logi backendu:

```bash
docker compose logs backend --tail=30
```

Powinieneś zobaczyć:
```
Initializing database tables...
Ensuring admin user exists...
Created admin user: administrator
Admin user ready: administrator
```

### Sprawdź utworzone tabele:

```bash
docker compose exec backend sqlite3 /data/werbisci-app.db ".tables"
```

Powinny być:
```
addresses        login_sessions   users
```

### Sprawdź admina:

```bash
docker compose exec backend sqlite3 /data/werbisci-app.db "SELECT id, login, email, role FROM users;"
```

## Logowanie do aplikacji

Po resecie możesz się zalogować używając danych z pliku `.env`:

1. Otwórz przeglądarkę
2. Przejdź do aplikacji (np. `http://localhost:5173` lub `http://twoj-serwer:5173`)
3. Użyj danych z `.env`:
   - **Login**: wartość `ADMIN_LOGIN`
   - **Hasło**: wartość `ADMIN_PASSWORD`

## Rozwiązywanie problemów

### Problem: "Database file not found"

```bash
# Sprawdź logi backendu
docker compose logs backend

# Upewnij się że kontener backend działa
docker compose ps

# Restart backendu
docker compose restart backend
```

### Problem: "Could not create admin user"

```bash
# Sprawdź czy .env jest poprawny
cat .env

# Sprawdź logi szczegółowe
docker compose logs backend | grep -i error

# Spróbuj ręcznie
docker compose exec backend python -m app.core.init_db
```

### Problem: Nadal nie mogę się zalogować

```bash
# Sprawdź czy admin istnieje w bazie
docker compose exec backend sqlite3 /data/werbisci-app.db "SELECT * FROM users WHERE role='admin';"

# Jeśli brak, dodaj ręcznie (tymczasowo)
docker compose exec backend python << 'PYTHON'
from app.core.db import SessionLocal
from app.modules.users.services import UserService

db = SessionLocal()
try:
    UserService().ensure_admin_exists(db)
    print("Admin created successfully")
finally:
    db.close()
PYTHON
```

## Bezpieczeństwo

### 🔒 WAŻNE dla produkcji:

1. **NIE UŻYWAJ** domyślnych haseł (`admin`/`admin123`)
2. **ZAWSZE** twórz plik `.env` z silnym hasłem
3. **NIE COMMITUJ** pliku `.env` do gita (jest w `.gitignore`)
4. **ZMIEŃ HASŁO** po pierwszym logowaniu

### Silne hasło powinno mieć:
- Co najmniej 12 znaków
- Wielkie i małe litery
- Cyfry
- Znaki specjalne
- Przykład: `MyStr0ng!Pass@2025`

## Ręczny reset (alternatywa)

Jeśli skrypt nie działa, możesz zrobić to ręcznie:

```bash
# 1. Zatrzymaj kontenery
docker compose down

# 2. Usuń bazę
rm -f data/werbisci-app.db

# 3. Utwórz .env (jak powyżej)

# 4. Uruchom
docker compose up -d

# 5. Sprawdź logi
docker compose logs backend
```

## Backup przed resetem (opcjonalnie)

Jeśli chcesz zachować kopię starej bazy:

```bash
# Przed uruchomieniem reset-db.sh
cp data/werbisci-app.db data/werbisci-app.db.backup-$(date +%Y%m%d-%H%M%S)
```

Potem możesz przywrócić:

```bash
docker compose down
cp data/werbisci-app.db.backup-YYYYMMDD-HHMMSS data/werbisci-app.db
docker compose up -d
```

## Wsparcie

W razie problemów sprawdź:
- Logi: `docker compose logs -f backend`
- Status: `docker compose ps`
- Tabele: `docker compose exec backend sqlite3 /data/werbisci-app.db ".schema"`

