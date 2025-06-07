# Claude Code Custom Commands for Article Rating

Claude Code カスタムコマンドによる記事評価ワークフローの自動化ツールです。

## 概要

技術記事を Claude AI で自動評価し、データベースに保存するワークフローを提供します。段階的なステップ実行により、記事URLから評価完了までの処理を自動化できます。

## 主な機能

- **単一記事評価**: URLまたは記事IDから記事を評価
- **バッチ評価**: URLリストから複数記事を一括評価
- **段階的実行**: 6つのステップに分けた分かりやすい処理
- **エラーハンドリング**: 詳細なエラー情報と再試行機能
- **プログレス表示**: 視覚的な進捗表示
- **多様な出力形式**: text, json, summary 形式に対応

## インストール

```bash
cd claude-code-commands
npm install
npm run build
```

## 環境設定

必要な環境変数を設定してください：

```bash
export ANTHROPIC_API_KEY="your_claude_api_key"
export API_BASE_URL="http://localhost:8787"  # オプション
export FRONTEND_URL="http://localhost:3000"  # オプション
```

## 使用方法

### 基本的な記事評価

```bash
# URLから記事を評価
node dist/index.js rate-article --url "https://zenn.dev/example/articles/abc123"

# 自動評価（確認スキップ）
node dist/index.js rate-article --url "https://qiita.com/user/items/xyz789" --auto-evaluate

# 既存記事の評価
node dist/index.js rate-article --article-id 123

# JSON形式で出力
node dist/index.js rate-article --url "https://example.com" --output-format json
```

### バッチ評価

```bash
# URLリストから一括評価
node dist/index.js rate-articles-batch --urls-file urls.txt

# 並行数を指定
node dist/index.js rate-articles-batch --urls-file urls.txt --concurrency 2

# 既存評価をスキップ
node dist/index.js rate-articles-batch --urls-file urls.txt --skip-existing

# 結果をファイルに出力
node dist/index.js rate-articles-batch --urls-file urls.txt --output-file results.json
```

### システム確認

```bash
# ヘルスチェック
node dist/index.js health

# 設定確認
node dist/index.js config

# ヘルプ表示
node dist/index.js --help
node dist/index.js rate-article --help
```

## URLリストファイル形式

バッチ評価用のURLリストファイル例：

```text
# 技術記事のURLリスト
https://zenn.dev/example/articles/article1
https://qiita.com/user/items/item1
https://example.com/blog/post1

# コメント行は無視されます
https://another-site.com/article
```

## 評価基準

記事は以下の5つの観点から1-10点で評価されます：

1. **実用性**: 実際の開発現場で役立つか
2. **技術深度**: 技術的な深い理解を示しているか
3. **理解度**: 内容が分かりやすく説明されているか
4. **新規性**: 新しい知見や斬新なアプローチがあるか
5. **重要度**: 技術者として知っておくべき重要な内容か

総合スコアは5項目の平均値として自動計算されます。

## 実行ステップ

### rate-article コマンド

1. **記事情報の確認・取得**: 記事の存在確認と情報取得
2. **記事内容の抽出**: Webページから記事内容を抽出
3. **評価プロンプトの生成**: Claude用の評価プロンプトを準備
4. **Claudeによる記事評価**: AIによる記事の総合評価
5. **評価結果の保存**: データベースへの評価結果保存
6. **結果サマリーの表示**: 評価結果の整理と表示

### rate-articles-batch コマンド

1. **URLリスト読み込み**: URLファイルの読み込みと検証
2. **バッチ評価実行**: 並行処理による一括評価
3. **結果サマリー**: 統計情報とエラー詳細の表示

## 出力形式

### text（デフォルト）
```
🚀 記事評価が完了しました！

📊 結果サマリー:
   総合スコア: ⭐ 7.6/10
   評価ID: 42
   記事ID: 123
   処理時間: 2分30秒
   保存日時: 2023/12/07 15:30:45

🔗 詳細: http://localhost:3000/ratings?articleId=123
```

### json
```json
{
  "id": 42,
  "articleId": 123,
  "practicalValue": 8,
  "technicalDepth": 7,
  "understanding": 9,
  "novelty": 6,
  "importance": 8,
  "totalScore": 7.6,
  "comment": "実用的で分かりやすい記事です",
  "createdAt": "2023-12-07T06:30:45.000Z"
}
```

### summary
```
評価完了: 7.6/10 (ID: 42)
```

## エラーハンドリング

一般的なエラーと対処法：

### API設定エラー
```
❌ ANTHROPIC_API_KEY 環境変数が設定されていません
💡 Claude API キーが必要です
```

### ネットワークエラー
```
❌ 記事内容の抽出に失敗しました
💡 ネットワーク接続を確認してください
💡 記事が存在するかURLを確認してください
```

### URL形式エラー
```
❌ 無効なURLです: invalid-url
💡 記事URLを確認してください
```

## 開発

### テスト実行

```bash
npm test           # 全テスト実行
npm run test:coverage  # カバレッジ付きテスト
```

### リント・フォーマット

```bash
npm run lint       # リント実行
npm run format     # コードフォーマット
```

### ビルド

```bash
npm run build      # TypeScript ビルド
npm run dev        # 開発モード（ウォッチ）
```

## 制限事項

- Anthropic Claude API キーが必要
- yomimono API サーバーが起動している必要がある
- JavaScript が無効なWebページは内容抽出できない場合がある
- 大量のバッチ処理はAPI制限に注意

## ライセンス

MIT

## 貢献

Issue や Pull Request をお待ちしています。

## サポート

問題が発生した場合は、以下を確認してください：

1. `node dist/index.js health` でシステム状態を確認
2. `node dist/index.js config` で設定を確認
3. `DEBUG=1` 環境変数でデバッグ情報を表示