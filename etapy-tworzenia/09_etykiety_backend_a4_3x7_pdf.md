## 09. Backend — etykiety A4 3×7: generowanie PDF

Zakres: endpoint, który generuje dokument(y) A4 bez marginesów, siatka 3 kolumny × 7 wierszy, w każdej komórce jeden adres. Źródło danych: tylko `label_marked=True`. Zwraca jeden scalony PDF (wielostronicowy). Bez frontu w tym etapie.

Kroki:
1) W `app/modules/printing/labels.py` dodaj `generate_labels_pdf(addresses: list[Address]) -> bytes` wykorzystując tę samą bibliotekę PDF co w kopertach (np. `reportlab`).

2) Endpoint `GET /api/print/labels` (opcjonalne parametry: `font_size`, układ stały). Pobierz z DB wszystkie `label_marked=True`, ułóż siatkę 3×7 na kolejnych stronach.

3) Zwracaj `application/pdf` (bytes).

4) Test: wygeneruj PDF dla kilkudziesięciu rekordów — sprawdź podział na strony.

Koniec etapu: Backend zwraca wielostronicowy PDF etykiet 3×7 na A4 bez marginesów.


