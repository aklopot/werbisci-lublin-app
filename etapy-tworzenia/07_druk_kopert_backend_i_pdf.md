## 07. Backend — druk kopert: generowanie dokumentu i PDF

Zakres: endpoint, który przyjmuje `address_id` i opcje formatowania (pogrubienie, rozmiar czcionki) i zwraca PDF przygotowany do druku koperty: adres po prawej, po lewej logo + adres Werbistów. Logo trzymaj w `backend/app/assets/logo.png`. Bez UI frontu w tym etapie.

Kroki:
1) Dodaj zależność do generowania PDF (wybierz lekką bibliotekę, np. `reportlab`) i dodaj do `requirements.txt`. Nie dodawaj wielu bibliotek.

2) Utwórz `app/modules/printing/envelope.py` z funkcją `generate_envelope_pdf(address, options) -> bytes`.

3) Dodaj endpoint `GET /api/print/envelope/{address_id}` z query params: `bold` (bool), `font_size` (int, np. 12-24). Zwracaj `application/pdf` (bytes).

4) Umieść `logo.png` w `app/assets/` i załaduj w generatorze.

5) Test ręczny: pobierz PDF i sprawdź układ (A4, bez marginesów, adres po prawej, logo+adres po lewej).

Koniec etapu: Backend zwraca poprawny PDF koperty według parametrów.


