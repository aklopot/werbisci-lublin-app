# Moduł "Logowania" - Dokumentacja Implementacji

## Przegląd

Dodano kompletny moduł do śledzenia logowań i wylogowań użytkowników w aplikacji Werbisci Lublin. Moduł jest dostępny tylko dla administratorów i pozwala monitorować aktywne sesje przed aktualizacją aplikacji.

## Główne Funkcjonalności

### 1. Śledzenie Sesji
- ✅ Automatyczne zapisywanie każdego logowania do bazy danych
- ✅ Rejestrowanie wylogowań z rozróżnieniem przyczyn:
  - **manual** - ręczne wylogowanie przez użytkownika
  - **inactivity** - automatyczne wylogowanie po 1h nieaktywności
  - **token_expired** - wygaśnięcie tokenu JWT
- ✅ Opcjonalne zapisywanie IP i User-Agent

### 2. Widok Administracyjny
- ✅ Nowa sekcja "Logowania" pod listą użytkowników w zakładce "Użytkownicy"
- ✅ Widoczne tylko dla administratorów
- ✅ Wyświetlanie wszystkich logowań z możliwością:
  - Wyszukiwania (IP, User-Agent, powód)
  - Filtrowania po użytkowniku
  - Filtrowania tylko aktywnych sesji
  - Sortowania po dowolnej kolumnie
  - Paginacji

### 3. Monitoring Aktywnych Sesji
- ✅ Licznik aktywnych sesji na górze tabeli
- ✅ Ostrzeżenie gdy są zalogowani użytkownicy
- ✅ Wyróżnienie aktywnych sesji kolorem żółtym
- ✅ Wyraźne oznaczenie "AKTYWNA SESJA" w kolumnie powodu wylogowania

### 4. Administracja Bazą
- ✅ Dropdown menu "Administracja bazy logowań"
- ✅ Opcja "Wyczyść dane" - usuwa wszystkie rekordy
- ✅ Opcja "Utwórz czysty schemat bazy" - odtwarza tabelę od nowa
- ✅ Potwierdzenia przed wykonaniem operacji

### 5. Kaskadowe Usuwanie
- ✅ Usunięcie użytkownika automatycznie usuwa wszystkie jego sesje logowania
- ✅ Relacja CASCADE DELETE w bazie danych

## Struktura Techniczna

### Backend (`backend/app/modules/login_sessions/`)

```
login_sessions/
├── __init__.py
├── models.py          # Model LoginSession z relacją do User
├── schemas.py         # Pydantic schemas (Read, Create, Update)
├── repositories.py    # Operacje bazodanowe
├── services.py        # Logika biznesowa
├── api.py            # Endpointy REST API
└── README.md         # Dokumentacja modułu
```

### Frontend (`frontend/src/modules/login-sessions/`)

```
login-sessions/
├── types.ts                    # Typy TypeScript
├── api.ts                      # Funkcje komunikacji z API
└── LoginSessionsTable.tsx      # Komponent tabeli logowań
```

### Zmiany w Istniejących Plikach

#### Backend
- `backend/app/main.py` - dodano router login_sessions
- `backend/app/api/auth.py` - dodano tworzenie sesji przy logowaniu i endpoint `/logout`
- `backend/app/core/init_db.py` - dodano import LoginSession dla auto-create

#### Frontend
- `frontend/src/app/auth.tsx` - podpięto wysyłanie informacji o wylogowaniu do backendu
- `frontend/src/modules/users/UsersListPage.tsx` - dodano komponent LoginSessionsTable

## API Endpoints

### Logowania
- `GET /api/login-sessions` - lista wszystkich sesji
- `GET /api/login-sessions/search` - wyszukiwanie z filtrami
- `GET /api/login-sessions/active-count` - liczba aktywnych sesji

### Administracja
- `DELETE /api/login-sessions/clear-data` - wyczyść wszystkie dane
- `POST /api/login-sessions/recreate-schema` - odtwórz schemat tabeli

