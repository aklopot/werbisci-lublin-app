## Werbisci Lublin App

Profesjonalna aplikacja webowa do zarządzania kontaktami i użytkownikami, z naciskiem na prostotę, dostępność i elegancki wygląd dla osób starszych. Backend: FastAPI (Python 3.11+), Frontend: React + TypeScript + Vite, Baza danych: SQLite. Wdrożenie: Docker/Compose (bez Kubernetes).

### Architektura
- Frontend: React + TypeScript + Vite
- Backend: FastAPI (Python 3.11+)
- Baza danych: SQLite (plikowa, trwałość przez wolumen)
- Uwierzytelnianie: JWT, role: user, manager, admin
- Drukowanie: podgląd i zapis do PDF (koperty oraz etykiety 3x7 na A4, bez marginesów)
- Konteneryzacja: Docker, uruchomienie: Docker Compose (jeden wspólny `docker compose up`)
- Wdrożenie: VPS (np. ZAP-Hosting) — zob. `ZAP-Hosting` (`https://zap-hosting.com/`)

### Struktura projektu (docelowa)
```
werbisci-lublin-app/
├── backend/
│   ├── app/
│   │   ├── core/            # konfiguracja, bezpieczeństwo, deps
│   │   ├── modules/
│   │   │   ├── users/       # modele, schematy, repozytoria, serwisy, API
│   │   │   └── addresses/   # j.w.
│   │   ├── api/             # routery FastAPI
│   │   └── main.py          # punkt wejścia
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # routing, layout, theming, auth
│   │   ├── modules/
│   │   │   ├── contacts/    # UI listy, formularze, podglądy wydruku
│   │   │   └── users/       # UI zarządzania użytkownikami (admin)
│   │   └── shared/          # komponenty współdzielone (UI, hooki)
│   ├── Dockerfile
│   └── package.json
├── docker/
│   └── nginx/               # (opcjonalnie) serwowanie frontendu w prod
├── docker-compose.yml       # wspólne uruchomienie frontend + backend
├── .env                     # zmienne backend (lokal/prod)
├── .env.frontend            # zmienne frontend (VITE_*)
├── etapy-tworzenia/         # precyzyjne etapy dla Cursor AI (GPT-5)
└── README.md
```

### Wymagania
- Node.js 18+
- Python 3.11+
- Docker Desktop / Docker Engine + Docker Compose
- Git

### Szybki start (dev, ręcznie)
1) Backend
```powershell
cd backend
python -m venv .venv_werbisci-lublin-app
./.venv_werbisci-lublin-app/Scripts/Activate.ps1
linux:
source .venv_werbisci-lublin-app/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2) Frontend
```powershell
cd frontend
npm install
npm run dev
```

Frontend dev: http://localhost:5173, Backend dev: http://localhost:8000

### Uruchomienie przez Docker Compose (zalecane)
Po utworzeniu plików (w kolejnych etapach):
```bash
docker compose up -d --build
```
To polecenie buduje i uruchamia frontend oraz backend. SQLite będzie montowany jako wolumen.

### Zmienne środowiskowe
Backend (`.env`):
```
APP_ENV=production
JWT_SECRET=change_me_strong_secret
ADMIN_LOGIN=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
SQLITE_DB_PATH=/data/werbisci-app.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend (`.env.frontend`):
```
VITE_API_BASE_URL=http://localhost:8000
```

### Moduły i funkcje
- Użytkownicy
  - Rejestracja startowa admina z ENV (bootstrap)
  - Logowanie: login + hasło (JWT)
  - Role: user, manager, admin
  - Uprawnienia: admin zarządza użytkownikami i ich rolami

- Baza kontaktów (Adresy)
  - Pola: Imię, Nazwisko, Ulica, Nr Mieszkania, Miasto, Kod pocztowy, Znacznik etykiet
  - Operacje: dodaj, edytuj, usuń, wyszukaj (imię, nazwisko, adres, znacznik)
  - Drukowanie:
    - Koperta: adres po prawej, po lewej logo + adres Werbistów, podgląd + możliwość pogrubienia/zmiany rozmiaru czcionki, druk lub zapis do PDF
    - Etykiety: A4 bez marginesów, siatka 3×7; podgląd wielu stron, druk lub zapis do PDF; źródło: wyłącznie rekordy ze znacznikiem etykiet
  - Eksport (manager, admin): CSV, ODS, PDF

### API (docelowo)
- Auth
  - POST `/api/auth/login` → JWT
  - GET `/api/users/me`
- Users (admin)
  - CRUD użytkowników + zmiana ról
- Addresses
  - CRUD `/api/addresses`
  - GET `/api/addresses/search?firstName=&lastName=&city=&street=&labelMarked=`
  - GET `/api/addresses/export.csv|.ods|.pdf` (manager/admin)

### UI (docelowo)
- Po zalogowaniu: lewy panel nawigacji: „Baza kontaktów”, „Użytkownicy” (tylko admin)
- Duże, czytelne fonty, wysoki kontrast, responsywność, prosty język
- Podglądy wydruku (koperta, etykiety) z opcjami formatowania i zapisu PDF

### Wdrożenie na VPS
Rekomendowany Linux VPS (np. Ubuntu 22.04). Dostawcą może być `ZAP-Hosting` (`https://zap-hosting.com/`).

1) Zainstaluj Docker + Compose
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```
2) Sklonuj repozytorium i skonfiguruj `.env` oraz `.env.frontend`
3) Uruchom: `docker compose up -d --build`
4) Upewnij się, że wolumen z SQLite (`/data/werbisci-app.db`) jest trwały i backupowany

### Rozwiązywanie problemów
- Port zajęty: zmień porty w `docker-compose.yml` lub procesie dev
- Brak JWT: sprawdź `JWT_SECRET` i logowanie
- PDF/druk: użyj przeglądarki z obsługą druku bezmarginesowego (Chrome/Edge)

### Licencja
Proprietary — Business Application


