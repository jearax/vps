# cnd-node-app — GitHub Actions → GHCR → VPS (Docker Compose)

Demo Node.js (Bun + TypeScript) minh hoạ pattern **gcnd-ci**: CI build image → push GHCR → **SSH vào VPS** → `git pull` + `scp .env` → `docker compose up` trực tiếp trên VPS. Mỗi nhánh = một environment.

## Deploy flow

```
bun run deploy:<env>           # tạo empty commit "ci: deploy to <env> - <time>" + push nhánh <env>
  └─> GitHub Actions (gate: commit msg chứa "deploy to <env> - ")
        ├─> envsubst .env.template > .env (từ Secrets)
        ├─> build image + push GHCR tag <env> + sha-<sha>
        ├─> SSH VPS: git clone/pull nhánh <env>
        ├─> scp .env lên VPS
        └─> SSH VPS: docker compose pull + up -d
```

- **Branch-as-environment**: `develop` → env develop, `production` → env production. Mỗi nhánh map 1:1 với GitHub Environment + image tag.
- **Commit-message gate**: workflow chỉ chạy khi commit message chứa `deploy to <branch> - ` (trigger qua `scripts/deploy.sh`).

## Trigger deploy

```bash
bun run deploy:develop     # push nhánh develop
bun run deploy:production  # push nhánh production
```

Script (`scripts/deploy.sh`) kiểm tra working tree sạch, tạo empty commit với message `ci: deploy to <env> - <HH:MM:SS DD/MM/YYYY>`, push lên nhánh tương ứng rồi quay về nhánh hiện tại.

> Đã xoá `deploy:local` (dead logic: `deploy.sh` chỉ chấp nhận `develop`/`production`).

## GitHub Secrets (cần set cho mỗi Environment)

| Secret | Mô tả |
|--------|-------|
| `APP_NAME`, `LOG_LEVEL`, `APP_PORT` | env app, inject vào `.env` qua envsubst |
| `VPS_HOST`, `VPS_PORT`, `VPS_USERNAME` | SSH tới VPS |
| `VPS_SSH_KEY` | private key SSH |
| `CONTAINER_PORT` | host port map tới container 3000 |

(`GITHUB_TOKEN` tự cấp cho GHCR login.)

## Env vars

| Var | Mặc định | Mô tả |
|-----|----------|-------|
| `APP_NAME` | `cdd-node-app` | Tên app (dir là `cnd-node-app` nhưng app self-identify là `cdd-node-app` — pre-existing) |
| `LOG_LEVEL` | `info` | Log level |
| `APP_PORT` | `3000` | Port listen |

## Dev local

```bash
bun install
bun run dev
bun run build && bun run start
curl http://localhost:3000/health/ready
```

## ⚠️ Known issue: bug `compose down` ở bước cuối workflow

Bước cuối `.github/workflows/deploy.yml` chạy:

```bash
docker compose ... pull
docker compose ... up -d --remove-orphans
docker compose ... down --remove-orphans   # ❌ huỷ container vừa start
```

Dòng `down` ngay sau `up` sẽ **stop + xoá container vừa khởi động** → deploy thực tế không sống. **Cần xoá dòng `down`** (hoặc thay bằng cleanup image cũ). Chưa fix trong example này — flag lại để người dùng biết khi fork/reuse.
