#!/bin/bash

# 安全なD1マイグレーションスクリプト
# 使用方法: ./scripts/safe-migrate.sh [development|production]

set -e  # エラー時に即座に終了

# 環境の確認
ENV=${1:-development}
if [[ "$ENV" != "development" && "$ENV" != "production" ]]; then
    echo "エラー: 環境は 'development' または 'production' を指定してください"
    exit 1
fi

echo "========================================="
echo "D1マイグレーション実行スクリプト"
echo "環境: $ENV"
echo "========================================="

# バックアップディレクトリの作成
BACKUP_DIR="./db_backups"
mkdir -p $BACKUP_DIR

# タイムスタンプの生成
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${ENV}_${TIMESTAMP}.sql"

echo "1. バックアップを作成中..."
if [ "$ENV" = "development" ]; then
    wrangler d1 export yomimono-db --local > "$BACKUP_FILE"
else
    # 本番環境のバックアップ（要権限確認）
    echo "警告: 本番環境のバックアップを実行します。権限があることを確認してください。"
    echo "続行しますか？ (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "中止しました。"
        exit 0
    fi
    wrangler d1 export yomimono-db > "$BACKUP_FILE"
fi

echo "バックアップ完了: $BACKUP_FILE"

echo ""
echo "2. 現在のマイグレーション状態を確認中..."
npx drizzle-kit status

echo ""
echo "3. マイグレーションを実行しますか？ (y/N)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "マイグレーションを中止しました。"
    exit 0
fi

echo ""
echo "4. マイグレーションを実行中..."
if [ "$ENV" = "development" ]; then
    npm run migrate:development
else
    npm run migrate:production
fi

echo ""
echo "5. データの整合性チェック..."
# 基本的なデータカウントのチェック
echo "  - bookmarksテーブルのレコード数を確認中..."
if [ "$ENV" = "development" ]; then
    BOOKMARKS_COUNT=$(wrangler d1 execute yomimono-db --local --json --command "SELECT COUNT(*) as count FROM bookmarks" | jq -r '.[0].count')
    FAVORITES_COUNT=$(wrangler d1 execute yomimono-db --local --json --command "SELECT COUNT(*) as count FROM favorites" | jq -r '.[0].count')
else
    BOOKMARKS_COUNT=$(wrangler d1 execute yomimono-db --json --command "SELECT COUNT(*) as count FROM bookmarks" | jq -r '.[0].count')
    FAVORITES_COUNT=$(wrangler d1 execute yomimono-db --json --command "SELECT COUNT(*) as count FROM favorites" | jq -r '.[0].count')
fi

echo "  - bookmarks: $BOOKMARKS_COUNT 件"
echo "  - favorites: $FAVORITES_COUNT 件"

echo ""
echo "6. テストを実行しますか？ (y/N)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "テストを実行中..."
    npm test
fi

echo ""
echo "========================================="
echo "マイグレーションが完了しました！"
echo "バックアップファイル: $BACKUP_FILE"
echo ""
echo "問題が発生した場合は、以下のコマンドでロールバックできます："
if [ "$ENV" = "development" ]; then
    echo "wrangler d1 execute yomimono-db --local --file=$BACKUP_FILE"
else
    echo "wrangler d1 execute yomimono-db --file=$BACKUP_FILE"
fi
echo "========================================="