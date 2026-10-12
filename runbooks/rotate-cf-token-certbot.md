# Rotation CF API Token cho certbot DNS-01

> Runbook rotate token Cloudflare đang dùng cho certbot DNS-01 (wildcard cert), lessons rút từ lần rotate token 2230 (10/2026).

## Bối cảnh

- 2230 dùng certbot + plugin `dns-cloudflare`, credentials ở `~/<user>/.secrets/cloudflare.ini` (perm 600), gia hạn qua `certbot.timer` (systemd, 2 lần/ngày)
- Token CF có scope: Zone / DNS / Read + Edit, Zone Resources chỉ zone cần, Client IP Address Filtering tuỳ chọn
- Thiết kế an toàn: **rollback luôn khả dĩ cho đến phút cuối** — token cũ chỉ bị revoke sau khi token mới chứng minh renewal chạy thật

## Quy trình

### 1. Khảo sát

```bash
sudo certbot certificates                 # cert hiện có, hạn còn bao lâu
sudo stat -c "%a %U %n" /home/<user>/.secrets/cloudflare.ini   # expect 600
systemctl is-enabled certbot.timer        # expect enabled
sudo grep credentials /etc/letsencrypt/renewal/<domain>.conf  # path ini thật
```

### 2-3. Tạo token mới + cài (bước 2 là việc trên CF dashboard, người làm)

- Backup file cũ TRƯỚC: `cp ~/.secrets/cloudflare.ini ~/.secrets/cloudflare.ini.bak-$(date +%Y%m%d-%H%M%S)`
- Ghi token mới **qua biến env / pipe**, không echo ra log:

```bash
printf 'dns_cloudflare_api_token = %s\n' "$TOK" | ssh host "cat > ~/.secrets/cloudflare.ini && chmod 600 ~/.secrets/cloudflare.ini"
```

- Verify token qua CF API: list zones phải thấy đúng zone cần

### 4. Dry-run — cổng bắt buộc

```bash
sudo certbot renew --dry-run --cert-name <domain>
```

- Dry-run tạo TXT record **thật** qua API mới nhưng không đụng cert production
- **Fail thì dừng ở đây** — chưa được revoke token cũ

### 5. Revoke token cũ + xoá backup — chỉ khi bước 4 pass

Sau bước 5, đường lùi duy nhất là làm lại từ bước 2.

## ⚠️ Gotchas đã ăn thật

### `dns_cloudflare_email` + token = fail

Plugin `dns-cloudflare` **chấp nhận lỗi** nếu ini có cả email lẫn API token:

```
PluginError: dns_cloudflare_email and dns_cloudflare_api_key
are not needed when using an API Token
```

→ File ini khi dùng API Token chỉ được chứa **đúng 1 dòng**: `dns_cloudflare_api_token = ...`

### Client IP Address Filtering chặn VPS khác (lỗi 9109)

Nếu token dùng chung cho nhiều VPS (VD: 1 token cho Traefik 5890 + certbot 2230), filtering chỉ 1 IP sẽ khiến VPS kia fail:

```
Error determining zone_id: 9109
Cannot use the access token from location: <IP_của_VPS>
```

Lỗi này **không phải token sai hay thiếu quyền zone** — request đúng token, đúng zone, chỉ là từ IP không nằm trong whitelist. Fix: thêm IP của VPS thứ hai vào filtering trên dashboard (CF cho phép nhiều IP).

### Route token giữa 2 VPS không có SSH trust

2 VPS không trust nhau SSH (publickey denied) → route token qua máy trung gian (local Mac): pull token ra biến env cục bộ, pipe thẳng vào file trên VPS đích. Token chỉ nằm trong biến process, không in ra output.

## Checklist nhanh

- [ ] ini mới perm 600, chỉ 1 dòng `dns_cloudflare_api_token`
- [ ] Backup ini cũ trước khi ghi đè
- [ ] `certbot renew --dry-run` PASS trước khi revoke token cũ
- [ ] Xoá backup ini sau khi revoke
- [ ] Không share token giữa các VPS nếu filtering chặn; không in token ra log
