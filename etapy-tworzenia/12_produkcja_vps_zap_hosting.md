## 12. Produkcja na VPS (ZAP-Hosting) — Docker Compose

Zakres: przygotowanie plików i komend do wdrożenia na VPS bez Kubernetes, tylko Docker Compose.

Kroki:
1) Upewnij się, że repo zawiera `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.env`, `.env.frontend`.

2) Na serwerze (Ubuntu 22.04 zalecane):
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

3) Skopiuj repozytorium na VPS (git clone lub rsync). Ustaw `.env` i `.env.frontend` z wartościami produkcyjnymi (silny `JWT_SECRET`, domeny/CORS).

4) Uruchom:
```bash
docker compose up -d --build
```

5) Konfiguracja sieci/publicznego dostępu: wystaw porty (np. przez firewall/port forwarding w panelu ZAP). Opcjonalnie reverse proxy i certyfikaty (poza zakresem tego etapu).

6) Kopie zapasowe: zrób backup wolumenu z `/data/app.db` (np. `docker run --rm -v <vol>:/data -v $PWD:/backup alpine tar czf /backup/sqlite_backup.tgz /data`).

Koniec etapu: Aplikacja działa na VPS z trwałą bazą SQLite.


