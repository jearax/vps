
# Khi có 1 VPS (Virtual Private Server) ta sẽ được cấp 1 IP và 1 password
- Ví dụ:
  - IP: 192.168.1.1
  - Password: 123456

- Login lần lần đầu:
  - ssh root@192.168.1.1 # Nhập password (123456) khi được yêu cầu.

- Tạo user mới quyền cao nhất trong Linux, ta nên tạo 1 account khác và set quyền sudo cho nó.
  - adduser ci # Tạo mới user ci (user cho hệ thống CI)
  - usermod -aG sudo ci # Thêm user ci vào group sudo
  - logout # Logout account root, sau này mọi thao tác ta sẽ login vào user ci

# Setup và bắt buộc sử dụng SSH Key
- SSH Key là cặp `Public Key` và `Private Key` được sử dụng trong giao thức SSH (Secure Shell) để xác thực khi kết nối tới server, thay thế xác thực bằng mật khẩu (rườm rà, khó nhớ và không an toàn).
- **Khuyến nghị bảo mật trên Ubuntu:** Cấu hình "không cho phép đăng nhập trực tiếp bằng root (`PermitRootLogin no`)" và "bắt buộc dùng SSH Key (`PasswordAuthentication no`)" rất được khuyến khích.
  - 👉 **Lưu ý:** Để không bị mất quyền truy cập khi áp dụng cấu hình trên (xem chi tiết tại phần [Config khuyến nghị bảo mật](#config-khuyến-nghị-bảo-mật) bên dưới), ta **bắt buộc phải setup SSH key** cho user `root` và `ci` trước tiên.

## Setup SSH key cho root
```bash
# Tạo SSH key cho root user
ssh-keygen ssh-keygen -t ed25519 -C "root@gmail.com" -f ~/.ssh/vps-root # Tạo và chỉ định folder lưu file private key ở máy local

# Tạo tương tự cho ci user
ssh-keygen ssh-keygen -t ed25519 -C "ci@gmail.com" -f ~/.ssh/vps-ci 

# Cấu hình SSH Key trong file ~/.ssh/config
Host vps-root # Tên tuỳ ý, giúp ta dễ nhớ khi sử dụng
HostName 192.168.1.1 # IP của VPS
User root # user root của VPS
IdentityFile ~/.ssh/vps-root
IdentitiesOnly yes

# Cấu hình tương tự cho ci user
Host vps-ci
HostName 192.168.1.1
User ci
IdentityFile ~/.ssh/vps-ci
IdentitiesOnly yes

# Ở máy local, copy public key sang VPS
ssh-copy-id -f -i ~/.ssh/vps-root vps-root # Copy public key cho root user, nhập pass của root khi được yêu cầu
ssh-copy-id -f -i ~/.ssh/vps-ci vps-ci # Copy tương tự cho ci user

# Sau thao tác này, ta có thể login VPS không cần password
ssh vps-root # Login vào root user
ssh vps-ci # Login vào ci user
```

## Config khuyến nghị bảo mật
```bash
ssh vps-root

# Dùng sed để cấu hình PermitRootLogin và PasswordAuthentication
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config

# Reset lại service ssh để áp dụng cấu hình
sudo systemctl reload ssh.service
```

# Setup ZSH & plugins cơ bản cho user ci
```bash
# Cài đặt zsh
sudo apt update && sudo apt install -y zsh

# Cài đặt Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Thêm plugin zsh-autosuggestions và zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM}/plugins/zsh-syntax-highlighting
sed -i 's/plugins=(git)/plugins=(git zsh-autosuggestions zsh-syntax-highlighting)/g' ~/.zshrc
source ~/.zshrc
```

# Setup bảo mật cơ bản: ufw, fail2ban, unattended-upgrades
```bash
# Cài đặt UFW
sudo apt update && sudo apt install -y ufw

# Cấu hình UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose

# Cài đặt Fail2ban
sudo apt update && sudo apt install -y fail2ban

# Kích hoạt Fail2ban
sudo systemctl enable fail2ban
sudo systemctl status fail2ban

## Setup Unattended security upgrades
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades   # chọn Yes
```

# Setup Swap (size theo RAM)

> [!TIP]
> **Bảng dung lượng Swap khuyến nghị theo RAM:**
> 
> | RAM VPS | Swap khuyến nghị |
> |---------|------------------|
> | 1 GB    | 1 GB - 2 GB      |
> | 2 GB    | 1 GB - 2 GB      |
> | 4 GB    | 2 GB - 4 GB      |
> | 8 GB    | 4 GB             |
> | 16 GB   | 4 GB - 8 GB      |
> | 32 GB   | 8 GB             |

```bash
# Tạo swap file 2GB (ví dụ cho VPS 2/2/30)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.d/99-swap.conf
```

# Setup Timezone + NTP
```bash
# Ví dụ VPS có datacenter ở Việt Nam
sudo timedatectl set-timezone Asia/Ho_Chi_Minh
sudo timedatectl set-ntp true
sudo timedatectl status
```
