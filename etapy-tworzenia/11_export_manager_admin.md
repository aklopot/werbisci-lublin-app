## 11. Eksport (manager, admin): CSV, ODS, PDF

Zakres: backendowe endpointy eksportu bazy adresów w formatach CSV, ODS, PDF; proste UI przyciski w module kontaktów dostępne tylko dla ról `manager` i `admin`.

Kroki backend:
1) Endpointy `GET /api/addresses/export.csv`, `export.ods`, `export.pdf`.
2) CSV: standardowy `text/csv` z nagłówkami.
3) ODS: użyj jednej lekkiej biblioteki (np. `pyexcel-ods3`) — dodaj do `requirements.txt` (nie dodawaj kilku naraz).
4) PDF: prosty raport tabelaryczny (ta sama biblioteka PDF co wcześniej).
5) Autoryzacja: dostęp tylko dla ról `manager`, `admin`.

Kroki frontend:
1) W `ContactsListPage` dodaj sekcję „Eksport” widoczną dla `manager`/`admin` z trzema przyciskami (CSV/ODS/PDF) — linki do endpointów z tokenem.

Koniec etapu: Eksport działa i zwraca pliki w trzech formatach, przyciski widoczne wg ról.


