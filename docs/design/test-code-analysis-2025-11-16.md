# フロントエンドテストコード調査レポート

調査日: 2025-11-16

## 📊 概要

### テストファイル統計
- **総テストファイル数**: 18ファイル
- **総テスト数**: 163テスト
- **合格率**: 100% (すべて合格)
- **カバレッジ設定**: グローバル80%

### ディレクトリ構成
```
frontend/src/
├── components/
│   ├── Button/Button.test.tsx (スナップショット)
│   ├── Header/Header.test.tsx 
│   └── Toast/ (3テストファイル)
├── features/
│   ├── bookmarks/
│   │   ├── components/ (2テストファイル)
│   │   └── queries/api.test.ts ⭐ APIテスト
│   └── labels/
│       ├── components/ (6テストファイル)
│       ├── hooks/ (2テストファイル)
│       ├── queries/api.ts ⭐ import.meta.vitestでAPIテスト
│       └── types.test.ts
└── hooks/
    └── useToast.test.tsx
```

## 🔍 APIリクエスト関連テストの特定

### 1. Bookmarks Feature

#### `features/bookmarks/queries/api.test.ts`
**テスト方針**: 専用テストファイルでAPIロジックをテスト

**テスト対象関数**:
- ✅ `createBookmark()` - POST /api/bookmarks/bulk
- ✅ `getRecentlyReadBookmarks()` - GET /api/bookmarks/recent
- ✅ `addBookmarkToFavorites()` - POST /api/bookmarks/:id/favorite
- ✅ `removeBookmarkFromFavorites()` - DELETE /api/bookmarks/:id/favorite
- ✅ `markBookmarkAsRead()` - PATCH /api/bookmarks/:id/read
- ✅ `markBookmarkAsUnread()` - PATCH /api/bookmarks/:id/unread

**テストパターン**:
```typescript
// 正常系: レスポンスの検証
it("正常にブックマークを作成する", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ success: true })
  });
  await api.createBookmark({ title: "テスト", url: "..." });
  expect(mockFetch).toHaveBeenCalledWith(...);
});

// 異常系: エラーハンドリング
it("作成に失敗した場合エラーを投げる", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    json: () => Promise.resolve({ success: false, message: "Invalid data" })
  });
  await expect(api.createBookmark(...)).rejects.toThrow("Invalid data");
});
```

**テストされていない関数**:
- `useGetRecentBookmarks()` - React Queryフック
- `useMarkBookmarkAsRead()` - 楽観的更新のフック
- `useMarkBookmarkAsUnread()` - 楽観的更新のフック  
- `useToggleFavoriteBookmark()` - 楽観的更新のフック

### 2. Labels Feature

#### `features/labels/queries/api.ts` (import.meta.vitest使用)
**テスト方針**: 実装ファイル内にテストを埋め込む（import.meta.vitest）

**テスト対象関数**:
- ✅ `fetchLabels()` - GET /api/labels
- ✅ `createLabel()` - POST /api/labels
- ✅ `updateLabelDescription()` - PATCH /api/labels/:id
- ✅ `deleteLabel()` - DELETE /api/labels/:id
- ✅ `cleanupUnusedLabels()` - DELETE /api/labels/cleanup
- ⚠️ `_fetchLabelById()` - 未使用のため未テスト（プレフィックス`_`で明示）

**テストパターン**:
```typescript
if (import.meta.vitest) {
  test("fetchLabels: 正常にラベル一覧を取得する", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, labels: mockLabels })
    });
    const result = await fetchLabels();
    expect(result).toEqual(mockLabels);
  });
  
  test("fetchLabels: HTTPエラー時に例外を投げる", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchLabels()).rejects.toThrow("Failed to fetch labels");
  });
}
```

## ⚠️ 問題点のリストアップ

### 🔴 重大な問題

#### 1. テストアプローチの不統一
**問題**: 同じ種類のコード（API関数）に対して異なるテスト手法を使用

| Feature | テスト方式 | ファイル |
|---------|-----------|---------|
| bookmarks | 専用テストファイル | `api.test.ts` |
| labels | import.meta.vitest | `api.ts`内 |

