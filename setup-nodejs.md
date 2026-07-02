# Setup Node.js
- Setup các công cụ thường dùng khi sử dụng Nodejs

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use default

npm install --global corepack
corepack enable
corepack prepare yarn@1.x --activate
corepack prepare pnpm@latest --activate

YARN_BIN_PATH="$(yarn global bin)"
if ! grep -q "yarn global bin" ~/.zshrc 2>/dev/null; then
    echo "" >> ~/.zshrc
    echo "# Yarn global bin" >> ~/.zshrc
    echo "export PATH=\"\$PATH:$YARN_BIN_PATH\"" >> ~/.zshrc
fi
export PATH="$PATH:$(yarn global bin)"

yarn global add pm2
pm2 completion install 

# Setup Bun
curl -fsSL https://bun.com/install | bash

```