---
name: deploy
description: yomimono プロジェクトの本番デプロイを実行する。API → Frontend の順にデプロイし、Extension の手動提出手順を案内する。/deploy コマンドでトリガーする。
disable-model-invocation: true
---

# Deploy ワークフロー

yomimono プロジェクトの本番デプロイを実行するワークフロー。
API → Frontend の順に自動デプロイし、Extension の手動提出手順を案内する。

---

## 準備

このスキルが呼び出されたら、以下の順序で作業を進める。
各ステップで問題が発生した場合は処理を中断し、ユーザーに原因と対処方法を伝える。

---

## Step 1: 事前チェック

以下をすべて確認する。1つでも失敗したら処理を中断し、対処を案内する。

1. 現在のブランチが `main` であることを確認する
   ```bash
   git branch --show-current
   ```
   - `main` 以外の場合: 「デプロイは main ブランチからのみ実行できます。現在のブランチ: {branch}。main ブランチに切り替えてから再実行してください。」と案内して中断する

2. 未コミットの変更がないことを確認する
   ```bash
   git status
   ```
   - 変更がある場合: 「未コミットの変更があります。コミットまたはスタッシュしてから再実行してください。」と案内して中断する

3. ローカルブランチが push 済みであることを確認する
   - `git status` の出力に "Your branch is up to date" が含まれているか確認する
   - 未 push の場合: 「リモートへ push されていないコミットがあります。`git push` 後に再実行してください。」と案内して中断する

4. `CLOUDFLARE_API_TOKEN` が設定されていることを確認する
   ```bash
   echo $CLOUDFLARE_API_TOKEN
   ```
   - 空の場合: 「CLOUDFLARE_API_TOKEN が設定されていません。環境変数を設定してから再実行してください。」と案内して中断する

5. `CLOUDFLARE_ACCOUNT_ID` が設定されていることを確認する
   ```bash
   echo $CLOUDFLARE_ACCOUNT_ID
   ```
   - 空の場合: 「CLOUDFLARE_ACCOUNT_ID が設定されていません。環境変数を設定してから再実行してください。」と案内して中断する

全チェック通過後、「事前チェック OK。デプロイを開始します。」と表示して次のステップへ進む。

---

## Step 2: API デプロイ

### Step 2-1: D1 データベースのバックアップ

データ消失を防ぐため、マイグレーション前に必ずバックアップを取得する。

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
npx wrangler d1 export yomimono-db --remote --output ./backups/yomimono-db-${TIMESTAMP}.sql
```

（プロジェクトルートから実行する）

- バックアップに失敗した場合は処理を中断する。バックアップなしでのマイグレーション実行は禁止。
- バックアップ成功後、「バックアップ完了: backups/yomimono-db-{timestamp}.sql」と表示する。

### Step 2-2: スキーマ更新チェック

未コミットのスキーマ変更がある状態でデプロイしないように確認する。

```bash
cd api
pnpm run db:generate
git diff --exit-code -- drizzle/
```

- `git diff` で差分が検出された場合: 「スキーマ変更がコミットされていません。`pnpm run db:generate` の結果をコミットしてから再実行してください。」と案内して中断する。
- 差分がなければ次へ進む。

### Step 2-3: D1 マイグレーション実行

バックアップ完了を確認したうえで AskUserQuestion を使いユーザーに確認する:

「D1 バックアップが完了しました。本番データベースへのマイグレーションを実行してよいですか？」

確認が取れたら実行する:

```bash
cd api
pnpm run migrate:prod:remote
```

### Step 2-4: API デプロイ

```bash
cd api
pnpm run deploy
```

完了後「API デプロイ完了」と表示する。

---

## Step 3: Frontend デプロイ

```bash
cd frontend
pnpm run deploy
```

内部で以下が自動実行される:
1. `deploy:setup`（setup-deploy.sh）: KV namespace の作成・設定
2. `opennextjs-cloudflare build`: ビルド
3. `opennextjs-cloudflare deploy`: デプロイ

完了後「Frontend デプロイ完了」と表示する。

---

## Step 4: Extension 案内

自動処理は行わない。以下のテキストをユーザーに表示する:

---

Extension（Chrome 拡張機能）のデプロイは手動です。以下の手順で行ってください。

1. ビルド:
   ```bash
   cd extension
   pnpm run build
   ```

2. `dist/` ディレクトリを Chrome Web Store Developer Dashboard へ提出する
   - または `chrome://extensions` で「パッケージ化されていない拡張機能を読み込む」からローカル読み込みする（開発用）

---

## Step 5: 完了

すべての処理が完了したら、以下を表示する:

```
デプロイ完了

- API:      https://effective-yomimono-api.ryosuke-horie37.workers.dev
- Frontend: Cloudflare Dashboard で確認してください
- Extension: 手動提出が必要です（Step 4 を参照）

バックアップファイル: backups/yomimono-db-{timestamp}.sql
（不要になったら手動で削除してください）
```

---

## 重要なルール

- バックアップなしでマイグレーションを実行してはならない
- API より先に Frontend をデプロイしてはならない（API → Frontend の順を厳守）
- 事前チェックを省略してはならない
- Extension の Chrome Web Store 提出は自動化されていない（手動作業）
- ブラウザ動作確認（Chrome DevTools MCP）はこの Skill のスコープ外
