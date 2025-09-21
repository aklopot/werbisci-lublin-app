## 00. Instrukcje dla Cursor AI (GPT-5)

Cel: Zapewnić, że każdy etap będzie wykonany precyzyjnie i bez nadmiarowych działań.

Zasady ogólne:
- Wykonuj tylko czynności z bieżącego etapu. Nie wykraczaj poza opisany zakres.
- Nie twórz przykładów/plików „na zapas”. Tylko to, co jest wyspecyfikowane.
- W kodzie używaj języka angielskiego (nazwy, komentarze, logi).
- Zachowuj czytelność i modularność (modules, services, repositories, models).
- Po każdej edycji sprawdź linter/formatowanie (jeśli dostępne) i popraw błędy.
- Jeżeli dany plik został już utworzony w poprzednim etapie, edytuj go — nie duplikuj.
- Zmiennych środowiskowych nie hartkoduj — korzystaj z `.env`/`.env.frontend`.
- Przy dockerze trzymaj się Compose jako głównej ścieżki uruchomienia (bez K8s).

Konwencje projektowe:
- Backend (FastAPI):
  - Warstwy: `models` (SQLAlchemy), `schemas` (Pydantic), `repositories`, `services`, `api` (routers), `core` (config, security, db, deps).
  - SQLite z plikiem w `/data/app.db` (produkcyjnie przez wolumen Dockera).
  - Autoryzacja JWT (Bearer), role: `user`, `manager`, `admin`.
  - Testowy bootstrap admina z ENV podczas startu.
- Frontend (React + TS + Vite):
  - Struktura: `src/app` (routing, layout, theme, auth), `src/modules/*` (feature moduły), `src/shared` (UI, hooks, utils).
  - UI przyjazne osobom starszym: duże fonty, wysoki kontrast, czytelne odstępy.
  - Podglądy wydruku i eksport do PDF dla adresów/etykiet.

Definicja „skończonego” etapu:
- Wszystkie pliki z etapu istnieją i mają minimalną, ale działającą zawartość.
- Kod buduje się/uruchamia w trybie przeznaczonym dla etapu (dev lub docker).
- Nie wprowadzasz elementów z kolejnych etapów.


