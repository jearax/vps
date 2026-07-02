# Cloudflare (DNS01) -> Nginx, Certbot -> Docker

Mô hình này là một trong những kiến trúc triển khai web server hiện đại, bảo mật và tự động hoá tốt nhất hiện nay. Dưới đây là giải thích chi tiết về vai trò và sự kết hợp của từng thành phần trong "combo" này:

### 1. Cloudflare (Xác thực DNS-01)

- **Vai trò:** Quản lý tên miền (DNS) và cung cấp phương thức xác thực quyền sở hữu tên miền để Let's Encrypt cấp SSL.
- **Sức mạnh của DNS-01:** Khác với cách truyền thống (HTTP-01) yêu cầu server phải mở port 80 ra internet để Let's Encrypt gọi vào kiểm tra, phương thức **DNS-01** xác thực bằng cách tạo một bản ghi TXT ngầm trên DNS.
  - **Hỗ trợ Wildcard SSL:** Cho phép xin chứng chỉ `*.domain.com` dùng chung cho tất cả subdomain.
  - **Bảo mật tuyệt đối:** Server của bạn thậm chí có thể nằm hoàn toàn trong mạng nội bộ (mạng LAN) không public IP, miễn là VPS có internet gọi ra ngoài tới API của Cloudflare là đã có thể lấy được SSL xịn.

### 2. Certbot (với Cloudflare Plugin)

- **Vai trò:** Công cụ tự động hoá việc xin và gia hạn chứng chỉ SSL từ Let's Encrypt.
- **Hoạt động:** Thay vì bạn phải tự lên Cloudflare tạo bản ghi TXT thủ công mỗi lần cấp SSL, Certbot sử dụng API Token của Cloudflare để tự động làm việc này. Nó tạo bản ghi TXT ➔ đợi Let's Encrypt xác nhận ➔ nhận file SSL ➔ tự động xoá bản ghi TXT đi. Cứ 60 ngày nó sẽ lặp lại quá trình này (gia hạn) mà bạn không cần phải đụng tay vào.

### 3. Nginx (Reverse Proxy / SSL Termination)

- **Vai trò:** Nginx đứng ở "cửa ngõ" của VPS, lắng nghe các kết nối HTTPS từ bên ngoài.
- **Hoạt động:** Nó nạp các file chứng chỉ SSL (do Certbot cấp) để mã hoá/giải mã luồng dữ liệu (quá trình này gọi là SSL Termination). Sau đó, dựa vào tên miền mà người dùng truy cập (ví dụ `api.domain.com`), Nginx sẽ làm nhiệm vụ "chuyển hướng" (Reverse Proxy) request đó tới đúng ứng dụng đang chạy bên trong.

### 4. Docker (Containerization)

- **Vai trò:** Đóng gói và chạy các ứng dụng (Backend, Frontend, Database, v.v...) trong các container độc lập. Thường bản thân Nginx và Certbot cũng được đóng gói chạy bằng Docker luôn (`docker-compose`).
- **Lợi ích:** Các ứng dụng bên trong Docker chạy rất "ngây thơ", chúng không cần biết SSL là gì, tên miền là gì, chỉ cần lắng nghe ở một cổng nội bộ (VD: 3000, 8080). Nginx sẽ hứng toàn bộ "đạn" từ bên ngoài, làm sạch, giải mã rồi mới truyền dữ liệu an toàn vào cho các Docker container xử lý.

---

**💡 Tóm tắt luồng hoạt động thực tế:**
Người dùng truy cập `https://app.domain.com` ➔ Nginx (đã có SSL tự động nhờ Certbot + Cloudflare DNS01) đứng ra đón khách ➔ Nginx thấy request hỏi `app.domain.com` liền mở cửa phụ chuyển dữ liệu vào Container Docker đang chạy App đó ➔ App xử lý xong trả lại qua Nginx ➔ Nginx trả về cho người dùng một cách an toàn.

---

