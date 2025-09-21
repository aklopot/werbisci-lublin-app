## 10. Frontend — etykiety: podgląd i zapis do PDF

Zakres: UI do generowania i podglądu etykiet 3×7. Podgląd (iframe), przyciski: Drukuj, Zapisz PDF. Bez dodatkowych funkcji.

Kroki:
1) W `src/modules/contacts` dodaj `LabelsPreview.tsx` z przyciskiem „Generuj etykiety” (pobiera PDF z endpointu i pokazuje w `iframe`).

2) W `ContactsListPage` dodaj przycisk „Etykiety (3×7)” — otwiera `LabelsPreview`.

3) Przyciski w podglądzie: „Drukuj” (print na `iframe`) i „Zapisz PDF” (pobiera blob).

4) UX i dostępność: duże przyciski, czytelne nazwy, focus states. Wyświetl jasną informację, że biorą udział tylko rekordy ze znacznikiem etykiet.

Koniec etapu: Użytkownik może wygenerować, podejrzeć i wydrukować/zapisać etykiety 3×7.


