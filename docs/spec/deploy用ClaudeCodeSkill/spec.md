# Spec: deploy用 Claude Code Skill

## 1. 機能の定義と境界

### 1.1 概要

yomimono プロジェクトにおける本番デプロイ作業を、インタラクティブにガイドするワークフロー型 Claude Code Skill。
ユーザーが `/deploy` コマンドを入力することで起動し、API → Frontend の順で本番環境へデプロイする。

### 1.2 Skill の種別

ワークフロー型 Skill として実装する:
- ファイル: `.claude/skills/deploy/SKILL.md`
- トリガー: `/deploy`
- CLAUDE.md の `user-invocable skills` セクションに登録する

---

## 2. デプロイ対象とスコープ

### 2.1 対象ターゲット（固定）

| 順序 | ターゲット | 自動化範囲 |
|------|-----------|-----------|
| 1 | API (Cloudflare Workers) | 全自動（バックアップ・マイグレーション・デプロイ） |
| 2 | Frontend (Cloudflare Workers) | 全自動（ビルド・デプロイ） |
| 3 | Extension (Chrome) | 案内テキストのみ（手動提出） |

デプロイ対象はユーザーに選ばせず、常に上記3ターゲットを固定順序で処理する。

### 2.2 対象外（やらないこと）

- デプロイ前の lint / test / typecheck / build の再実行（Lefthook が push 時に実施済み）
- Chrome DevTools MCP によるブラウザ動作確認
- Extension の Chrome Web Store 提出
- ステージング環境へのデプロイ
- ロールバック操作

---

## 3. 機能定義

### 3.1 事前状態チェック

デプロイ開始前に以下を確認する。条件を満たさない場合は処理を中断し、ユーザーに対処を促す。

| チェック項目 | 確認方法 | 失敗時の動作 |
|------------|---------|------------|
| 未コミットの変更がないこと | `git status` | 中断・案内 |
| ローカルブランチが push 済みであること | `git status` の "Your branch is up to date" | 中断・案内 |
| `CLOUDFLARE_API_TOKEN` が設定されていること | 環境変数の存在確認 | 中断・案内 |
| `CLOUDFLARE_ACCOUNT_ID` が設定されていること | 環境変数の存在確認 | 中断・案内 |

### 3.2 API デプロイフロー

以下の順序で実行する:

1. D1 データベースのバックアップ取得
   - `wrangler d1 export yomimono-db --remote --output ./backups/yomimono-db-{timestamp}.sql`
   - backups/ ディレクトリを作成してから実行する
   - バックアップ成功を確認してからマイグレーションへ進む

2. スキーマ更新チェック
   - `cd api && pnpm run db:generate` を実行
   - `git diff --exit-code -- api/drizzle/` でマイグレーションファイルに差分がないことを確認
   - 差分があった場合は中断し、ユーザーにコミットを促す（未コミットのスキーマ変更がある状態でデプロイしてはいけない）

3. D1 マイグレーション実行
   - `cd api && pnpm run migrate:prod:remote`
   - 毎回実行する（冪等性あり）

4. API デプロイ
   - `cd api && pnpm run deploy`

### 3.3 Frontend デプロイフロー

1. Frontend デプロイ（setup-deploy.sh を内包）
   - `cd frontend && pnpm run deploy`
   - deploy:setup → opennextjs-cloudflare build → opennextjs-cloudflare deploy の順に自動実行される

### 3.4 Extension 案内

自動処理なし。以下のテキストをユーザーに表示する:

- `cd extension && pnpm run build` でビルド
- `dist/` ディレクトリを Chrome Web Store Developer Dashboard へ手動提出
- または `chrome://extensions` でローカル読み込み（開発用）

---

## 4. インターフェース定義

### 4.1 入力

- コマンド: `/deploy`（引数なし）

### 4.2 出力

- 各ステップの実行状況をテキストで表示
- エラー発生時はエラー内容と対処方法を表示
- 完了時にデプロイ済みの Worker URL を表示

### 4.3 インタラクション

Skill 実行中にユーザーへ問い合わせる場面:

| タイミング | 問い合わせ内容 |
|-----------|-------------|
| 事前チェック失敗時 | 問題の説明と中断の確認 |
| バックアップ完了後 | 「バックアップ完了。マイグレーションを実行してよいか」の確認 |

---

## 5. 制約・非機能要件

### 5.1 データ保護

- D1 マイグレーション実行前に必ずバックアップを取得する
- バックアップ失敗時はデプロイを中断する（バックアップなしでのマイグレーション実行禁止）
- バックアップファイルの保存先: `backups/` ディレクトリ（リポジトリルート直下）
- バックアップファイル名: `yomimono-db-{YYYYMMDD-HHmmss}.sql`

### 5.2 デプロイ順序

API を必ず Frontend より先にデプロイする。
Frontend は API に Service Binding で依存しているため、逆順は許容しない。

### 5.3 中断条件

以下の条件が発生した場合、Skill は処理を中断しユーザーに通知する:
- 事前チェックの失敗
- バックアップの失敗
- `db:generate` 後に未コミットの差分が検出された
- デプロイコマンドの失敗

---

## 6. Skill ファイルの配置

```
.claude/skills/deploy/
└── SKILL.md    # Skill 本体（ワークフロー手順を記述）
```

CLAUDE.md への追記（user-invocable skills セクション）:
```
- deploy: yomimono プロジェクトの本番デプロイを実行する。API → Frontend → Extension の順に処理する。
```
