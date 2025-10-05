# Instrukcja bezpiecznego wdrożenia pola Description

## Zmiany wprowadzone

1. **Backend (baza danych i API):**
   - Dodano pole `description` do modelu `Address` w `backend/app/modules/addresses/models.py`
   - Zaktualizowano schematy Pydantic w `backend/app/modules/addresses/schemas.py`
   - Pole jest opcjonalne (nullable=True) z maksymalną długością 500 znaków

2. **Frontend:**
   - Dodano pole `description` do typów TypeScript w `frontend/src/modules/contacts/types.ts`
   - Zaktualizowano formularz kontaktów w `frontend/src/modules/contacts/ContactForm.tsx`
   - Pole opis jest wyświetlane jako textarea z 3 liniami, możliwość rozszerzenia
   - Pole znajduje się tuż nad opcją "Zaznaczony do etykiety"

3. **Migracja bazy danych:**
   - Utworzono bezpieczny skrypt migracji `backend/add_description_migration.py`

## Instrukcja wdrożenia

### Krok 1: Wdrożenie na serwerze

1. **Zatrzymaj aplikację** (jeśli działa):
   ```bash
   docker-compose down
   ```

2. **Wykonaj migrację bazy danych:**
   ```bash
   cd backend
   python add_description_migration.py
   ```

3. **Zbuduj i uruchom aplikację:**
   ```bash
   cd ..
   docker-compose up --build -d
   ```

### Krok 2: Weryfikacja

1. **Sprawdź logi aplikacji:**
   ```bash
   docker-compose logs -f
   ```

2. **Przetestuj funkcjonalność:**
   - Otwórz aplikację w przeglądarce
   - Przejdź do modułu "Baza kontaktów"
   - Spróbuj dodać nowy kontakt - powinno być pole "Opis"
   - Spróbuj edytować istniejący kontakt - pole "Opis" powinno być puste
   - Sprawdź czy pole jest na całej szerokości i ma 3 linie

### Krok 3: Rollback (w razie problemów)

Jeśli wystąpią problemy, możesz bezpiecznie wycofać zmiany:

1. **Zatrzymaj aplikację:**
   ```bash
   docker-compose down
   ```

2. **Przywróć poprzednią wersję kodu:**
   ```bash
   git checkout HEAD~1
   ```

3. **Uruchom ponownie:**
   ```bash
   docker-compose up --build -d
   ```

## Uwagi techniczne

- **Migracja jest bezpieczna** - można ją uruchomić wielokrotnie
- **Pole description jest opcjonalne** - istniejące kontakty będą miały NULL
- **Maksymalna długość** to 500 znaków
- **Frontend** automatycznie obsługuje puste wartości jako NULL
- **API** zwraca pole description w odpowiedziach

## Testowanie

Po wdrożeniu przetestuj:
1. Dodawanie nowego kontaktu z opisem
2. Dodawanie nowego kontaktu bez opisu
3. Edycję istniejącego kontaktu - dodanie opisu
4. Edycję istniejącego kontaktu - usunięcie opisu
5. Wyświetlanie listy kontaktów (pole nie powinno być widoczne w liście)
