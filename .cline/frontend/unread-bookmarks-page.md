# 未読ブックマーク一覧ページの設計

## 概要

トップページにアクセスした際に、未読のブックマークを一覧表示する機能を実装します。

## 技術スタック

- Next.js
- Tailwind CSS（スタイリング）
- Vitest（テスト）
- Biome（静的解析）

## コンポーネント設計

### ページコンポーネント
- `app/page.tsx`
  - トップページのServer Component
  - 未読ブックマークの取得と一覧表示の制御

### 共通コンポーネント
- `components/BookmarkCard.tsx`
  - 各ブックマークの表示用カードコンポーネント
  - Props:
    - title: string
    - url: string
    - createdAt: string

### データフェッチング
- `lib/api/bookmarks.ts`
  - ブックマーク関連のAPI呼び出し関数を管理
  - 未読ブックマーク取得の実装

## 画面設計

### レイアウト
- ヘッダー部分
  - サイトタイトル
- メインコンテンツ
  - ブックマークカードのグリッドレイアウト
  - レスポンシブ対応（sm: 1列, md: 2列, lg: 3列）

### ブックマークカード
- タイトル（クリッカブル）
- URL（省略表示）
- 作成日時
- ホバー時のインタラクション

## テスト戦略

### ユニットテスト
- `BookmarkCard.test.tsx`
  - プロパティの正しい表示
  - リンクの動作確認
  - レイアウトのスナップショットテスト

### APIテスト
- `bookmarks.test.ts`
  - API呼び出しのモック
  - エラーハンドリングの確認

## エラーハンドリング

- API通信エラー時の表示
- データ不足時のフォールバック表示
- ローディング状態の表示

## ディレクトリ構造

```
frontend/
├── src/
│   ├── app/
│   │   └── page.tsx
│   ├── components/
│   │   └── BookmarkCard.tsx
│   └── lib/
│       └── api/
│           └── bookmarks.ts
└── tests/
    ├── components/
    │   └── BookmarkCard.test.tsx
    └── lib/
        └── api/
            └── bookmarks.test.ts
```

## 実装手順

1. APIクライアントの実装
   - GET /unreadエンドポイントの呼び出し実装
   - 型定義の作成

2. コンポーネントの実装
   - BookmarkCardコンポーネントの作成
   - スタイリングの適用

3. ページの実装
   - Server Componentでのデータフェッチ
   - レイアウトの構築

4. テストの実装
   - 各コンポーネントのユニットテスト
   - API関連のテスト

5. エラーハンドリングの実装
   - エラー状態の表示
   - ローディング状態の実装