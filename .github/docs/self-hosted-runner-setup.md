# セルフホストランナー セットアップガイド

このドキュメントでは、effective-yomimonoプロジェクト用のGitHub Actions セルフホストランナーの環境構築手順を説明します。

## 概要

セルフホストランナーを使用することで以下の利点が得られます：

- **高速なCI実行**: 依存関係の事前インストールにより、セットアップ時間を大幅短縮
- **安定した環境**: 毎回同じ環境でテスト実行が可能
- **コスト効率**: GitHub Actionsの分単位課金を回避
- **カスタマイズ性**: プロジェクト固有の要件に合わせた環境構築

## システム要件

### 推奨スペック
- **OS**: Ubuntu 22.04 LTS または macOS 12+
- **CPU**: 4コア以上
- **メモリ**: 8GB以上
- **ストレージ**: 50GB以上の空き容量
- **ネットワーク**: 安定したインターネット接続

### 必要な権限
- sudo権限（Linux）または管理者権限（macOS）
- GitHub リポジトリへのActions権限

## 基本セットアップ

### 1. GitHub Self-hosted Runner登録

1. GitHubリポジトリの `Settings` > `Actions` > `Runners` へアクセス
2. `New self-hosted runner` をクリック
3. OS・アーキテクチャを選択し、表示されるコマンドを実行

```bash
# 例：Linux x64の場合
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
./config.sh --url https://github.com/[USER]/yomimono --token [TOKEN]
```

### 2. サービス化（Linux）

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

### 3. サービス化（macOS）

```bash
./svc.sh install
./svc.sh start
./svc.sh status
```

## 開発環境セットアップ

### 1. Node.js環境

```bash
# Node.js 20.x LTSをインストール
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# または nvm を使用する場合
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# npm の最新化
npm install -g npm@latest
```

### 2. パッケージマネージャ設定

```bash
# pnpm（推奨）
npm install -g pnpm

# yarn（オプション）
npm install -g yarn
```

### 3. 依存関係の事前インストール

```bash
# 作業ディレクトリ作成
mkdir -p ~/runner-workspace
cd ~/runner-workspace

# リポジトリクローン（初回のみ）
git clone https://github.com/[USER]/yomimono.git
cd yomimono

# 各プロジェクトの依存関係インストール
cd api && npm install && cd ..
cd frontend && npm install && cd ..
cd extension && npm install && cd ..
cd mcp && npm install && cd ..
```

## ブラウザ・テスト環境

### 1. Playwright環境

```bash
# Playwright CLI グローバルインストール
npm install -g @playwright/test

# ブラウザインストール
npx playwright install
npx playwright install-deps

# システム依存関係（Linux）
sudo apt-get update
sudo apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libgbm1 \
  libasound2
```

### 2. Chrome/Chromium

```bash
# Google Chrome（Linux）
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Chromium（代替案）
sudo apt-get install -y chromium-browser
```

### 3. 仮想ディスプレイ（ヘッドレス環境）

```bash
# Xvfb インストール
sudo apt-get install -y xvfb

# 環境変数設定
echo 'export DISPLAY=:99' >> ~/.bashrc
echo 'export CHROME_BIN=/usr/bin/google-chrome-stable' >> ~/.bashrc
source ~/.bashrc
```

## 開発ツール

### 1. Git設定

```bash
# Git LFS（大容量ファイル用）
curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
sudo apt-get install git-lfs
git lfs install

# Git設定（必要に応じて）
git config --global user.name "GitHub Actions Runner"
git config --global user.email "actions@noreply.github.com"
```

### 2. その他のツール

```bash
# curl, jq（API テスト用）
sudo apt-get install -y curl jq

# Docker（必要に応じて）
sudo apt-get install -y docker.io
sudo usermod -aG docker $USER

# 日本語フォント（PDF生成等で必要な場合）
sudo apt-get install -y fonts-noto-cjk
```

## 環境変数・設定

### 1. 環境変数ファイル

