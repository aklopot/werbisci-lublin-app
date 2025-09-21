## 05. Backend — moduł „Baza kontaktów” (Adresy)

Zakres: pełny CRUD oraz wyszukiwanie. Eksporty/druk — w osobnych etapach. Uprawnienia: dostęp dla zalogowanych (`user`, `manager`, `admin`).

Kroki:
1) W `app/modules/addresses` dodaj:
   - `models.py`: `Address` z polami: id, first_name, last_name, street, apartment_no, city, postal_code, label_marked (bool), timestamps.
   - `schemas.py`: `AddressCreate`, `AddressUpdate`, `AddressRead`, `SearchQuery`.
   - `repositories.py`: CRUD + `search` (po: imię, nazwisko, fragment adresu, `label_marked`).
   - `services.py`: walidacja prostych reguł (np. kod pocztowy formatowany), orkiestracja repo.
   - `api.py`: router `/api/addresses` z CRUD i `/api/addresses/search` (query params).

2) Rejestruj router w `app/main.py` (prefiks `/api/addresses`). Upewnij się, że używasz tej samej sesji DB (`/data/werbisci-app.db`).

3) Testy ręczne: utwórz kilka rekordów, sprawdź filtrowanie, paginację (opcjonalnie prosta `limit/offset`).

Koniec etapu: Adresy dostępne przez API z wyszukiwaniem. Bez drukowania i eksportu.


