# Setup Firewall UFW
- UFW là firewall được cài đặt sẵn trên Ubuntu, ta cần setup và bật nó lên.

```bash
sudo apt update && sudo apt install -y ufw

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

sudo ufw enable
sudo ufw status verbose
```