```bash
# ランナー用環境変数
sudo mkdir -p /etc/actions-runner
sudo tee /etc/actions-runner/env > /dev/null <<EOF
NODE_ENV=test
CI=true
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
CHROME_BIN=/usr/bin/google-chrome-stable
DISPLAY=:99
EOF
```

### 2. ランナー設定

```bash
# ランナー設定ディレクトリ
cd ~/actions-runner

# 環境変数読み込み設定
echo 'source /etc/actions-runner/env' >> .env
```

## パフォーマンス最適化

### 1. npm/pnpm キャッシュ設定

```bash
# npm キャッシュディレクトリ
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
npm config set cache '~/.npm-cache' --global

# pnpm ストア設定
mkdir -p ~/.pnpm-store
pnpm config set store-dir ~/.pnpm-store
```

### 2. ファイルシステム最適化

```bash
# 一時ディレクトリ設定
export TMPDIR=/tmp/runner-tmp
mkdir -p $TMPDIR

# ワークスペース用SSD（可能であれば）
sudo mkdir -p /mnt/runner-workspace
sudo chown $USER:$USER /mnt/runner-workspace
```

### 3. 並列実行設定

```bash
# CPU コア数に基づく並列実行数
echo "export CI_PARALLEL_JOBS=$(nproc)" >> ~/.bashrc
```

## セキュリティ設定

### 1. ファイアウォール

```bash
# UFWの設定（Linux）
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow out 443
sudo ufw allow out 80
```

### 2. 権限設定

```bash
# ランナー用ユーザー（推奨）
sudo useradd -m -s /bin/bash runner
sudo usermod -aG sudo runner
sudo usermod -aG docker runner

# セットアップファイル実行権限
chmod +x ~/actions-runner/*.sh
```

## 定期メンテナンス

### 1. 自動更新スクリプト

```bash
# 依存関係更新スクリプト
cat > ~/runner-update.sh << 'EOF'
#!/bin/bash
set -e

echo "Updating runner dependencies..."

# Node.js パッケージ更新
cd ~/runner-workspace/yomimono
git pull origin main

# 各プロジェクトの依存関係更新
for dir in api frontend extension mcp; do
  if [ -d "$dir" ]; then
    echo "Updating $dir..."
    cd "$dir"
    npm ci
    cd ..
  fi
done

# Playwright ブラウザ更新
npx playwright install

echo "Update complete!"
EOF

chmod +x ~/runner-update.sh
```

### 2. 定期実行設定

```bash
# cronに追加（週次更新）
crontab -e
# 追加: 0 2 * * 0 ~/runner-update.sh >> ~/runner-update.log 2>&1
```

## トラブルシューティング

### よくある問題と解決策

1. **ランナーが接続できない**
   ```bash
   # トークンの再生成が必要な場合
   ./config.sh remove
   ./config.sh --url https://github.com/[USER]/yomimono --token [NEW_TOKEN]
   ```

2. **メモリ不足エラー**
   ```bash
   # Node.js メモリ制限の調整
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

3. **ブラウザテストの失敗**
   ```bash
   # 仮想ディスプレイの再起動
   sudo pkill Xvfb
   Xvfb :99 -screen 0 1280x1024x24 &
   ```

## 動作確認

セットアップ完了後、以下のコマンドで環境を確認してください：

```bash
# Node.js版本確認
node --version
npm --version

# ブラウザ確認
google-chrome-stable --version
npx playwright --version

# ランナー状態確認
cd ~/actions-runner
./run.sh --once
```

## 注意事項

- セルフホストランナーは定期的にセキュリティアップデートを適用してください
- ログファイルのサイズに注意し、定期的にローテーションを行ってください
- 本番環境との分離を徹底し、テスト用の環境変数のみを使用してください

## 参考資料

- [GitHub Actions Self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Playwright CI設定](https://playwright.dev/docs/ci)
- [Node.js CI ベストプラクティス](https://docs.npmjs.com/cli/v9/using-npm/config)