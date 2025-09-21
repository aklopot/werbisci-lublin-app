## 02a. Baza danych — schema i seeding (SQLite)

Zakres: utwórz strukturę bazy i skrypt inicjalizacji dla SQLite pod `SQLITE_DB_PATH=/data/werbisci-app.db`. Stwórz tabele `users` i `addresses`, indeksy pod wyszukiwanie, oraz seeding: użytkownik `admin/admin` (hasło zahashowane bcrypt) i kilka przykładowych adresów. Nie dodawaj endpointów ani logiki auth — to w następnym etapie.

Wymagania:
- Użyj istniejącego `app/core/db.py` (jeśli brak — utwórz) do połączenia z `SQLITE_DB_PATH`.
- Modele SQLAlchemy w tym etapie będą źródłem prawdy dla kolejnych etapów (auth, CRUD, druk, eksport). Nie duplikuj modeli później.

Kroki:
1) `app/core/config.py` — upewnij się, że czyta `SQLITE_DB_PATH` (domyślnie `/data/werbisci-app.db`).

2) `app/core/db.py` — skonfiguruj engine i `SessionLocal` dla SQLite (z `check_same_thread=False`).

3) `app/modules/users/models.py` — zdefiniuj model `User`:
   - Kolumny:
     - `id` (Integer, PK, autoincrement)
     - `full_name` (String(200), not null)
     - `login` (String(100), not null, unique, indexed)
     - `email` (String(200), not null, unique, indexed)
     - `password_hash` (String(255), not null)
     - `role` (String(20), not null, default `'user'`, CHECK wśród: `user|manager|admin`)
     - `created_at` (DateTime, default now)
     - `updated_at` (DateTime, auto-update)
   - Indeksy: `ix_users_login`, `ix_users_email`.

4) `app/modules/addresses/models.py` — zdefiniuj model `Address`:
   - Kolumny:
     - `id` (Integer, PK, autoincrement)
     - `first_name` (String(100), not null)
     - `last_name` (String(100), not null, index)
     - `street` (String(200), not null)
     - `apartment_no` (String(50), nullable)
     - `city` (String(120), not null, index)
     - `postal_code` (String(20), not null, index)
     - `label_marked` (Boolean, not null, default False, index)
     - `created_at` (DateTime, default now)
     - `updated_at` (DateTime, auto-update)
   - Opcjonalne indeksy dodatkowe pod wyszukiwarkę (po `street`, `last_name`, `city`).

5) `backend/app/core/init_db.py` — skrypt inicjalizacyjny (idempotentny):
   - Tworzy wszystkie tabele: `Base.metadata.create_all(bind=engine)`.
   - Tworzy użytkownika admin, jeśli nie istnieje (`login='admin'`, `email='admin@example.com'`), z hasłem `'admin'` zahashowanym przez `passlib[bcrypt]`.
   - Dodaje kilka przykładowych adresów (2–3 rekordy) jeśli tabela pusta.
   - Nie wypisuje haseł w logach; wypisz jedynie krótkie podsumowanie (liczby rekordów).

6) Zależności (uaktualnij `backend/requirements.txt` jeśli potrzeba): `SQLAlchemy`, `passlib[bcrypt]` są już zdefiniowane w etapie 01; nic więcej nie dodawaj.

7) Uruchomienie inicjalizacji (wybierz jedno):
   - Dev (venv):
     ```powershell
     cd backend
     python -m venv .venv_werbisci-lublin-app
     ./.venv_werbisci-lublin-app/Scripts/Activate.ps1
     pip install -r requirements.txt
     python -m app.core.init_db
     ```
   - Docker Compose:
     ```bash
     docker compose run --rm backend python -m app.core.init_db
     ```

8) Weryfikacja:
   - Plik bazy istnieje: `/data/werbisci-app.db` (w kontenerze jako wolumen; lokalnie ścieżka zgodna z ENV).
   - W tabeli `users` istnieje `admin` (rola `admin`).
   - W tabeli `addresses` znajdują się rekordy przykładowe.

Uwagi spójności (ważne):
- Etap 02 (uwierzytelnianie i role) ma korzystać z modelu `User` utworzonego tutaj. Nie twórz go ponownie.
- Etap 05 (moduł kontaktów backend) ma korzystać z modelu `Address` utworzonego tutaj. Nie twórz go ponownie.
- W produkcji należy nadpisać admina wartościami z `.env` i zmienić hasło po wdrożeniu; seed `'admin/admin'` służy wyłącznie środowisku deweloperskiemu.

Koniec etapu: Struktura bazy utworzona, seed danych wykonany, gotowe do użycia przez kolejne etapy.


