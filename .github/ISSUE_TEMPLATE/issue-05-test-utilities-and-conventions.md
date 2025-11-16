# Issue: テストユーティリティの整備とコード規約統一

## 優先度
🟢 低（品質向上）

## 概要
テストデータの重複定義や、テストコード規約の不統一により、保守性が低下しています。

## 問題点

### 1. テストデータの重複定義
同じようなモックデータが複数ファイルに散在：

```typescript
// BookmarkCard.test.tsx
const mockBookmark: BookmarkWithLabel = {
  id: 1,
  title: "テスト記事",
  url: "https://example.com",
  // ...
};

// BookmarksList.test.tsx
const mockBookmark = {
  id: 1,
  url: "https://example.com",
  title: "Test Bookmark",  // 微妙に異なる
  // ...
};
```

### 2. テスト説明の言語混在
- 日本語: `"正常にブックマークを作成する"` (大多数)
- 英語: `"renders correctly"` (一部)

### 3. test vs it の混在
- `test()`: labels feature
- `it()`: bookmarks feature

### 4. beforeEach/afterEach の不統一
一部にしか`beforeEach(() => vi.clearAllMocks())`がない

## 対応内容

### Task 1: テストユーティリティの作成
`frontend/src/test-utils.tsx` を拡張：

```typescript
// モックデータファクトリ
export const createMockBookmark = (
  overrides?: Partial<BookmarkWithLabel>
): BookmarkWithLabel => ({
  id: 1,
  title: "テスト記事",
  url: "https://example.com",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  isRead: false,
  isFavorite: false,
  label: null,
  ...overrides,
});

export const createMockLabel = (
  overrides?: Partial<Label>
): Label => ({
  id: 1,
  name: "テストラベル",
  description: null,
  ...overrides,
});

// カスタムレンダー関数
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: {
    queryClient?: QueryClient;
  }
) => {
  const queryClient = options?.queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>
  );
};
```

### Task 2: テストコード規約の統一

- [ ] すべてのテスト説明を日本語に統一
- [ ] `test()` と `it()` を `test()` に統一（または`it()`に統一）
- [ ] すべてのテストファイルに`beforeEach(() => vi.clearAllMocks())`を追加

### Task 3: モックデータの置き換え

- [ ] `BookmarkCard.test.tsx`: `createMockBookmark()`を使用
- [ ] `BookmarksList.test.tsx`: `createMockBookmark()`を使用
- [ ] その他のテストファイルでも同様に適用

## 受け入れ基準

- [ ] `test-utils.tsx`にファクトリ関数が追加されている
- [ ] 重複するモックデータ定義が削除されている
- [ ] テスト説明が日本語に統一されている
- [ ] test/itが統一されている
- [ ] すべてのテストファイルにbeforeEachがある
- [ ] すべてのテストが合格する

## 備考
この改善により、新しいテストを書く際の一貫性が向上し、メンテナンスが容易になります。
