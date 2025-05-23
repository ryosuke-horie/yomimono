# RSS CRON バッチ動作確認ガイド

## 概要
このドキュメントは、RSS読み込み機能のCRONバッチ処理の動作確認方法とトラブルシューティングについて説明します。

## 実装状況

### 現在の構成
- **CRONトリガー**: wrangler.jsonで `0 0 * * *` (毎日0時)に設定
- **バッチWorker**: `src/workers/rssBatch.ts` に実装
- **メインエントリポイント**: `src/index.ts` に scheduled ハンドラを追加

### 主要コンポーネント
1. **RSSBatchProcessor**: バッチ処理の全体管理
2. **FeedProcessor**: 個別フィードの処理
3. **バッチログ**: `rss_batch_logs`テーブルで処理履歴を記録

## 動作確認方法

### 1. ローカル環境での確認

#### 手動実行エンドポイント
開発環境では、以下のエンドポイントから手動でバッチを実行できます：

```bash
# バッチを手動実行
curl -X POST http://localhost:8787/api/dev/rss-batch/run

# バッチログを確認
curl http://localhost:8787/api/dev/batch-logs

# 最新のブックマークを確認
curl http://localhost:8787/api/dev/recent-bookmarks
```

#### Wranglerでのローカル実行
```bash
cd api
npm run dev

# 別ターミナルでバッチを手動実行
curl -X POST http://localhost:8787/api/dev/rss-batch/run
```

### 2. 本番環境での確認

#### デプロイ
```bash
cd api
npm run deploy
```

#### ログの確認
```bash
# Cloudflare Dashboardでログを確認
# または wrangler tail を使用
wrangler tail
```

#### CRONトリガーの確認
Cloudflare Dashboardで以下を確認：
1. Workers & Pages > あなたのWorker > Triggers
2. Cron Triggersセクションで `0 0 * * *` が設定されていることを確認

### 3. バッチ処理の検証ポイント

#### 必須確認項目
- [ ] RSSフィードがアクティブ（`is_active = true`）に設定されているか
- [ ] フィードURLが有効でアクセス可能か
- [ ] `scheduled` ハンドラが `index.ts` でエクスポートされているか
- [ ] データベース接続が正常か

#### ログ確認
```sql
-- バッチ実行履歴を確認
SELECT * FROM rss_batch_logs ORDER BY started_at DESC LIMIT 10;

-- フィード毎の処理状況を確認
SELECT 
  rf.name as feed_name,
  rbl.status,
  rbl.items_fetched,
  rbl.items_created,
  rbl.error_message,
  rbl.started_at,
  rbl.finished_at
FROM rss_batch_logs rbl
JOIN rss_feeds rf ON rbl.feed_id = rf.id
ORDER BY rbl.started_at DESC;
```

## トラブルシューティング

### CRONが実行されない場合

1. **scheduled ハンドラの確認**
   ```typescript
   // src/index.ts で以下が設定されているか確認
   export default {
     fetch: (request: Request, env: Env) => { ... },
     scheduled: rssBatch.scheduled,
   };
   ```

2. **wrangler.json の確認**
   ```json
   {
     "triggers": {
       "crons": ["0 0 * * *"]
     }
   }
   ```

3. **デプロイの確認**
   ```bash
   # 最新のコードがデプロイされているか確認
   wrangler publish
   ```

### バッチは実行されるが記事が取得されない場合

1. **アクティブなフィードの確認**
   ```sql
   SELECT * FROM rss_feeds WHERE is_active = true;
   ```

2. **フィードURLの検証**
   ```bash
   # フィードが取得可能か確認
   curl -I "フィードURL"
   ```

3. **エラーログの確認**
   ```sql
   SELECT * FROM rss_batch_logs 
   WHERE status = 'error' 
   ORDER BY started_at DESC;
   ```

### パフォーマンスの問題

1. **処理時間の確認**
   ```sql
   SELECT 
     feed_id,
     TIMESTAMPDIFF(SECOND, started_at, finished_at) as duration_seconds
   FROM rss_batch_logs
   WHERE finished_at IS NOT NULL
   ORDER BY duration_seconds DESC;
   ```

2. **並行処理の調整**
   - `src/workers/rssBatch.ts` で同時処理数を調整
   - デフォルトは10フィード同時処理

## 監視とアラート

### メトリクス
- バッチ実行回数
- 成功/失敗率
- 平均処理時間
- 取得記事数

### 推奨アラート設定
1. バッチが24時間以上実行されていない
2. エラー率が50%を超える
3. 処理時間が5分を超える

## ベストプラクティス

1. **フィードの管理**
   - 不要なフィードは `is_active = false` に設定
   - 長期間エラーが続くフィードは無効化を検討

2. **ログの定期確認**
   - 週次でバッチログを確認
   - エラーパターンを分析

3. **スケーリング**
   - フィード数が増えた場合は並行処理数を調整
   - 必要に応じてQueue APIの導入を検討

## 関連ドキュメント
- [バッチ処理設計](./07_バッチ処理設計.md)
- [API設計](./04_API設計.md)
- [データモデル](./03_データモデル.md)