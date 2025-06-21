# セルフホストランナーセットアップガイド

このドキュメントでは、effective-yomimonoプロジェクト用のGitHub Actionsセルフホストランナーのセットアップ手順について説明します。

## 前提条件

### システム要件
- **OS**: Ubuntu 20.04+ / macOS 11+ / Windows Server 2019+
- **メモリ**: 8GB以上推奨
- **ストレージ**: 50GB以上の空き容量
- **ネットワーク**: 安定したインターネット接続

### 必要なアクセス権限
- GitHubリポジトリへの管理者権限
- サーバーへのsudo権限
- ファイアウォール設定権限

## 1. GitHub Actionsランナーの登録

### 1.1 GitHubでのランナー登録
1. GitHubリポジトリのSettings → Actions → Runners にアクセス
2. "New self-hosted runner" をクリック
3. OSを選択してインストールコマンドを取得

### 1.2 ランナーのダウンロードと設定

```bash
# ランナーをダウンロード（Linuxの場合）
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# ランナーを設定
./config.sh --url https://github.com/[ユーザー名]/effective-yomimono --token [TOKEN]

# サービスとして登録
sudo ./svc.sh install
sudo ./svc.sh start
```

## 2. Node.js環境のセットアップ

### 2.1 Node.jsのインストール
```bash
# nvmを使用してNode.jsをインストール
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 最新のLTSバージョンをインストール
nvm install --lts
nvm use --lts
nvm alias default node

# バージョン確認
node --version  # v20.x.x以上推奨
npm --version   # v10.x.x以上推奨
```

### 2.2 グローバルパッケージのインストール
```bash
# 必要なグローバルパッケージをインストール
npm install -g typescript@latest
npm install -g tsx@latest
npm install -g @playwright/test@latest

# pnpmもインストール（オプション）
npm install -g pnpm@latest
```

## 3. ブラウザ環境のセットアップ

### 3.1 Chrome/Chromiumのインストール

#### Ubuntu/Debianの場合
```bash
# Google Chromeをインストール
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install google-chrome-stable -y

# 必要な依存関係をインストール
sudo apt install -y libnss3-dev libatk-bridge2.0-dev libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1
```

#### macOSの場合
```bash
# Homebrewを使用してChromeをインストール
brew install --cask google-chrome

# または直接ダウンロード
# https://www.google.com/chrome/ からダウンロードしてインストール
```

### 3.2 Playwrightのセットアップ
```bash
# Playwrightブラウザをインストール
npx playwright install --with-deps

# システム依存関係も含めてインストール
npx playwright install-deps
```

## 4. セキュリティ設定

### 4.1 ファイアウォール設定
```bash
# UFWの設定（Ubuntu）
sudo ufw enable
sudo ufw allow 22  # SSH
sudo ufw allow 8787  # API開発サーバー
sudo ufw allow 3000  # フロントエンド開発サーバー
```

### 4.2 ユーザー権限の設定
```bash
# actionsユーザーの作成（推奨）
sudo useradd -m -s /bin/bash actions
sudo usermod -aG docker actions  # Dockerグループに追加（必要に応じて）

# sudoersファイルの設定（最小権限）
echo "actions ALL=(ALL) NOPASSWD: /usr/bin/find, /bin/rm, /usr/bin/apt" | sudo tee /etc/sudoers.d/actions-runner
```

### 4.3 環境変数の設定
```bash
# 環境変数の設定（~/.bashrcまたは~/.profile）
export NODE_ENV=test
export CI=true
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers
```

---

このセットアップが完了すると、セルフホストランナーでの高速CI実行が可能になります。
不明な点があれば、プロジェクトの管理者にお問い合わせください。
EOF < /dev/null