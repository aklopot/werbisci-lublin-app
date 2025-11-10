# Migracja do wersji 0.6.0 - Login Sessions z BIGINT

## Problem
W wersji 0.6.0 zmieniono typ kolumny `id` w tabeli `login_sessions` z `INTEGER` na `BIGINT` aby wspierać miliardy rekordów.

SQLAlchemy **NIE migruje automatycznie** istniejących tabel. Jeśli tabela już istnieje, ma stary typ (INTEGER).

## Rozwiązanie

### LOKALNIE (development)

**Opcja 1: Przez UI (zalecane)**
1. Zaloguj się jako admin
2. Przejdź do: Użytkownicy → Logowania
3. Kliknij "Administracja bazy logowań"
4. Wybierz "Utwórz czysty schemat bazy"
5. Potwierdź

**Opcja 2: Przez terminal**
```powershell
# Windows PowerShell w katalogu backend
.venv_werbisci-lublin-app/Scripts/python.exe -c "from app.modules.login_sessions.api import recreate_login_sessions_schema; from app.core.db import SessionLocal; db = SessionLocal(); recreate_login_sessions_schema(db); db.close(); print('Migrated to BIGINT')"
```

### NA SERWERZE (production)

**Przed uruchomieniem deploy.sh:**

```bash
# SSH do serwera
ssh user@your-server

# Przejdź do katalogu projektu
cd /path/to/werbisci-lublin-app

# OPCJA 1: Przez API (jeśli aplikacja działa)
# Zaloguj się jako admin w przeglądarce i użyj UI (jak powyżej)

# OPCJA 2: Przez skrypt Docker
docker compose run --rm backend python -c "from app.core.db import engine; from sqlalchemy import text; with engine.begin() as conn: conn.execute(text('DROP TABLE IF EXISTS login_sessions'))"

# Teraz uruchom deploy
./deploy.sh
```

**Po deploy.sh:**
Nowa tabela zostanie automatycznie utworzona z BIGINT przez `Base.metadata.create_all()`.

## Weryfikacja

### Sprawdź typ kolumny w SQLite:

**Lokalnie:**
```powershell
sqlite3 backend/data/werbisci-app.db "PRAGMA table_info(login_sessions);"
```

**Na serwerze:**
```bash
docker compose exec backend sqlite3 /data/werbisci-app.db "PRAGMA table_info(login_sessions);"
```

Powinieneś zobaczyć:
```
0|id|INTEGER|0||1          <- To jest OK! SQLite traktuje BIGINT jako INTEGER, ale wspiera pełny zakres
1|user_id|INTEGER|1||0
2|login_time|DATETIME|1||0
...
```

**UWAGA:** SQLite **nie ma natywnego typu BIGINT**. SQLAlchemy mapuje `BigInteger` na `INTEGER`, ale SQLite INTEGER jest **64-bitowy** i wspiera zakres BIGINT! To jest poprawne zachowanie.

## Dodatkowe Informacje

- SQLite INTEGER = 64-bit signed integer (zakres: -9,223,372,036,854,775,808 do 9,223,372,036,854,775,807)
- To ten sam zakres co PostgreSQL BIGINT
- Zmiana z `Integer` na `BigInteger` w SQLAlchemy nie zmieni typu w SQLite, ale zapewnia spójność jeśli kiedyś przejdziesz na PostgreSQL/MySQL

## Częste Pytania

**Q: Czy stracę dane?**
A: Tak, operacja DROP TABLE usuwa wszystkie dane. To dlatego robimy to teraz (na początku), gdy nie ma jeszcze cennych danych.

**Q: Co jeśli już mam dużo danych logowań?**
A: Możesz najpierw wyeksportować dane (TODO: dodać funkcję exportu), usunąć tabelę, odtworzyć i zaimportować z powrotem. Ale dla logowań to zwykle niepotrzebne.

**Q: Czy to trzeba robić przy każdym deploy?**
A: NIE! Tylko raz, przy migracji do wersji 0.6.0. Następne deploy.sh będą działać normalnie.

