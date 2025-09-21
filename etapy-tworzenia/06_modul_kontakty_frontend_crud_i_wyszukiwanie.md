## 06. Frontend — Baza kontaktów: CRUD i wyszukiwanie

Zakres: widoki listy, formularze dodawania/edycji, usuwanie, wyszukiwarka po imieniu, nazwisku, adresie, znaczniku etykiet. Bez drukowania i eksportu.

Kroki:
1) W `src/modules/contacts` dodaj:
   - `api.ts`: wywołania REST do `/api/addresses`.
   - `types.ts`: typy TS.
   - `ContactsListPage.tsx`: tabela/karty z listą, filtry (inputy + checkbox label_marked), przyciski add/edit/delete.
   - `ContactForm.tsx`: formularz (first_name, last_name, street, apartment_no, city, postal_code, label_marked).

2) Routing: `/app/contacts` renderuje `ContactsListPage` w `AppLayout`.

3) UX: duże kontrolki, czytelny kontrast, paginacja lub lazy-load przy dłuższej liście.

4) Walidacja: proste reguły (wymagane pola, format kodu pocztowego po stronie UI).

Koniec etapu: użytkownik zarządza kontaktami przez UI, działa wyszukiwanie.


