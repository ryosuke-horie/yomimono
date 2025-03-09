日本語で返答してください。

# Technical Context

## 開発環境

### Chrome拡張機能

- Manifest V3
- JavaScript (クライアントサイド)
- HTML/CSS (ポップアップUI)

### API

- Cloudflare Workers
- TypeScript
- Drizzle ORM

## 技術的制約

### Chrome拡張機能の制約

- Manifest V3の制限に従う必要性
- Content Securityの考慮
- Background ServiceWorkerの制限

### API制約

- Cloudflare Workersの実行時間制限
- エッジでの処理要件

## 依存関係

### Chrome拡張機能

```json
{
  "permissions": ["tabs", "activeTab"],
  "host_permissions": ["http://*/*", "https://*/*"]
}
```

### 開発ツール

- Biome (フォーマッタ/リンタ)
- TypeScript
- Vitest (テストフレームワーク)

## APIエンドポイント

### ブックマーク登録

- エンドポイント: `https://effective-yomimono-api.ryosuke-horie37.workers.dev/api/bookmarks/bulk`
- メソッド: POST
- ペイロード:

```typescript
{
  bookmarks: Array<{
    url: string;
    title: string;
  }>
}
```

## 開発プラクティス

- TypeScriptによる型安全性の確保
- テストファーストの開発
- コードフォーマットの自動化
- モジュール化による保守性の向上
