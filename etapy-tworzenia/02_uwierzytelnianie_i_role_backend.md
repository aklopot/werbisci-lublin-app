## 02. Uwierzytelnianie i role — Backend (tylko API + warstwy)

Zakres: dodaj w backendzie JWT login (`/api/auth/login`), model użytkownika z rolą, bootstrap admina z ENV, minimalne CRUD użytkownika (tylko w warstwach, bez widoków frontu). Nie implementuj jeszcze modułu adresów ani eksportów.

Kroki:
1) W `app/core` dodaj:
   - `config.py`: odczyt ENV (`JWT_SECRET`, `ADMIN_LOGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SQLITE_DB_PATH`, `CORS_ORIGINS`).
   - `db.py`: sesja SQLAlchemy do SQLite (plik z `.env`).
   - `security.py`: funkcje hash/salt (passlib) i generowanie/parsowanie JWT.
   - `deps.py`: zależności FastAPI (pobranie usera z JWT, wymuszanie ról).

2) W `app/modules/users` dodaj (wykorzystaj model z etapu 02a — nie duplikuj definicji):
   - `schemas.py`: Pydantic dla: `UserCreate`, `UserUpdateRole`, `UserRead`, `Token`.
   - `repositories.py`: operacje na DB (get_by_login, create, set_role, list, delete).
   - `services.py`: logika (rejestracja admina bootstrap, walidacja loginu/hasła, zmiana ról — tylko admin).
   - `api.py`: router `/api/users` (GET list, POST create admin-only, PATCH role admin-only, DELETE admin-only).

3) W `app/api` dodaj `auth.py` z endpointem `POST /api/auth/login` (zwraca JWT). W `app/main.py` zarejestruj CORS i routery: `auth`, `users`.

4) Dodaj inicjalizację bazy i bootstrap admina przy starcie (event startup): jeśli brak admina (wg `ADMIN_LOGIN`) — utwórz z hasłem z ENV.

5) Testy ręczne (curl/httpie):
   - `POST /api/auth/login` z adminem → 200 i token.
   - `GET /api/users` z Bearer admin → lista.
   - `PATCH /api/users/{id}/role` jako admin → zmiana roli.

Koniec etapu: Backend potrafi logować, rozpoznaje role, posiada minimalny CRUD użytkownika przez API. Brak frontu do tego etapu.

Uwagi dodatkowe (tylko ten etap, bez wykraczania):
- Upewnij się, że `SQLITE_DB_PATH` wskazuje na `/data/werbisci-app.db`.
- Nie dodawaj jeszcze modeli i API dla adresów.
- Nie dodawaj drukowania ani eksportów.


