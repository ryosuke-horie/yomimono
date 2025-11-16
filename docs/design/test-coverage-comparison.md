# テストカバレッジ比較: Bookmarks vs Labels

## 📊 APIリクエスト関連テストの比較表

### API関数層のテスト

| Feature | テスト方式 | API関数数 | テスト済み | カバレッジ | 品質 |
|---------|----------|----------|-----------|-----------|------|
| **bookmarks** | 専用ファイル | 6 | ✅ 6/6 | 100% | ⭐⭐⭐⭐⭐ |
| **labels** | import.meta.vitest | 5 | ✅ 5/5 | 100% | ⭐⭐⭐⭐⭐ |

**評価**: 両方とも優秀 ✅

---

### React Queryフック層のテスト

| Feature | フック数 | テスト済み | カバレッジ | 品質 | リスク |
|---------|---------|-----------|-----------|------|--------|
| **bookmarks** | 4 | ❌ 0/4 | 0% | - | 🔴 高 |
| **labels** | 2 | ✅ 2/2 | 100% | ⭐⭐⭐⭐ | 🟢 低 |

**評価**: bookmarksに重大な問題あり ❌

---

## 🔍 詳細比較

### Bookmarks Feature

```
features/bookmarks/
├── queries/
│   ├── api.ts                           ✅ 実装
│   ├── api.test.ts                      ✅ テストあり（6関数）
│   ├── queryKeys.ts
│   ├── useGetRecentBookmarks.ts         ❌ テストなし
│   ├── useMarkBookmarkAsRead.ts         ❌ テストなし（楽観的更新）⚠️
│   ├── useMarkBookmarkAsUnread.ts       ❌ テストなし（楽観的更新）⚠️
│   └── useToggleFavoriteBookmark.ts     ❌ テストなし（楽観的更新）⚠️
└── components/
    ├── BookmarkCard.tsx
    ├── BookmarkCard.test.tsx            ⚠️ フックを完全モック
    ├── BookmarksList.tsx
    └── BookmarksList.test.tsx
```

**問題点**:
- React Queryフックが全くテストされていない
- 楽観的更新の複雑なロジックがノーテスト状態
- コンポーネントテストでフックをモック → 統合テストの意味がない

---

### Labels Feature

```
features/labels/
├── queries/
│   ├── api.ts                           ✅ 実装 + import.meta.vitestテスト
│   └── queryKeys.ts
├── hooks/
│   ├── useLabels.tsx                    ✅ 実装
│   ├── useLabels.test.tsx               ✅ テストあり
│   ├── useManageLabels.tsx              ✅ 実装
│   └── useManageLabels.test.tsx         ✅ テストあり
└── components/
    ├── LabelCreateForm.tsx
    ├── LabelCreateForm.test.tsx         ✅ 適切なテスト
    └── ... (6コンポーネント + テスト)
```

**良い点**:
- APIテストもフックテストも完備
- コンポーネントテストも適切
- テスト構成が模範的

---

## 📈 コードの複雑度とリスク評価

### useMarkBookmarkAsRead.ts の分析

**コード行数**: 158行  
**主な処理**:
1. 楽観的更新（onMutate）
2. 3つのキャッシュを同時更新（unread, favorite, recent）
3. エラー時のロールバック（onError）
4. 再同期（onSettled）

**複雑度**: 🔴 高  
**テスト**: ❌ なし  
**リスクレベル**: 🔴🔴🔴 **極めて高い**

**問題シナリオ例**:
```typescript
// バグの可能性
// 1. ロールバック漏れ → キャッシュ不整合
// 2. 楽観的更新の条件分岐ミス → UI不具合
// 3. recentデータへの追加ロジックのバグ → データ重複
```

---

### useToggleFavoriteBookmark.ts の分析

**コード行数**: 171行  
**主な処理**:
1. お気に入り追加/削除の判定
2. 3つのキャッシュを同時更新
3. 条件分岐の多いロジック（追加時/削除時）
4. エラーハンドリングとロールバック

**複雑度**: 🔴 高  
**テスト**: ❌ なし  
**リスクレベル**: 🔴🔴🔴 **極めて高い**

---

## 🎯 推奨対応順序

### 優先度1: 最重要（今週中）

```bash
# 最も複雑で危険なフックから順に
1. useMarkBookmarkAsRead.test.tsx       - 楽観的更新（158行）
2. useToggleFavoriteBookmark.test.tsx   - 楽観的更新（171行）
```

### 優先度2: 重要（今月中）

```bash
3. useMarkBookmarkAsUnread.test.tsx     - 楽観的更新
4. useGetRecentBookmarks.test.tsx       - シンプルなQuery
```

### 優先度3: テストアプローチ統一（来月）

```bash
5. labels/queries/api.test.ts 作成
6. labels/queries/api.ts からテスト移行
```

---

## 📋 テンプレート: React Queryフックのテスト

参考実装: `features/labels/hooks/useManageLabels.test.tsx`

```typescript
/**
 * useMarkBookmarkAsRead フックのテスト
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useMarkBookmarkAsRead } from "./useMarkBookmarkAsRead";

// API関数のモック
vi.mock("./api", () => ({
  markBookmarkAsRead: vi.fn(),
}));

describe("useMarkBookmarkAsRead", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  function createWrapper() {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  test("楽観的更新: 未読リストから削除される", async () => {
    // 初期データをセット
    queryClient.setQueryData(["bookmarks", "unread"], {
      bookmarks: [
        { id: 1, title: "Test", isRead: false },
        { id: 2, title: "Test2", isRead: false },
      ],
      totalUnread: 2,
      todayReadCount: 0,
    });

    const { result } = renderHook(() => useMarkBookmarkAsRead(), {
      wrapper: createWrapper(),
    });

    // mutateを実行
    act(() => {
      result.current.mutate(1);
    });

    // 楽観的更新でキャッシュが即座に更新されることを確認
    const unreadData = queryClient.getQueryData(["bookmarks", "unread"]);
    expect(unreadData.bookmarks).toHaveLength(1);
    expect(unreadData.bookmarks[0].id).toBe(2);
    expect(unreadData.totalUnread).toBe(1);
  });

  test("エラー時: キャッシュがロールバックされる", async () => {
    // ... エラーケースのテスト
  });
});
```

---

## 🔗 関連ドキュメント

- 📖 詳細分析: `docs/design/test-code-analysis-2025-11-16.md`
- 📋 サマリー: `FRONTEND_TEST_SUMMARY.md`
