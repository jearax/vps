# cdd-node-app — Cloudflare + Dokploy + Docker

Demo Node.js (Bun + TypeScript) minh hoạ pattern deploy **C**loudflare + **D**okploy + **D**ocker:

- **Cloudflare**: DNS + Wildcard SSL (DNS-01) + proxy giấu IP VPS.
- **Dokploy**: PaaS (Traefik bên dưới) nhận webhook, pull image mới, restart container, lo SSL/routing.
- **Docker**: container hoá app, image đẩy lên GHCR.

> Yêu cầu infra CF + Dokploy + Docker đã setup sẵn — xem [`stacks/cloudflare-dokploy-docker.md`](../../stacks/cloudflare-dokploy-docker.md).

## Deploy flow

```
push main
  └─> GitHub Actions build image (target runner)
        └─> push GHCR: ghcr.io/<owner>/cdd-node-app:{main, sha-<sha>}
              └─> POST webhook Dokploy (DOKPLOY_WEBHOOK_URL)
                    └─> Dokploy pull :main + restart container
```

- Trigger: `push` nhánh `main` (không cần commit message đặc biệt).
- Secret duy nhất cần set: `DOKPLOY_WEBHOOK_URL` (`GITHUB_TOKEN` tự cấp).
- Webhook rỗng → CI vẫn pass, chỉ skip bước redeploy.

## Prerequisites

1. CF + Dokploy + Docker đã setup theo [stack doc](../../stacks/cloudflare-dokploy-docker.md) (DNS, Wildcard SSL DNS-01, Traefik).
2. Tạo **Dokploy Application**:
   - Source: **Image** → `ghcr.io/<owner>/cdd-node-app`, tag `main`.
   - Port: `3000`.
   - Domain: `app.<your_domain.com>` (Dokploy lo SSL qua wildcard đã xin).
   - Env: `APP_NAME`, `LOG_LEVEL`, `APP_PORT` (xem `.env.template`).
   - Copy **Webhook URL** từ tab application → set làm GitHub Secret `DOKPLOY_WEBHOOK_URL`.
3. **GHCR package visibility**: public, **hoặc** cấp Dokploy pull token nếu private.

## 2 chế độ deploy

### Mode 1 — Image + webhook (mặc định, theo `.github/workflows/deploy.yml`)
CI build + push image, rồi gọi webhook Dokploy. Dokploy pull `:main` và restart. Đơn giản nhất.

### Mode 2 — Compose (tuỳ chọn)
Paste nội dung [`docker/docker-compose.yml`](docker/docker-compose.yml) vào **Dokploy → Projects → Create Service → Compose**, set các biến:
- `DOMAIN` — domain trỏ tới app (VD `app.your_domain.com`).
- `GH_OWNER` — GitHub owner/org.
- `REPO_NAME` — tên repo (`cdd-node-app`).
- `IMAGE_TAG` — tag image (mặc định `main`).

Labels Traefik + network `dokploy-network` đã có sẵn trong compose.

## Dev local

```bash
bun install
bun run dev          # bun --watch src/index.ts
# hoặc build rồi chạy:
bun run build && bun run start
```

Test endpoint:
```bash
curl http://localhost:3000/            # { app, logLevel, uptime }
curl http://localhost:3000/health/ready # { status: "ok", app }
```

> Lưu ý: `docker/docker-compose.yml` dùng `networks: dokploy-network (external: true)` — network này chỉ tồn tại trên VPS Dokploy. Để `docker compose up` local, tạo override `docker-compose.override.yml` bỏ network external, hoặc chạy qua `bun`/`docker build` trực tiếp.

## Env vars

| Var | Mặc định | Mô tả |
|-----|----------|-------|
| `APP_NAME` | `cdd-node-app` | Tên app (hiện trong response/log) |
| `LOG_LEVEL` | `info` | Log level |
| `APP_PORT` | `3000` | Port listen |

Set qua UI Dokploy (env của application) hoặc `.env` local.