**影響**:
- 開発者の混乱（どちらの方式で書くべきか不明確）
- コードレビューの負担増加
- メンテナンスコストの増加

**推奨**: どちらか一方に統一すべき
- Option A: すべて専用テストファイル（`.test.ts`）
- Option B: すべて`import.meta.vitest`（TDD向き）

#### 2. React QueryフックのテストがJustで不足
**問題**: `bookmarks/queries/`配下のカスタムフック（useXXX）にテストがない

**テストされていないフック**:
```typescript
// bookmarks/queries/
- useGetRecentBookmarks.ts       ❌ テストなし
- useMarkBookmarkAsRead.ts       ❌ テストなし (楽観的更新のロジックあり)
- useMarkBookmarkAsUnread.ts     ❌ テストなし (楽観的更新のロジックあり)
- useToggleFavoriteBookmark.ts   ❌ テストなし (楽観的更新のロジックあり)
```

**対照的に、labelsは完備**:
```typescript
// labels/hooks/
- useLabels.test.tsx             ✅ テストあり
- useManageLabels.test.tsx       ✅ テストあり
```

**影響**:
- 楽観的更新のバグリスクが高い（複雑なキャッシュ更新ロジック）
- リファクタリング時の安全性が低い
- カバレッジが不足している可能性

#### 3. コンポーネントテストでのフックモックの過度な使用
**問題**: `BookmarkCard.test.tsx`でReact Queryフックを完全にモック化

```typescript
// BookmarkCard.test.tsx
vi.mock("../queries/useToggleFavoriteBookmark", () => ({
  useToggleFavoriteBookmark: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));
```

**影響**:
- **統合テストとしての価値が低い**: 実際の動作を検証していない
- **偽陽性のリスク**: フック実装が壊れてもテストは通る
- **メンテナンスコスト**: フックのインターフェース変更時に複数ファイル修正が必要

**代替案**:
- MSWでAPIをモック（より統合テストに近い）
- またはフックのテストを別途作成して、コンポーネントテストではE2E的に検証

### 🟡 中程度の問題

#### 4. スナップショットテストの過度な使用
**対象ファイル**:
- `Button.test.tsx` - すべてスナップショット
- `Toast.snapshot.test.tsx` - 専用スナップショットファイル

**問題点**:
- **脆弱**: スタイル変更のたびに更新が必要
- **レビュー困難**: スナップショット差分は見づらい
- **意図不明**: 何を保証したいのか不明確

**例**:
```typescript
// Button.test.tsx
test("デフォルトスタイルのスナップショット", () => {
  const { container } = render(<Button>デフォルトボタン</Button>);
  expect(container).toMatchSnapshot(); // ❌ 何をテストしたいのか不明
});
```

**推奨**:
```typescript
// より明確なテスト
test("デフォルトスタイルが適用される", () => {
  render(<Button>ボタン</Button>);
  const button = screen.getByRole("button");
  expect(button).toHaveClass("bg-blue-500", "text-white"); // ✅ 意図が明確
});
```

#### 5. テストデータの重複定義
**問題**: 同じようなモックデータが複数ファイルに散在

**例**:
```typescript
// BookmarkCard.test.tsx
const mockBookmark: BookmarkWithLabel = {
  id: 1,
  title: "テスト記事",
  url: "https://example.com",
  createdAt: "2024-01-01T00:00:00.000Z",
  // ...
};

// BookmarksList.test.tsx
const mockBookmark = {
  id: 1,
  url: "https://example.com",
  title: "Test Bookmark",
  // ... 微妙に異なる
};
```

**推奨**: `test-utils.tsx`にファクトリ関数を作成
```typescript
// test-utils.tsx
export const createMockBookmark = (overrides?: Partial<BookmarkWithLabel>): BookmarkWithLabel => ({
  id: 1,
  title: "テスト記事",
  url: "https://example.com",
  // ... デフォルト値
  ...overrides,
});
```

#### 6. エラーハンドリングテストの不足
**問題**: ネットワークエラーやタイムアウトのテストが少ない