# Setup Cloudflare + Nginx + Docker + Port 80
- Tài nguyên cần có:
  - 1 VPS có Port 80 và 443 mở
  - 1 domain 
  - Account Cloudflare

## 1. Setup Cloudflare, tạo API Token
- Login vào account Cloudflare
- Vào Domains -> Overview -> Add domain -> Connect  a domain
- Domain name: `<your_domain.com>`
- Select Plan: Free -> Continue to activation
- Copy 2 nameservers của Cloudflare và set vào domain registrar. Chờ 1-2 phút để update.

- Vào Profile -> API Tokens -> Create token -> Custom token -> Get started
  - Token name: `<your_token_name>`
  - Permissions:
    - Zone / DNS / Read
    - Zone / DNS / Edit
  - Zone Resources:
    - Include / Specific zone / `<your_domain.com>`
  - Client IP Address Filtering (Tuỳ chọn):
    - Is in / `<VPS_IP>`
- **Copy Cloudflare API token** lưu lại để sau này nhập vào setup DNS-01.

- Vào CF Home -> Domains -> Overview -> `<your_domain.com>`
  + DNS -> Records -> Add record (Để trỏ domain gốc về VPS):
    - Type: **A**
    - Name: `@`
    - IPv4 address: `<VPS_IP>`
    - Proxy status: **DNS only** (Khuyến nghị tắt đám mây màu cam khi cài đặt chứng chỉ lần đầu)
  + Tiếp tục Add record (Để trỏ toàn bộ subdomain về VPS):
    - Type: **A**
    - Name: `*`
    - IPv4 address: `<VPS_IP>`
    - Proxy status: **DNS only**
  + SSL/TLS -> Overview -> Configure SSL/TLS encryption
    - Encryption mode: **Full (strict)** hoặc **Automatic SSL/TLS**

## 2. Cài đặt Docker & Docker Compose
```bash
# Install Docker:
curl -fsSL https://get.docker.com | sudo sh

# Install Docker Compose:
sudo apt update && sudo apt install -y docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER
```

## 3. Setup Nginx + Certbot + Cloudflare DNS-01
```bash
# Cài đặt các package cần thiết
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx python3-certbot-dns-cloudflare

# Cấu hình Cloudflare API Token
mkdir -p ~/.secrets
echo "dns_cloudflare_api_token=<your_cloudflare_api_token>" > ~/.secrets/cloudflare.ini
chmod 600 ~/.secrets/cloudflare.ini

# Xin cấp chứng chỉ SSL qua phương thức DNS-01
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-propagation-seconds 120 \
  --dns-cloudflare-credentials ~/.secrets/cloudflare.ini \
  -d "<your_domain.com>" \
  -d "*.<your_domain.com>" \
  --email "<your_email@gmail.com>" \
  --agree-tos \
  --non-interactive

# Test thử gia hạn chứng chỉ
sudo certbot renew --dry-run

# Cấu hình Nginx Reverse Proxy
sudo tee /etc/nginx/sites-available/<your_domain.com>.conf >/dev/null <<'EOF'
# Map for WebSocket support
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name <your_domain.com>;

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name <your_domain.com>;

    ssl_certificate     /etc/letsencrypt/live/<your_domain.com>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<your_domain.com>/privkey.pem;

    # Common proxy headers
    proxy_set_header Host              $http_host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        $connection_upgrade;
    proxy_ssl_server_name on;
    proxy_buffering off;
    proxy_read_timeout 3600s;

    location / {
        proxy_pass http://localhost:8080;
    }
}
EOF

# Kích hoạt cấu hình và khởi động lại Nginx
sudo ln -sf /etc/nginx/sites-available/<your_domain.com>.conf /etc/nginx/sites-enabled/

# Đây là config optional: unlink config default, unlink config bất kỳ (disable 1 site nào đó của khách hàng tạm)
sudo unlink /etc/nginx/sites-enabled/default
sudo unlink /etc/nginx/sites-enabled/<your_domain.com>.conf

# Test Nginx config và restart
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx

# Setup test app docker
docker run -d --name nginx -p 8080:80 nginx
```
