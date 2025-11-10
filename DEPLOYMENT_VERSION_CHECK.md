# Zabezpieczenie Wersji w Deploy

## Co to jest?

Od wersji 0.6.0 skrypt `deploy.sh` ma wbudowane zabezpieczenie, które **uniemożliwia wdrożenie tej samej wersji** która już działa na serwerze.

## Dlaczego?

Zapobiega to:
- ❌ Przypadkowemu uruchomieniu deploy bez zmian
- ❌ Wdrożeniu tego samego kodu ponownie
- ❌ Problemom z śledzeniem wersji
- ✅ Wymusza zmianę wersji przed każdym wdrożeniem

## Jak to działa?

### 1. Sprawdzanie wersji

Skrypt `deploy.sh`:
1. Pobiera kod z git (`git pull`)
2. Czyta wersję z pliku `VERSION`
3. Sprawdza wersję działającego kontenera (z Docker labels)
4. Porównuje wersje

### 2. Jeśli wersje są takie same

Zobaczysz błąd i deploy się zatrzyma:

```bash
$ ./deploy.sh

======================================
Deploying Werbisci Lublin App
Version: 0.6.0
======================================

❌ ERROR: Version conflict detected!

Current running version: 0.6.0
Version in VERSION file: 0.6.0

You are trying to deploy the SAME version that is currently running.

Please update the VERSION file before deploying:
  1. Edit VERSION file and increment the version number
  2. Example: 0.6.0 → 0.6.1 (patch) or 0.7.0 (minor) or 1.0.0 (major)
  3. Commit the change: git add VERSION && git commit -m 'Bump version to X.Y.Z'
  4. Push: git push
  5. Run deploy.sh again

======================================
```

### 3. Jeśli wersje są różne

Deploy kontynuuje normalnie:

```bash
$ ./deploy.sh

======================================
Deploying Werbisci Lublin App
Version: 0.6.1
======================================

✓ Version check passed
  Current version: 0.6.0
  New version:     0.6.1

Stopping and removing current containers...
Building versioned images...
...
```

## Jak zmienić wersję?

### Wersjonowanie semantyczne (SemVer)

Format: `MAJOR.MINOR.PATCH`

**MAJOR** (1.0.0 → 2.0.0)
- Zmiany łamiące kompatybilność
- Duże przeprojektowanie
- Zmiana API która psuje starych klientów

**MINOR** (0.6.0 → 0.7.0)
- Nowe funkcjonalności
- Kompatybilne wstecz
- Dodanie nowego modułu

**PATCH** (0.6.0 → 0.6.1)
- Poprawki błędów
- Drobne zmiany
- Bezpieczeństwo

### Przykłady zmian

```bash
# Drobna poprawka
0.6.0 → 0.6.1

# Nowa funkcjonalność
0.6.0 → 0.7.0

# Wielka zmiana
0.6.0 → 1.0.0
```

### Proces zmiany wersji

#### Lokalnie:

```bash
# 1. Edytuj plik VERSION
echo "0.6.1" > VERSION

# 2. Commit
git add VERSION
git commit -m "Bump version to 0.6.1"

# 3. Push
git push
```

#### Na serwerze:

```bash
# Deploy pobierze nową wersję z git automatycznie
./deploy.sh
```

## Przykładowy workflow

### Scenariusz 1: Poprawka błędu

```bash
# Lokalnie
echo "0.6.1" > VERSION
git add VERSION
git commit -m "Bump version to 0.6.1 - fix login bug"
git push

# Na serwerze
./deploy.sh
# ✓ Version check passed (0.6.0 → 0.6.1)
```

### Scenariusz 2: Nowy moduł

```bash
# Lokalnie
echo "0.7.0" > VERSION
git add VERSION
git commit -m "Bump version to 0.7.0 - add reports module"
git push

# Na serwerze
./deploy.sh
# ✓ Version check passed (0.6.0 → 0.7.0)
```

### Scenariusz 3: Zapomniałeś zmienić wersji

```bash
# Na serwerze (bez zmiany VERSION)
./deploy.sh

# ❌ ERROR: Version conflict detected!
# Current running version: 0.6.0
# Version in VERSION file: 0.6.0

# Fix:
# 1. Lokalnie: zmień VERSION
# 2. Commit i push
# 3. Spróbuj ponownie
```

## Omijanie zabezpieczenia (NIE ZALECANE)

Jeśli **naprawdę** musisz wdrożyć tę samą wersję:

### Opcja 1: Zmień wersję (zalecane)
```bash
echo "0.6.1" > VERSION
git commit -am "Bump version"
git push
./deploy.sh
```

### Opcja 2: Ręczny deploy (niezalecane)
```bash
# Zatrzymaj zabezpieczenie poprzez bezpośrednie użycie docker compose
docker compose down
git pull
export APP_VERSION=$(cat VERSION)
./build.sh
docker compose up -d --force-recreate
```

⚠️ **Uwaga**: Opcja 2 nie jest zalecana bo:
- Pomija kontrolę wersji
- Może prowadzić do problemów ze śledzeniem zmian
- Trudniej debugować co jest wdrożone

## Debugowanie

### Sprawdź aktualną wersję na serwerze

```bash
# Wersja z kontenera
docker inspect $(docker compose ps -q backend) --format='{{index .Config.Labels "version"}}'

# Wersja z pliku
cat VERSION

# Wersja przez API
curl http://localhost:8000/api/version
```

### Sprawdź wszystkie wersje obrazów

```bash
docker images | grep werbisci-lublin
```

### Wymuś rebuild bez cache

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

## FAQ

**Q: Co jeśli uruchamiam deploy po raz pierwszy?**
A: Zabezpieczenie się nie włączy (brak działającego kontenera). Deploy działa normalnie.

**Q: Co jeśli ręcznie zatrzymałem kontenery?**
A: Zabezpieczenie się nie włączy (brak działającego kontenera). Deploy działa normalnie.

**Q: Czy mogę użyć tej samej wersji na development i production?**
A: Tak, ale upewnij się że używasz różnych tagów/środowisk. Zabezpieczenie działa per-środowisko.

**Q: Co z hotfixami?**
A: Nawet dla hotfixa zmień wersję (np. 0.6.0 → 0.6.1). To pomaga w śledzeniu zmian.

## Wyłączenie zabezpieczenia (dla zaawansowanych)

Jeśli chcesz wyłączyć to zabezpieczenie (NIE ZALECANE):

Edytuj `deploy.sh` i zakomentuj sekcję sprawdzania wersji:

```bash
# # Version check
# if [ ! -z "$RUNNING_VERSION" ] && [ "$RUNNING_VERSION" = "$VERSION" ]; then
#     echo "❌ ERROR: Version conflict detected!"
#     ...
#     exit 1
# fi
```

Ale **naprawdę tego nie rób** - to zabezpieczenie jest po to żeby Ci pomóc!