**現状**:
```typescript
// api.test.ts - HTTPステータスエラーのみ
it("取得に失敗した場合エラーを投げる", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 500,
    text: () => Promise.resolve("Server Error")
  });
  await expect(api.getRecentlyReadBookmarks()).rejects.toThrow(...);
});
```

**不足しているケース**:
- ネットワークエラー（`fetch`が例外を投げる）
- タイムアウト
- 不正なJSONレスポンス（一部は実装されている）
- CORSエラー

### 🟢 軽微な問題

#### 7. テスト説明の日本語/英語混在
**例**:
- 日本語: `"正常にブックマークを作成する"` (bookmarks)
- 英語: `"renders correctly"` (一部コンポーネント)

**推奨**: プロジェクトでは日本語に統一（既存の多くが日本語）

#### 8. beforeEach/beforeAllの使い分けが不明確
**問題**: モックのクリアタイミングが統一されていない

```typescript
// 一部はbeforeEach
beforeEach(() => {
  vi.clearAllMocks();
});

// 一部はbeforeEachなし
// テスト内で個別にクリア
```

#### 9. test vs it の使い分け
**現状**: 混在している
- `test()`: labels feature
- `it()`: bookmarks feature

**推奨**: どちらかに統一（機能的には同じ）

## ✅ 良い点

### 1. テストファイルの配置
- 実装ファイルと同じディレクトリに配置（見つけやすい）
- 命名規則が統一（`.test.ts[x]`）

### 2. テストの網羅性（API層）
- すべてのAPI関数に正常系・異常系のテストがある
- エッジケース（空配列、nullなど）も考慮

