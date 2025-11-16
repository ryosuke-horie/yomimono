# Issue: React Queryフックのテスト追加（bookmarks機能）

## 優先度
🔴 高（緊急）

## 概要
bookmarks機能のReact Queryフック（4つ）がテストされておらず、楽観的更新の複雑なロジックがノーテスト状態になっています。バグリスクが極めて高い状態です。

## 現状
以下のフックにテストが存在しません：

```
features/bookmarks/queries/
├── useGetRecentBookmarks.ts        ❌ テストなし（15行）
├── useMarkBookmarkAsRead.ts        ❌ テストなし（158行、複雑な楽観的更新）
├── useMarkBookmarkAsUnread.ts      ❌ テストなし（楽観的更新）
└── useToggleFavoriteBookmark.ts    ❌ テストなし（171行、複雑な楽観的更新）
```

対照的に、labels機能は完備：
```
features/labels/hooks/
├── useLabels.test.tsx              ✅ テストあり
└── useManageLabels.test.tsx        ✅ テストあり
```

## 問題点
1. **楽観的更新のロジック**が複雑（3つのキャッシュを同時更新）
2. **エラー時のロールバック処理**が実装されているがテストされていない
3. **条件分岐が多い**（お気に入り追加/削除の判定等）
4. これらがノーテスト状態 → バグリスク🔴🔴🔴

## 対応内容
以下のテストファイルを作成：

### Phase 1（今週中）
- [ ] `features/bookmarks/queries/useMarkBookmarkAsRead.test.tsx`
  - 楽観的更新の検証（未読リストから削除）
  - エラー時のロールバック検証
  - 複数キャッシュの同時更新検証

- [ ] `features/bookmarks/queries/useToggleFavoriteBookmark.test.tsx`
  - お気に入り追加/削除の切り替え検証
  - 楽観的更新の検証
  - エラー時のロールバック検証

### Phase 2（今月中）
- [ ] `features/bookmarks/queries/useMarkBookmarkAsUnread.test.tsx`
  - 未読に戻す処理の検証
  - 楽観的更新の検証

- [ ] `features/bookmarks/queries/useGetRecentBookmarks.test.tsx`
  - データ取得の検証
  - エラーハンドリングの検証

## 参考実装
`features/labels/hooks/useManageLabels.test.tsx` を参考にする

## テストで確認すべき項目
- QueryClientとの統合
- 楽観的更新のロジック（onMutate）
- エラー時のロールバック（onError）
- 成功時の処理（onSuccess）
- 再同期処理（onSettled）
- 複数キャッシュの同時更新
- エッジケース（データなし、不正なID等）

## 受け入れ基準
- [ ] 4つのフック全てにテストファイルが作成されている
- [ ] 正常系・異常系のテストケースがカバーされている
- [ ] 楽観的更新のロジックが検証されている
- [ ] エラー時のロールバックが検証されている
- [ ] すべてのテストが合格する
- [ ] カバレッジが目標値（80%）を満たす

## 関連
- labels機能のテスト: `features/labels/hooks/useManageLabels.test.tsx`
