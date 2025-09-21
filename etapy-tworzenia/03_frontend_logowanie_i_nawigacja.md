## 03. Frontend — logowanie i nawigacja (bez widoków modułów)

Zakres: dodaj ekran logowania, przechowywanie JWT, prosty guard routingu, layout po zalogowaniu (lewy panel: „Baza kontaktów”, „Użytkownicy” — ten drugi widoczny tylko dla admina). Brak implementacji widoków list/CRUD.

Kroki:
1) W `src/app` dodaj:
   - `router.tsx` z trasami: `/login`, `/app` (protected), placeholdery `/app/contacts`, `/app/users`.
   - `auth.ts` z `authStore` (np. context lub prosty Zustand) — przechowuj token i `currentUser` (z `/api/users/me`).
   - `api.ts` klient HTTP (fetch/axios) z bazowym URL `VITE_API_BASE_URL`, interceptorem Authorization Bearer.
   - `layout/AppLayout.tsx` z lewym panelem nawigacji, górnym paskiem i slotem na content.

2) Ekran `LoginPage` (`/login`): formularz `login` + `password`, wywołuje `POST /api/auth/login`, zapis tokenu, pobranie `currentUser` i redirect do `/app/contacts`.

3) Widoczność linku „Użytkownicy” w panelu bocznym tylko gdy rola to `admin`.

4) Styl i dostępność: duże, czytelne fonty (min 16–18px bazowo), wysoki kontrast, focus states, czytelne odstępy. Bez bibliotek UI w tym etapie. Przygotuj prosty theme tokens plik (CSS variables) — bez wdrażania motywów.

5) Walidacja ręczna: błędne dane logowania → komunikat, poprawne → redirect.

Koniec etapu: Logowanie działa z backendem, jest layout i nawigacja, brak właściwych widoków modułów.


