# Issue: テストアプローチの統一（API関数テスト）

## 優先度
🟡 中（重要）

## 概要
bookmarksとlabelsで同じAPI関数のテストに異なる手法を使用しており、開発者の混乱やメンテナンスコストの増加を招いています。

## 現状
| Feature | テスト方式 | ファイル |
|---------|-----------|---------|
| bookmarks | 専用テストファイル | `queries/api.test.ts` |
| labels | import.meta.vitest | `queries/api.ts`（ファイル内） |

## 問題点
1. **開発者の混乱**: どちらの方式で書くべきか不明確
2. **コードレビューの負担増加**: 2つの異なるパターンをレビュー
3. **メンテナンスコスト**: 統一されていないと変更時の影響範囲が読みにくい

## 提案
**専用テストファイル方式に統一**することを推奨

### 理由
- チームメンバーが多い場合、分離した方が並行作業しやすい
- import.meta.vitestはViteに依存（ツール変更時のリスク）
- 既存の多くが専用ファイル方式（bookmarks, components等）

## 対応内容
labels機能のテストを専用ファイルに移行：

- [ ] `features/labels/queries/api.test.ts` を新規作成
- [ ] `features/labels/queries/api.ts` から `import.meta.vitest` ブロックのテストコードを抽出
- [ ] 新しいテストファイルにコードを移動
- [ ] テストが全て通ることを確認
- [ ] 元のファイル（`api.ts`）からテストコードを削除
- [ ] `/// <reference types="vitest" />` も削除

## 移行手順
1. 新しい `api.test.ts` ファイルを作成
2. 以下の構造でテストを移行：
```typescript
import { beforeEach, describe, expect, test, vi } from "vitest";
import * as api from "./api";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ラベルAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ここに既存のテストを移動
  test("fetchLabels: 正常にラベル一覧を取得する", async () => {
    // ...
  });
  // ... 残りのテスト
});
```

## 受け入れ基準
- [ ] `features/labels/queries/api.test.ts` が作成されている
- [ ] 既存の全テストケースが新ファイルに移行されている
- [ ] すべてのテストが合格する（163テスト → 163テスト、変わらず）
- [ ] `api.ts` からテストコードが削除されている
- [ ] `api.ts` が純粋な実装ファイルになっている
- [ ] カバレッジが維持されている

## 備考
この統一により、今後新しいfeatureを追加する際のテスト方針が明確になります。
