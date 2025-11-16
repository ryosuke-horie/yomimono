# Issue: コンポーネントテストの改善（フックモック削減）

## 優先度
🟡 中（品質向上）

## 概要
`BookmarkCard.test.tsx`等でReact Queryフックを完全にモック化しており、統合テストとしての価値が低下しています。

## 現状
```typescript
// BookmarkCard.test.tsx
vi.mock("../queries/useToggleFavoriteBookmark", () => ({
  useToggleFavoriteBookmark: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));
```

## 問題点
1. **統合テストとしての価値が低い**: 実際の動作を検証していない
2. **偽陽性のリスク**: フック実装が壊れてもテストは通る
3. **メンテナンスコスト**: フックのインターフェース変更時に複数ファイル修正が必要

## 提案
MSW（Mock Service Worker）を導入し、APIレベルでモック化する

### メリット
- フックは実際に動作する（より現実に近いテスト）
- APIレスポンスをモックするだけでよい
- フックの実装変更の影響を受けにくい

## 対応内容

### Phase 1: MSWのセットアップ
- [ ] MSWをインストール: `pnpm add -D msw`
- [ ] MSWのセットアップファイルを作成: `frontend/src/mocks/handlers.ts`
- [ ] テストセットアップに統合: `vitest.setup.ts`

### Phase 2: BookmarkCardテストの改善
- [ ] フックモックを削除
- [ ] MSWでAPIエンドポイントをモック
```typescript
// Before
vi.mock("../queries/useToggleFavoriteBookmark", () => ({...}));

// After
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.post('/api/bookmarks/:id/favorite', () => {
    return HttpResponse.json({ success: true });
  })
);
```

### Phase 3: 他のコンポーネントテストにも適用
- [ ] `BookmarksList.test.tsx` を改善
- [ ] 他のコンポーネントでも同様のパターンを適用

## 参考
- [MSW公式ドキュメント](https://mswjs.io/)
- [React Query + MSW の統合](https://tkdodo.eu/blog/testing-react-query#mock-service-worker)

## 受け入れ基準
- [ ] MSWがプロジェクトに導入されている
- [ ] `BookmarkCard.test.tsx`のフックモックが削除されている
- [ ] MSWでAPIをモックしている
- [ ] すべてのテストが合格する
- [ ] テストがより統合テストに近い形になっている

## 備考
この改善により、コンポーネントテストの信頼性が向上し、リファクタリング時の安全性が高まります。
