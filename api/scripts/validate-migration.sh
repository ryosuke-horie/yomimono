#!/bin/bash

# マイグレーション検証スクリプト
# 使用方法: ./scripts/validate-migration.sh [development|production]

set -e

ENV=${1:-development}
if [[ "$ENV" != "development" && "$ENV" != "production" ]]; then
    echo "エラー: 環境は 'development' または 'production' を指定してください"
    exit 1
fi

echo "========================================="
echo "D1マイグレーション検証スクリプト"
echo "環境: $ENV"
echo "========================================="

# 実行環境に応じたコマンドプレフィックスの設定
if [ "$ENV" = "development" ]; then
    CMD_PREFIX="wrangler d1 execute yomimono-db --local --json --command"
else
    CMD_PREFIX="wrangler d1 execute yomimono-db --json --command"
fi

# 検証結果を保存する配列
declare -a issues=()

echo "1. テーブル構造の検証..."

# 各テーブルの存在確認
TABLES=("bookmarks" "favorites" "labels" "article_labels")
for table in "${TABLES[@]}"; do
    echo "  - ${table}テーブルをチェック中..."
    if ! $CMD_PREFIX "SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'" | jq -e ".[0]" > /dev/null; then
        issues+=("テーブル ${table} が存在しません")
    fi
done

echo ""
echo "2. 外部キー制約の検証..."

# 外部キー制約の確認
echo "  - favoritesテーブルの外部キー..."
FK_CHECK=$($CMD_PREFIX "PRAGMA foreign_key_list(favorites)" | jq -r ".[0].table" 2>/dev/null || echo "")
if [ "$FK_CHECK" != "bookmarks" ]; then
    issues+=("favoritesテーブルの外部キー制約が正しくありません")
fi

echo "  - article_labelsテーブルの外部キー..."
FK_CHECK1=$($CMD_PREFIX "PRAGMA foreign_key_list(article_labels)" | jq -r ".[0].table" 2>/dev/null || echo "")
FK_CHECK2=$($CMD_PREFIX "PRAGMA foreign_key_list(article_labels)" | jq -r ".[1].table" 2>/dev/null || echo "")
if [[ "$FK_CHECK1" != "bookmarks" && "$FK_CHECK1" != "labels" ]] || [[ "$FK_CHECK2" != "bookmarks" && "$FK_CHECK2" != "labels" ]]; then
    issues+=("article_labelsテーブルの外部キー制約が正しくありません")
fi

echo ""
echo "3. データ整合性の検証..."

# 孤立したデータのチェック
echo "  - 孤立したfavoritesレコードをチェック..."
ORPHANED_FAVORITES=$($CMD_PREFIX "SELECT COUNT(*) as count FROM favorites f LEFT JOIN bookmarks b ON f.bookmark_id = b.id WHERE b.id IS NULL" | jq -r ".[0].count")
if [ "$ORPHANED_FAVORITES" -gt 0 ]; then
    issues+=("孤立したfavoritesレコード: ${ORPHANED_FAVORITES}件")
fi

echo "  - 孤立したarticle_labelsレコードをチェック..."
ORPHANED_LABELS=$($CMD_PREFIX "SELECT COUNT(*) as count FROM article_labels al LEFT JOIN bookmarks b ON al.article_id = b.id WHERE b.id IS NULL" | jq -r ".[0].count")
if [ "$ORPHANED_LABELS" -gt 0 ]; then
    issues+=("孤立したarticle_labelsレコード（bookmarks参照）: ${ORPHANED_LABELS}件")
fi

echo ""
echo "4. インデックスの検証..."

# 重要なインデックスの存在確認
echo "  - favorites.bookmark_idのユニークインデックス..."
IDX_CHECK=$($CMD_PREFIX "PRAGMA index_list(favorites)" | jq -r '.[] | select(.name | contains("bookmark_id")).unique' 2>/dev/null || echo "")
if [ "$IDX_CHECK" != "1" ]; then
    issues+=("favorites.bookmark_idのユニークインデックスが存在しません")
fi

echo "  - labels.nameのユニークインデックス..."
IDX_CHECK=$($CMD_PREFIX "PRAGMA index_list(labels)" | jq -r '.[] | select(.name | contains("name")).unique' 2>/dev/null || echo "")
if [ "$IDX_CHECK" != "1" ]; then
    issues+=("labels.nameのユニークインデックスが存在しません")
fi

echo ""
echo "========================================="
echo "検証結果："

if [ ${#issues[@]} -eq 0 ]; then
    echo "✅ すべての検証に合格しました！"
else
    echo "❌ 以下の問題が見つかりました："
    for issue in "${issues[@]}"; do
        echo "  - $issue"
    done
    exit 1
fi

echo "========================================="