### Autentykacja
- `POST /api/auth/login` - logowanie (tworzy sesję)
- `POST /api/auth/logout` - wylogowanie (oznacza sesję jako zakończoną)

## Baza Danych

### Tabela `login_sessions`

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | BIGINT PRIMARY KEY | ID sesji (wspiera miliardy rekordów) |
| user_id | INTEGER NOT NULL | FK do users (CASCADE DELETE) |
| login_time | DATETIME NOT NULL | Data i czas zalogowania |
| logout_time | DATETIME NULL | Data i czas wylogowania (NULL = aktywna) |
| logout_reason | VARCHAR(50) NULL | Powód: manual/inactivity/token_expired |
| ip_address | VARCHAR(100) NULL | Adres IP klienta |
| user_agent | VARCHAR(500) NULL | User-Agent przeglądarki |

**Indeksy:**
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (login_time)
- INDEX (logout_time)

**Uwaga o SQLite:**
SQLite nie ma natywnego typu BIGINT. SQLAlchemy `BigInteger` mapuje się na `INTEGER`, ale SQLite INTEGER jest 64-bitowy i wspiera pełny zakres BIGINT (-9 kwintylionów do +9 kwintylionów). To jest poprawne zachowanie.

## Wdrażanie na Serwerze

### Automatyczne Wdrożenie (Zalecane)

Moduł jest w pełni zintegrowany z systemem wdrażania:

```bash
# 1. Zatrzymaj kontenery
docker compose down

# 2. Zaktualizuj kod i wdroż
./deploy.sh
```

⚠️ **UWAGA dla upgrade z wcześniejszej wersji:**
Jeśli migruj z wersji przed 0.6.0, tabela `login_sessions` może mieć stary typ `id` (INTEGER zamiast BIGINT).
Zobacz instrukcje migracji w pliku **`MIGRATION_0.6.0.md`**.

Skrypt `deploy.sh`:
1. Pobierze najnowszy kod z git
2. Zbuduje nowe obrazy Docker
3. Uruchomi kontenery
4. **Automatycznie utworzy tabelę `login_sessions`** (jeśli nie istnieje) z BIGINT

### Ręczne Utworzenie Tabeli (Opcjonalne)

Jeśli z jakiegoś powodu potrzebujesz ręcznie utworzyć tabelę:

```bash
# W kontenerze backendu
docker compose run --rm backend python -m app.core.init_db
```

### Weryfikacja Po Wdrożeniu

1. Zaloguj się jako administrator
2. Przejdź do zakładki "Użytkownicy"
3. Przewiń w dół - powinna być widoczna sekcja "Logowania"
4. Sprawdź czy Twoje logowanie zostało zarejestrowane

## Testowanie Lokalne

### Backend

```bash
cd backend
python test_login_sessions.py
```

Ten skrypt:
- Utworzy testową sesję
- Policzy aktywne sesje
- Wykona wyszukiwania
- Oznaczy sesję jako wylogowaną
- Wyświetli podsumowanie

### Frontend

1. Uruchom aplikację lokalnie
2. Zaloguj się jako admin
3. Przejdź do `/app/users`
4. Sprawdź sekcję "Logowania" pod listą użytkowników

### Pełny Test Funkcjonalności

1. **Test logowania:**
   - Zaloguj się
   - Sprawdź czy pojawił się wpis w tabeli logowań
   - Sprawdź czy sesja jest oznaczona jako aktywna (żółte tło)

2. **Test ręcznego wylogowania:**
   - Wyloguj się przyciskiem
   - Zaloguj ponownie jako admin
   - Sprawdź czy poprzednia sesja ma powód "Ręcznie"

3. **Test wylogowania przez nieaktywność:**
   - Zaloguj się
   - Czekaj 1 godzinę (lub zmień `INACTIVITY_TIMEOUT_MS` w kodzie na krótszy czas)
   - System powinien wylogować
   - Sprawdź powód "Automatycznie (1h nieaktywności)"

4. **Test wyszukiwania:**
   - Użyj pola "Szukaj"
   - Filtruj po użytkowniku
   - Zaznacz "Tylko aktywne"

