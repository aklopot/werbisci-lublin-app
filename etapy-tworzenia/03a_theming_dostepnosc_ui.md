## 03a. Theming i dostępność (UI przyjazne osobom starszym)

Zakres: skonfiguruj bazowe zmienne stylów i zasady dostępności. Nie implementuj jeszcze widoków modułów.

Kroki:
1) W `frontend/src/app` dodaj plik `theme.css` z CSS variables (np. rozmiary fontów, kolory o wysokim kontraście, spacing). Ustal bazowy rozmiar fontu 18px i wysokość linii 1.6.

2) Dodaj `AccessibleLayoutGuidelines.md` (krótki dokument) z zasadami:
   - Minimalny kontrast WCAG AA, duże przyciski (min 44×44 px)
   - Widoczne focus outline
   - Czytelne labelki i opisy pól
   - Unikanie ścisku — duże odstępy

3) W `AppLayout.tsx` zastosuj klasy bazujące na zmiennych (bez biblioteki UI). Upewnij się, że nawigacja boczna ma czytelne odstępy i odpowiedni kontrast.

4) Nie dodawaj trybu dark w tym etapie. Tylko solidny, jasny, wysoko-kontrastowy motyw.

Koniec etapu: Zdefiniowane bazowe style i wytyczne dostępności gotowe do użycia przez kolejne etapy.


