# Moduł Logowania - Szybki Start

## Wdrożenie na Serwerze

### Pierwsze wdrożenie (migracja do 0.6.0)

⚠️ **WAŻNE**: Jeśli upgradujesz z wcześniejszej wersji, zobacz `MIGRATION_0.6.0.md`

```bash
# 1. Zatrzymaj aplikację
docker compose down

# 2. Pobierz kod i wdroż
git pull
./deploy.sh

# 3. Jeśli tabela login_sessions już istniała, usuń ją:
# (przez UI: Użytkownicy → Logowania → Administracja bazy → Utwórz czysty schemat)
# lub przez Docker:
docker compose run --rm backend python -c "from app.core.db import engine; from sqlalchemy import text; with engine.begin() as conn: conn.execute(text('DROP TABLE IF EXISTS login_sessions'))"

# 4. Uruchom ponownie
docker compose restart backend

# Gotowe! Tabela utworzy się automatycznie z BIGINT
```

### Kolejne wdrożenia

```bash
# Standardowy proces
./deploy.sh
```

## Jak Używać

### 1. Dostęp do Modułu
- Zaloguj się jako **administrator**
- Przejdź do zakładki **"Użytkownicy"**
- Przewiń w dół - pod listą użytkowników znajdziesz **"Logowania"**

### 2. Widok Logowań

**Informacje na liście:**
- ID sesji
- Użytkownik (imię i login)
- Data zalogowania
- Data wylogowania (lub "-" jeśli aktywna)
- Powód wylogowania:
  - **AKTYWNA SESJA** - użytkownik wciąż zalogowany (żółte tło)
  - **Ręcznie** - użytkownik wylogował się sam
  - **Automatycznie (1h nieaktywności)** - system wylogował po godzinie
  - **Token wygasł** - sesja wygasła
- IP adres
- User-Agent (przeglądarka)

### 3. Funkcje

**Wyszukiwanie:**
- Wpisz tekst w pole "Szukaj" - przeszukuje IP, User-Agent, powód

**Filtrowanie:**
- Wybierz użytkownika z listy
- Zaznacz "Tylko aktywne" aby zobaczyć tylko zalogowanych

**Sortowanie:**
- Kliknij na nagłówek kolumny aby sortować
- Kliknij ponownie aby odwrócić kolejność

**Paginacja:**
- Użyj przycisków « i » do nawigacji
- Domyślnie 50 rekordów na stronie

### 4. Ostrzeżenie o Aktywnych Sesjach

Na górze tabeli zobaczysz:
```
⚠️ Aktywnych sesji: 3. Nie wykonuj aktualizacji aplikacji gdy użytkownicy są zalogowani!
```

**WAŻNE:** Przed aktualizacją aplikacji upewnij się że licznik pokazuje 0!

### 5. Administracja Bazą

Menu **"Administracja bazy logowań"**:

**Wyczyść dane:**
- Usuwa WSZYSTKIE rekordy logowań
- Przydatne aby oczyścić starą historię
- ⚠️ Nieodwracalne!

**Utwórz czysty schemat bazy:**
- Usuwa tabelę i tworzy ją od nowa
- Używaj tylko gdy schemat jest uszkodzony
- ⚠️ Usuwa WSZYSTKIE dane!

## Przykłady Użycia

### Sprawdź kto jest teraz zalogowany
1. Zaznacz checkbox **"Tylko aktywne"**
2. Zobaczysz listę aktywnych sesji (żółte tło)

### Znajdź wszystkie logowania konkretnego użytkownika
1. Wybierz użytkownika z listy rozwijanej
2. Zobacz historię jego logowań

### Sprawdź logowania z konkretnego IP
1. Wpisz adres IP w pole wyszukiwania
2. System znajdzie wszystkie sesje z tego IP

### Wyczyść starą historię
1. Otwórz menu "Administracja bazy logowań"
2. Wybierz "Wyczyść dane"
3. Potwierdź operację

## Automatyzacja

### Sesje są tworzone automatycznie gdy:
- ✅ Użytkownik loguje się przez formularz
- ✅ Zapisywany jest login_time, IP, User-Agent

### Sesje są zamykane automatycznie gdy:
- ✅ Użytkownik klika "Wyloguj" → powód: "Ręcznie"
- ✅ Minęła 1h nieaktywności → powód: "Automatycznie (1h nieaktywności)"
- ✅ Token JWT wygasł → powód: "Token wygasł"

### Sesje są usuwane automatycznie gdy:
- ✅ Użytkownik zostanie usunięty (CASCADE DELETE)

## Typowe Scenariusze

### Scenariusz 1: Planowana aktualizacja
1. Przejdź do zakładki "Użytkownicy" → "Logowania"
2. Sprawdź licznik aktywnych sesji
3. Jeśli > 0, poczekaj aż użytkownicy się wylogują
4. Gdy = 0, możesz bezpiecznie uruchomić `./deploy.sh`

### Scenariusz 2: Debugging problemu z logowaniem
1. Użytkownik zgłasza problem z logowaniem
2. Wyszukaj jego sesje
3. Sprawdź czy ma aktywną sesję
4. Zobacz kiedy ostatnio się logował i czy były błędy

### Scenariusz 3: Audyt bezpieczeństwa
1. Eksportuj dane do CSV (TODO: dodać w przyszłości)
2. Przeanalizuj wzorce logowania
3. Zidentyfikuj nietypową aktywność

## FAQ

**Q: Czy mogę wymusić wylogowanie użytkownika?**
A: Obecnie nie, ale to możliwe rozszerzenie w przyszłości.

**Q: Ile miejsca zajmą dane logowań?**
A: ~200 bajtów na rekord. 1000 logowań ≈ 200 KB. Regularnie czyść stare dane.

**Q: Czy użytkownik może mieć wiele aktywnych sesji?**
A: Tak, np. desktop + mobile + tablet. Każda przeglądarka = osobna sesja.

**Q: Co jeśli tabela się uszkodzi?**
A: Użyj "Utwórz czysty schemat bazy" w menu administracji.

**Q: Czy dane są bezpieczne?**
A: Tak, tylko administratorzy mają dostęp. Rozważ RODO jeśli przechowujesz IP.

## Rozwiązywanie Problemów

| Problem | Rozwiązanie |
|---------|-------------|
| Nie widzę sekcji "Logowania" | Sprawdź czy jesteś adminem |
| Moje logowanie nie jest zapisane | Sprawdź logi: `docker compose logs backend` |
| Błąd "Foreign key constraint" | Tabela nie została utworzona, uruchom `init_db.py` |
| Stare dane zapełniają bazę | Użyj "Wyczyść dane" w menu administracji |

## Kontakt

W razie problemów zobacz pełną dokumentację: `LOGOWANIA_MODULE.md`