5. **Test administracji:**
   - Użyj menu "Administracja bazy logowań"
   - Wypróbuj "Wyczyść dane"
   - Wypróbuj "Utwórz czysty schemat bazy"

## Bezpieczeństwo

### Autoryzacja
- ✅ Wszystkie endpointy wymagają roli administratora
- ✅ Frontend sprawdza rolę przed wyświetleniem komponentu
- ✅ Backend weryfikuje uprawnienia w dependency `require_admin`

### Ochrona Danych
- ✅ Cascade delete chroni przed osieroconymi rekordami
- ✅ Potwierdzenia przed destrukcyjnymi operacjami
- ✅ Fire-and-forget dla wylogowania (nie blokuje UI)

### Prywatność
- ⚠️ IP i User-Agent są opcjonalne
- ⚠️ Administratorzy widzą wszystkie sesje wszystkich użytkowników
- 💡 W przyszłości można dodać maskowanie IP dla zgodności z RODO

## Konserwacja i Rozbudowa

### Czyszczenie Starych Danych

Możesz regularnie czyścić stare sesje:

```sql
-- SQL do usunięcia sesji starszych niż 90 dni
DELETE FROM login_sessions 
WHERE logout_time IS NOT NULL 
  AND logout_time < datetime('now', '-90 days');
```

Lub dodać endpoint w API:
```python
@router.delete("/clear-old/{days}")
def clear_old_sessions(days: int, db: Session = Depends(get_db)):
    # Usuń sesje starsze niż X dni
    ...
```

### Możliwe Rozszerzenia

1. **Wykresy i Statystyki**
   - Graf logowań w czasie
   - Najpopularniejsze godziny logowania
   - Średni czas sesji

2. **Wymuszenie Wylogowania**
   - Przycisk "Wymuś wylogowanie" przy aktywnej sesji
   - Endpoint do anulowania sesji

3. **Geolokalizacja**
   - Dodaj kolumnę `country`, `city` na podstawie IP
   - Wyświetlaj lokalizację w tabeli

4. **Alerty**
   - Email do admina gdy liczba aktywnych sesji > X
   - Powiadomienie o próbie logowania z nowego IP

5. **Export**
   - Export logowań do CSV/PDF
   - Raporty miesięczne

## Znane Ograniczenia

1. **Brak walidacji duplikatów**: Użytkownik może mieć wiele aktywnych sesji (np. różne przeglądarki)
2. **Fire-and-forget logout**: Jeśli backend nie odpowie, wylogowanie może się nie zarejestrować
3. **Brak synchronizacji między kartami**: Otwarcie w dwóch kartach = dwie sesje
4. **UTC timestamps**: Wyświetlane w czasie lokalnym użytkownika (może być mylące)

## Rozwiązywanie Problemów

### Tabela nie została utworzona

```bash
# Ręcznie utwórz schemat
docker compose run --rm backend python -m app.core.init_db
```

### Nie widzę sekcji logowań

- Sprawdź czy jesteś zalogowany jako admin
- Sprawdź konsolę przeglądarki na błędy
- Sprawdź logi backendu: `docker compose logs backend`

### Sesje nie są rejestrowane

- Sprawdź logi backendu podczas logowania
- Upewnij się że tabela istnieje: `sqlite3 data/werbisci-app.db ".tables"`
- Sprawdź czy endpoint `/api/auth/login` zwraca token

### Błąd "FOREIGN KEY constraint failed"

- Oznacza próbę utworzenia sesji dla nieistniejącego użytkownika
- Sprawdź czy user_id jest prawidłowe

## Wersja

Moduł został dodany w wersji **0.6.0** (2025-11-10)

Zobacz `VERSIONING.md` dla pełnej historii zmian.

## Wsparcie

W razie problemów:
1. Sprawdź logi: `docker compose logs -f backend`
2. Uruchom test: `python test_login_sessions.py`
3. Sprawdź dokumentację API w `backend/app/modules/login_sessions/README.md`

