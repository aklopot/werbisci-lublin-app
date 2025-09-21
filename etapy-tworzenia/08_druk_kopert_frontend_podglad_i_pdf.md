## 08. Frontend — druk kopert: podgląd i zapis do PDF

Zakres: UI w module kontaktów do wywołania drukowania koperty dla pojedynczego adresu. Podgląd w przeglądarce (embed/iframe) i przyciski: Drukuj, Zapisz PDF. Wykorzystaj endpoint z etapu 07.

Kroki:
1) W `src/modules/contacts` dodaj `EnvelopePreview.tsx` z formularzem opcji (`bold`, `fontSize`) i `iframe` do podglądu PDF (blob URL). Pamiętaj o dużych kontrolkach i etykietach dla dostępności.

2) W `ContactsListPage` dodaj przycisk „Koperta” przy każdym wierszu, który otwiera `EnvelopePreview` dla danego `address_id`.

3) Przyciski: „Drukuj” (otwiera dialog druku przeglądarki dla `iframe`) oraz „Zapisz PDF” (pobiera blob jako plik `.pdf`).

4) UX: duże kontrolki, jasne nazwy, bez dodatkowych funkcji.

Koniec etapu: Użytkownik może obejrzeć podgląd koperty i wydrukować lub zapisać PDF.