### 3. QueryClientのセットアップ
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },  // ✅ テスト高速化
    mutations: { retry: false },
  },
});
```

### 4. import.meta.vitestの活用（labels）
- TDD開発に適している
- 実装とテストが近い（コンテキストスイッチが少ない）

## 📋 改善提案

### 優先度: 高

#### 1. テストアプローチの統一
**提案**: 専用テストファイル方式に統一

**理由**:
- チームメンバーが多い場合、分離した方が並行作業しやすい
- import.meta.vitestはViteに依存（ツール変更時のリスク）
- 既存の多くが専用ファイル方式

**移行タスク**:
```bash
# labels/queries/api.ts内のテストを抽出
- [ ] labels/queries/api.test.tsを作成
- [ ] import.meta.vitestブロックを移動
- [ ] 既存テストが通ることを確認
- [ ] 元ファイルからテストコード削除
```

#### 2. React Queryフックのテスト追加
**優先度**: 🔴 緊急

**対象**:
```bash
- [ ] useGetRecentBookmarks.test.tsx
- [ ] useMarkBookmarkAsRead.test.tsx (楽観的更新の検証が重要)
- [ ] useMarkBookmarkAsUnread.test.tsx
- [ ] useToggleFavoriteBookmark.test.tsx (複雑なロジック)
```

**参考実装**: `labels/hooks/useManageLabels.test.tsx`

**テストすべきポイント**:
- QueryClientとの統合
- 楽観的更新のロジック
- エラー時のロールバック
- onSuccess/onErrorコールバック

#### 3. コンポーネントテストの見直し
**提案**: フックを実際にテスト、APIはMSWでモック

```typescript
// Before (BookmarkCard.test.tsx)
vi.mock("../queries/useToggleFavoriteBookmark", () => ({
  useToggleFavoriteBookmark: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// After
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.post('/api/bookmarks/:id/favorite', () => {
    return HttpResponse.json({ success: true });
  })
);
```

### 優先度: 中

#### 4. テストユーティリティの整備
**ファイル**: `frontend/src/test-utils.tsx`（既存を拡張）

**追加すべき機能**:
```typescript
// モックデータファクトリ
export const createMockBookmark = (overrides?: Partial<BookmarkWithLabel>) => ({...});
export const createMockLabel = (overrides?: Partial<Label>) => ({...});

// カスタムレンダー関数（既にある程度実装されている可能性）
export const renderWithProviders = (ui: React.ReactElement, options?: {
  queryClient?: QueryClient;
  // ... その他のプロバイダー
}) => {
  // QueryClient, ToastProvider等でラップ
};
```

#### 5. スナップショットテストの削減
**タスク**:
```bash
- [ ] Button.test.tsx: スナップショット → プロパティテストに変更
- [ ] Toast.snapshot.test.tsx: 最小限に削減または削除
```

### 優先度: 低

#### 6. テスト説明の統一
```bash
- [ ] すべてのテスト説明を日本語に統一
- [ ] test() と it() を it() に統一（または vice versa）
```

#### 7. beforeEach/afterEachの統一
```bash
- [ ] すべてのテストファイルにbeforeEach(() => vi.clearAllMocks())を追加
```

## 📈 カバレッジ改善の余地

### 現状のカバレッジ目標
```typescript
// vitest.config.ts
coverage: {
  all: true,
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.test.{ts,tsx}',
    'src/**/*.stories.{ts,tsx}',
    // ...
  ],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

### テストが不足している可能性のあるファイル
```bash
# React Queryフック
features/bookmarks/queries/useGetRecentBookmarks.ts     - カバレッジ未確認
features/bookmarks/queries/useMarkBookmarkAsRead.ts     - カバレッジ未確認
features/bookmarks/queries/useMarkBookmarkAsUnread.ts   - カバレッジ未確認
features/bookmarks/queries/useToggleFavoriteBookmark.ts - カバレッジ未確認

# 上記をテストすることで、カバレッジ目標達成の可能性が高い
```

### カバレッジ確認コマンド
```bash
cd frontend
pnpm run test:coverage
```

## 🎯 アクションプラン（推奨順序）

### フェーズ1: 緊急対応（1-2週間）
1. ✅ [完了] テストファイル構成の調査
2. ⏳ React Queryフックのテスト作成
   - `useMarkBookmarkAsRead.test.tsx`（最優先: 楽観的更新ロジック）
   - `useToggleFavoriteBookmark.test.tsx`
   - `useMarkBookmarkAsUnread.test.tsx`
   - `useGetRecentBookmarks.test.tsx`
3. ⏳ カバレッジレポート確認

### フェーズ2: テスト品質向上（2-4週間）
4. ⏳ テストアプローチの統一
   - labels/queries/api.ts → api.test.ts へ移行
5. ⏳ コンポーネントテストの改善
   - MSW導入の検討
   - フックモックの削減
6. ⏳ テストユーティリティの整備

### フェーズ3: クリーンアップ（1-2週間）
7. ⏳ スナップショットテストの見直し
8. ⏳ テストコード規約の統一
   - test/it の統一
   - 説明文の日本語化
   - beforeEachの統一

### フェーズ4: ドキュメント化
9. ⏳ テストガイドラインの作成
   - APIテストの書き方
   - React Queryフックのテスト方法
   - コンポーネントテストのベストプラクティス

## 📝 まとめ

### 総評
- ✅ **テスト合格率は100%** - 既存のテストは安定
- ✅ **API層のテストは充実** - 正常系・異常系をカバー
- ⚠️ **テストアプローチが不統一** - bookmarksとlabelsで異なる手法
- ⚠️ **React Queryフックのテスト不足** - bookmarks側が特に不足
- ⚠️ **スナップショットテストの過度な使用** - メンテナンスコストが高い

### 最優先で対応すべき項目
1. **bookmarks/queries配下のReact Queryフックにテストを追加**（楽観的更新のバグリスク）
2. **テストアプローチの統一**（開発効率向上）
3. **コンポーネントテストでのフックモック削減**（テストの信頼性向上）

### リスク評価
| 項目 | リスクレベル | 影響範囲 |
|------|-------------|---------|
| React Queryフックのテスト不足 | 🔴 高 | ブックマーク機能全般 |
| テストアプローチの不統一 | 🟡 中 | 開発速度・保守性 |
| スナップショットテストの過度な使用 | 🟡 中 | CI/CD、レビュー効率 |
| テストデータの重複 | 🟢 低 | 保守性 |

---

**調査者コメント**:
全体的にテストの質は高く、API層は十分にテストされています。ただし、React Queryフック（特に楽観的更新を含むもの）のテストが不足しており、これが最大のリスクです。また、テストアプローチの不統一は長期的な保守性に影響するため、早めの統一をお勧めします。
