# Issue: スナップショットテストの見直し

## 優先度
🟢 低（クリーンアップ）

## 概要
`Button.test.tsx`等でスナップショットテストを過度に使用しており、メンテナンスコストが高く、テストの意図が不明確になっています。

## 現状
```typescript
// Button.test.tsx
test("デフォルトスタイルのスナップショット", () => {
  const { container } = render(<Button>デフォルトボタン</Button>);
  expect(container).toMatchSnapshot(); // ❌ 何をテストしたいのか不明
});
```

## 問題点
1. **脆弱**: スタイル変更のたびに更新が必要
2. **レビュー困難**: スナップショット差分は見づらい
3. **意図不明**: 何を保証したいのか不明確

## 提案
スナップショットテストを減らし、明示的なアサーションに置き換える

## 対応内容

### Button.test.tsx の改善
```typescript
// Before: スナップショットテスト
test("デフォルトスタイルのスナップショット", () => {
  const { container } = render(<Button>ボタン</Button>);
  expect(container).toMatchSnapshot();
});

// After: 明示的なテスト
test("デフォルトスタイルが適用される", () => {
  render(<Button>ボタン</Button>);
  const button = screen.getByRole("button");
  expect(button).toHaveClass("bg-blue-500", "text-white");
  expect(button).not.toBeDisabled();
});

test("variantとsizeが正しく適用される", () => {
  render(<Button variant="secondary" size="lg">ボタン</Button>);
  const button = screen.getByRole("button");
  expect(button).toHaveClass("bg-gray-500", "text-lg");
});
```

### Toast.snapshot.test.tsx の削減
- スナップショットテストを最小限に削減
- または完全に削除し、`Toast.test.tsx`に統合

## 対応タスク
- [ ] `Button.test.tsx`: スナップショット → プロパティテストに変更
- [ ] `Toast.snapshot.test.tsx`: 最小限に削減または削除
- [ ] 他のスナップショットテストも確認

## 受け入れ基準
- [ ] スナップショットテストが最小限に削減されている
- [ ] 明示的なアサーションでテストの意図が明確
- [ ] すべてのテストが合格する
- [ ] テストカバレッジが維持されている

## 備考
必要最小限のスナップショットテストは残してもよい（例: 複雑なマークアップ構造の全体像を保証したい場合）
