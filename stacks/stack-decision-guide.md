# Chọn stack: Nginx+Certbot vs Dokploy

> Góc nhìn thực tế + kinh doanh khi nhận web cho khách cá nhân. Hai stack chi tiết: [`cloudflare-nginx-docker.md`](cloudflare-nginx-docker.md) và [`cloudflare-dokploy-docker.md`](cloudflare-dokploy-docker.md).

## So sánh nhanh

| Góc | Nginx + Certbot | Dokploy |
|---|---|---|
| Setup ban đầu | ~1-2h, viết conf tay | ~30p, UI click |
| Thêm site mới | Viết server block + symlink + reload | UI → Deploy, labels tự sinh |
| SSL | Certbot CLI, script hoá 1 lần | Tự động hoàn toàn (DNS-01) |
| Nhiều app động | Tự lo từng app | Điểm mạnh — CI/CD, rollback sẵn |
| Debug | Mọi thứ nằm rõ trong conf | Lớp trừu tượng dày, lỗi fail âm thầm |
| RAM | ~100-200MB | ~1GB+ (Docker Swarm + Traefik + Dokploy) |
| Học devops | Nắm gốc: proxy, cert, iptables | PaaS che hết internals |

## Quyết định theo mô hình kinh doanh

Nguyên tắc: **ai giữ hạ tầng, người đó giữ trách nhiệm.**

### Nginx — khi khách giữ hạ tầng

Khách tự có domain/VPS, kì kèo giá, trả 1 lần:

- Scope rõ ràng: giao hàng là xong, không dính bảo hành vô hạn
- Setup tĩnh dễ bàn giao: 1 conf + 1 cert — khách thuê dev khác vào vẫn đọc được
- Phù hợp: landing page, site tĩnh, 1-3 app nhỏ

### Dokploy — khi ta giữ hạ tầng

Nhận nguyên cục (deploy + bảo hành + bảo trì), chạy trên VPS cá nhân:

- Ta control deploy/rollback/logs → bảo trì mới khả thi
- Dashboard + logs UI dễ show tiến độ cho khách
- Phù hợp: ≥5 app động, deploy liên tục

### 3 rule khi giữ hạ tầng cho khách

1. **Tách infra khách khỏi infra cá nhân** khi có ≥2-3 khách full-package — 1 app khét ngốn RAM là cả đám khách chết theo, mất chữ "bảo hành"
2. **Tính phí định kỳ** (tháng/quý), không trọn gói — bản chất mô hình này là bán uptime, chi phí rủi ro liên tục
3. **Bàn giao Nginx vẫn phải có docs** — khách kì kèo thì không sao, nhưng khách quay lại nhờ "sửa conf cũ" thì docs quyết định job đó 15p hay 2h
