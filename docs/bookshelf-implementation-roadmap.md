# 本棚機能実装ロードマップ

## 実装優先順位と見積もり

### 🎯 Phase 1: MVP実装（2-3週間）

#### Week 1: データベース基盤
- [ ] マイグレーションファイル作成
  - `books`テーブル
  - `book_tags`テーブル
  - インデックス設計
- [ ] Drizzle ORMスキーマ定義
- [ ] Repository層実装
  - `BookRepository`
  - `BookTagRepository`

#### Week 2: API実装
- [ ] 基本CRUD APIエンドポイント
  - `POST /api/bookshelf` - 本の追加
  - `GET /api/bookshelf` - 一覧取得
  - `GET /api/bookshelf/:id` - 詳細取得
  - `PUT /api/bookshelf/:id` - 更新
  - `DELETE /api/bookshelf/:id` - 削除
- [ ] バリデーション実装
- [ ] エラーハンドリング

#### Week 3: 基本UI実装
- [ ] 本棚一覧ページ
  - リストビュー
  - 基本的なフィルター（タイプ、ステータス）
- [ ] 本の追加フォーム
- [ ] 本の詳細ページ（読み取り専用）

### 📈 Phase 2: 進捗管理機能（1-2週間）

#### Week 4: 進捗トラッキング
- [ ] 進捗更新API
  - `PATCH /api/bookshelf/:id/progress`
  - `PATCH /api/bookshelf/:id/status`
- [ ] 読書セッション記録
  - `reading_sessions`テーブル追加
  - セッション記録API
- [ ] UI改善
  - 進捗バー表示
  - ステータス変更UI
  - 読書時間記録

### 🏷️ Phase 3: 整理・分類機能（2週間）

#### Week 5: タグとフィルター
- [ ] タグ管理機能
  - タグ追加・削除API
  - タグによるフィルター
- [ ] 高度なフィルター機能
  - 複数条件での絞り込み
  - 検索機能実装

#### Week 6: 読書リスト
- [ ] 読書リスト機能
  - `reading_lists`テーブル追加
  - リストCRUD API
  - リストへの本の追加・削除
- [ ] UIでのリスト管理
  - リスト作成・編集
  - ドラッグ&ドロップでの並び替え

### 📊 Phase 4: 統計・分析機能（2週間）

#### Week 7: 統計ダッシュボード
- [ ] 統計API実装
  - 読書統計集計
  - 月別・年別集計
- [ ] ダッシュボードUI
  - グラフ表示（Chart.js）
  - 統計サマリー

#### Week 8: 高度な機能
- [ ] 推薦機能
- [ ] データエクスポート（CSV/JSON）
- [ ] 外部API連携準備

## 技術スタック詳細

### バックエンド
```typescript
// 使用技術
- Hono (APIフレームワーク)
- Drizzle ORM
- Cloudflare D1 (データベース)
- Zod (バリデーション)

// ディレクトリ構造
api/
├── src/
│   ├── routes/
│   │   ├── bookshelf.ts
│   │   └── reading-lists.ts
│   ├── services/
│   │   ├── BookshelfService.ts
│   │   └── ReadingListService.ts
│   ├── repositories/
│   │   ├── BookRepository.ts
│   │   └── ReadingListRepository.ts
│   └── db/
│       └── schema/
│           └── bookshelf.ts
```

### フロントエンド
```typescript
// 使用技術
- Next.js 14 (App Router)
- TailwindCSS
- Tanstack Query
- Zustand (状態管理)

// ディレクトリ構造
frontend/
├── app/
│   └── bookshelf/
│       ├── page.tsx
│       ├── [id]/
│       │   └── page.tsx
│       └── lists/
│           └── page.tsx
├── features/
│   └── bookshelf/
│       ├── components/
│       │   ├── BookCard.tsx
│       │   ├── BookList.tsx
│       │   ├── BookForm.tsx
│       │   └── ProgressBar.tsx
│       ├── hooks/
│       │   ├── useBooks.ts
│       │   └── useBookProgress.ts
│       └── types/
│           └── book.ts
```

## 開発環境セットアップ

### 1. データベースマイグレーション
```bash
# 開発環境
cd api
npm run generate:bookshelf  # マイグレーションファイル生成
npm run migrate:development  # 開発環境に適用

# 本番環境
npm run migrate:production
```

### 2. 環境変数設定
```env
# 外部API（将来的な実装用）
GOOGLE_BOOKS_API_KEY=xxx
GITHUB_API_TOKEN=xxx
```

## テスト戦略

### ユニットテスト
- Repository層: データベース操作の正確性
- Service層: ビジネスロジックの妥当性
- API層: エンドポイントの動作確認

### 統合テスト
- API全体の動作確認
- データベーストランザクション
- エラーハンドリング

### E2Eテスト
- 本の追加から読了までのフロー
- 進捗更新の動作確認
- フィルター・検索機能

## パフォーマンス最適化

### データベース
- 適切なインデックス設計
- N+1問題の回避
- ページネーション実装

### フロントエンド
- 仮想スクロール（大量の本を表示する場合）
- 画像の遅延読み込み
- キャッシュ戦略（Tanstack Query）

## モニタリング

### メトリクス
- API応答時間
- エラー率
- 機能利用率

### ログ
- エラーログ
- ユーザーアクション
- パフォーマンスログ

## リリース計画

### Phase 1リリース（MVP）
- 基本的な本棚機能
- 内部テスト実施
- フィードバック収集

### Phase 2リリース
- 進捗管理機能追加
- ベータユーザーへの公開

### Phase 3リリース
- 整理・分類機能追加
- 全ユーザーへの公開

### Phase 4リリース
- 統計・分析機能追加
- プロモーション実施

## 成功の定義

### 短期（3ヶ月）
- [ ] 100冊以上の本が登録される
- [ ] アクティブユーザーの30%が利用
- [ ] 週次での進捗更新が50件以上

### 中期（6ヶ月）
- [ ] 500冊以上の本が登録される
- [ ] 読了率20%以上
- [ ] ユーザー満足度4.0/5.0以上

### 長期（1年）
- [ ] 1000冊以上の本が登録される
- [ ] 外部API連携による自動情報取得
- [ ] コミュニティ機能（レビュー、推薦）の追加

## リスク管理

| リスク | 対策 | 優先度 |
|--------|------|--------|
| スコープの肥大化 | MVPを明確に定義し、段階的リリース | 高 |
| パフォーマンス劣化 | 早期からの性能テスト実施 | 高 |
| 既存機能との競合 | UIでの明確な区別、ユーザーガイド作成 | 中 |
| 外部API制限 | キャッシュ戦略、フォールバック実装 | 低 |

## 次のステップ

1. **設計レビュー**: ステークホルダーとの設計確認
2. **技術検証**: 外部API連携のPOC作成
3. **開発開始**: Phase 1の実装着手
4. **定期レビュー**: 週次での進捗確認とフィードバック反映