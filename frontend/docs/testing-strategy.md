# フロントエンドテスト戦略

## プロジェクト概要

このプロジェクトは未読ブックマークを管理するWebアプリケーションです。主な機能は：

1. 未読ブックマーク一覧の表示
2. ブックマークの更新機能
3. エラーハンドリング
4. ローディング状態の表示

## コンポーネント構成

1. **ページコンポーネント**
   - `app/page.tsx`: メインページ
   - `app/error.tsx`: エラーページ
   - `app/loading.tsx`: ローディング表示

2. **UIコンポーネント**
   - `components/BookmarksList.tsx`: ブックマーク一覧（データフェッチを含む）
   - `components/BookmarkCard.tsx`: 個別のブックマーク表示

3. **APIレイヤー**
   - `app/api/bookmarks/unread/route.ts`: サーバーサイドのAPIエンドポイント

## テスト戦略

### 1. 単体テストが有効なコンポーネント

#### BookmarkCard
- 純粋なプレゼンテーショナルコンポーネント
- 入力に対する出力が予測可能
- テストケース:
  - タイトルの表示（タイトルあり/なしの場合）
  - URLの表示
  - 日付のフォーマット
  - リンクの動作

```typescript
// frontend/src/components/__tests__/BookmarkCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BookmarkCard } from '../BookmarkCard';

describe('BookmarkCard', () => {
  it('should display title when provided', () => {
    // ...
  });

  it('should display "タイトルなし" when title is null', () => {
    // ...
  });
});
```

#### BookmarksList
- 状態管理とデータフェッチを含むコンテナコンポーネント
- テストケース:
  - 初期状態の表示
  - ローディング状態
  - エラー状態
  - データ取得後の表示
  - 更新ボタンの動作

```typescript
// frontend/src/components/__tests__/BookmarksList.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookmarksList } from '../BookmarksList';

describe('BookmarksList', () => {
  it('should show loading state when fetching data', () => {
    // ...
  });

  it('should display error message when API fails', () => {
    // ...
  });
});
```

### 2. テストディレクトリ構成

```
frontend/
├── src/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── BookmarkCard.test.tsx
│   │   │   └── BookmarksList.test.tsx
│   │   ├── BookmarkCard.tsx
│   │   └── BookmarksList.tsx
│   └── lib/
│       ├── __tests__/
│       │   └── api/
│       │       └── bookmarks.test.ts
│       └── api/
│           └── bookmarks.ts
└── vitest.config.ts
```

### 3. テスト優先度

1. **高優先度**
   - `BookmarkCard`: UIの正確性
   - `BookmarksList`: データ取得と表示の統合
   - `lib/api/bookmarks`: APIクライアントの動作

2. **中優先度**
   - エラーハンドリング
   - ローディング状態

3. **低優先度**
   - スタイリング
   - アニメーション

## テストツールと設定

1. **Vitest**: テストランナー
2. **@testing-library/react**: Reactコンポーネントのテストユーティリティ
3. **@testing-library/dom**: DOMテスト用のユーティリティ（@testing-library/reactの基盤）
4. **MSW (Mock Service Worker)**: APIモック

### セットアップ手順

1. 追加の依存関係インストール
```bash
npm install -D @testing-library/react @testing-library/dom msw
```

2. Vitestの設定
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true
  },
})
```

## まとめ

このプロジェクトでは、以下の理由から単体テストが有効です：

1. コンポーネントの責務が明確に分離されている
2. データフローが予測可能
3. 外部依存（API）が明確に分離されている

単体テストは、コンポーネントの堅牢性を確保し、リファクタリングを安全に行うために重要な役割を果たします。特にデータ取得とUIの表示が分離されているため、テストの保守も容易です。