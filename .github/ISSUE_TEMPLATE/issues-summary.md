# フロントエンドテストコード整理 - Issue一覧

フロントエンドテストコードの調査結果に基づき、以下の改善Issueを作成します。

## 📊 調査結果サマリー

**テスト状況**: 18ファイル、163テスト、合格率100%

**APIテスト比較**:
| Feature | API関数 | React Queryフック | テスト方式 |
|---------|--------|------------------|----------|
| bookmarks | ✅ 6/6 | ❌ 0/4 | 専用ファイル |
| labels | ✅ 5/5 | ✅ 2/2 | import.meta.vitest |

## 📋 作成するIssue一覧

### 🔴 優先度: 高（緊急対応）

#### Issue #1: React Queryフックのテスト追加（bookmarks機能）
**ファイル**: `issue-01-bookmark-hooks-testing.md`

**概要**: bookmarks機能のReact Queryフック（4つ）がテストされておらず、楽観的更新の複雑なロジックがノーテスト状態。バグリスク極めて高い。

**対応内容**:
- `useMarkBookmarkAsRead.test.tsx` の作成（最優先）
- `useToggleFavoriteBookmark.test.tsx` の作成（最優先）
- `useMarkBookmarkAsUnread.test.tsx` の作成
- `useGetRecentBookmarks.test.tsx` の作成

**目標**: 今週～今月中

---

### 🟡 優先度: 中（重要）

#### Issue #2: テストアプローチの統一（API関数テスト）
**ファイル**: `issue-02-test-approach-unification.md`

**概要**: bookmarksとlabelsで異なるテスト手法を使用。開発効率・保守性に影響。

**対応内容**:
- `features/labels/queries/api.test.ts` の作成
- `api.ts`からテストコードを移行
- import.meta.vitestの削除

**目標**: 今月中

---

#### Issue #3: コンポーネントテストの改善（フックモック削減）
**ファイル**: `issue-03-component-test-improvement.md`

**概要**: コンポーネントテストでReact Queryフックを完全モック化しており、統合テストとしての価値が低い。

**対応内容**:
- MSWの導入とセットアップ
- `BookmarkCard.test.tsx`の改善
- フックモックの削減

**目標**: 来月

---

### 🟢 優先度: 低（クリーンアップ）

#### Issue #4: スナップショットテストの見直し
**ファイル**: `issue-04-snapshot-test-reduction.md`

**概要**: スナップショットテストの過度な使用により、メンテナンスコストが高く、意図が不明確。

**対応内容**:
- `Button.test.tsx`のスナップショット削減
- `Toast.snapshot.test.tsx`の見直し
- 明示的なアサーションへの置き換え

**目標**: 来月以降

---

#### Issue #5: テストユーティリティの整備とコード規約統一
**ファイル**: `issue-05-test-utilities-and-conventions.md`

**概要**: テストデータの重複定義や、コード規約の不統一により保守性が低下。

**対応内容**:
- モックデータファクトリの作成
- テスト説明の日本語統一
- test/itの統一
- beforeEachの統一

**目標**: 来月以降

---

## 🎯 推奨対応順序

1. **Issue #1** (🔴緊急): React Queryフックのテスト追加
   - 最もリスクが高いため最優先で対応

2. **Issue #2** (🟡重要): テストアプローチの統一
   - 今後の開発効率に影響するため早めに対応

3. **Issue #3** (🟡重要): コンポーネントテストの改善
   - テスト品質向上のため対応

4. **Issue #4** (🟢低): スナップショットテスト見直し
   - 時間があれば対応

5. **Issue #5** (🟢低): コード規約統一
   - クリーンアップとして対応

## 📝 各Issueの詳細

各Issueの詳細は個別のマークダウンファイルを参照してください:
- `issue-01-bookmark-hooks-testing.md`
- `issue-02-test-approach-unification.md`
- `issue-03-component-test-improvement.md`
- `issue-04-snapshot-test-reduction.md`
- `issue-05-test-utilities-and-conventions.md`

## 💡 備考

- 各IssueにはCI/CDが通る適切な分量でタスクを分割しています
- 受け入れ基準を明確に定義しています
- 参考実装やコード例を含めています
- 優先度に基づいて段階的に対応できるよう設計しています
