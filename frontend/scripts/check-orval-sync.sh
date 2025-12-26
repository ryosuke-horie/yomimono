#!/bin/bash
# Orval生成ファイルの同期検証スクリプト
#
# 使用方法: pnpm run check:orval
#
# このスクリプトはOrvalで生成されたファイルが正しく同期されているかを検証します。
# コミット済みの生成ファイルがOrval出力と一致しない場合、エラーを出力します。
# 生成ファイルへの直接編集はCIで検出され、マージがブロックされます。
# カスタム型が必要な場合は、生成ファイルをimportして別ファイルで拡張してください。

set -e

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "🔍 Orval生成ファイルの同期状態をチェック中..."

# スクリプトのディレクトリを基準にfrontendディレクトリへ移動
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$FRONTEND_DIR"

# 差分チェック対象のディレクトリ
FRONTEND_OPENAPI="src/lib/openapi"
API_GENERATED="../api/src/generated"

# ローカル環境での未コミット変更をチェック
if ! git diff --quiet HEAD -- "$FRONTEND_OPENAPI" "$API_GENERATED" 2>/dev/null; then
  echo -e "${YELLOW}⚠️  警告: 生成ファイルに未コミットの変更があります${NC}"
  echo ""
  echo "変更されたファイル:"
  git diff --name-only HEAD -- "$FRONTEND_OPENAPI" "$API_GENERATED" 2>/dev/null | head -10
  echo ""
  echo "これらの変更が意図したものか確認してください。"
  echo "意図しない変更の場合: git restore $FRONTEND_OPENAPI $API_GENERATED"
  echo ""
fi

# Orval実行
echo "📦 Orvalを実行中..."
pnpm run orval --silent 2>/dev/null || pnpm run orval

# 再生成後の差分チェック（ワーキングツリー vs HEAD）
# orvalは clean: true でファイルを上書きするため、
# コミット済みの内容と再生成された内容を比較
if git diff --quiet HEAD -- "$FRONTEND_OPENAPI" "$API_GENERATED" 2>/dev/null; then
  echo -e "${GREEN}✅ Orval生成ファイルは正しく同期されています${NC}"
  exit 0
else
  echo -e "${RED}❌ エラー: Orval生成ファイルがコミット内容と一致しません${NC}"
  echo ""
  echo -e "${YELLOW}差分のあるファイル:${NC}"
  git diff --name-only HEAD -- "$FRONTEND_OPENAPI" "$API_GENERATED" 2>/dev/null | head -20
  echo ""
  echo -e "${YELLOW}原因と対処法:${NC}"
  echo "  1. OpenAPI仕様が更新された場合:"
  echo "     → 再生成されたファイルをコミットしてください"
  echo "     git add $FRONTEND_OPENAPI $API_GENERATED"
  echo ""
  echo "  2. 生成ファイルを手動で編集した場合:"
  echo "     → 手動編集は禁止です。変更を破棄してください"
  echo "     git restore $FRONTEND_OPENAPI $API_GENERATED"
  echo ""
  echo "  3. カスタム型が必要な場合:"
  echo "     → 生成ファイルをimportして別ファイルで拡張してください"
  echo ""
  echo -e "${YELLOW}例:${NC}"
  echo "  // ✅ 正しい方法: 別ファイルで拡張"
  echo "  import type { Bookmark } from \"@/lib/openapi/browser/schemas\";"
  echo "  export type BookmarkWithUI = Bookmark & { isSelected: boolean };"
  exit 1
fi
