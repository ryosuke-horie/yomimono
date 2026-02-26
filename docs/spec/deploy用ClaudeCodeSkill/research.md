# Research: deploy用 Claude Code Skill

## 概要

yomimono プロジェクトにおけるデプロイ作業を、Claude Code の Skill として定義する。
ユーザーが `/deploy` コマンドを実行することで、デプロイ対象の選択からデプロイ完了確認まで一連のフローをガイドする。

---

## 1. Claude Code Skill の仕組み

### 1.1 Skill の種類

Claude Code における Skill には2種類ある。

**ナレッジベース型 Skill**（例: `vercel-react-best-practices`）:
- `.claude/skills/{skill-name}/` にルールや知識を格納
- Claude がコーディング時に参照する知識ライブラリ
- SKILL.md + AGENTS.md + rules/ で構成される

**ワークフロー型 Skill**（例: `research-spec-plan`, `commit`）:
こっちを採用
- ユーザーが `/skill-name` でトリガー
- 手順を順番に実行するプロシージャ型
- Markdown ファイル一枚で完結することが多い
- `CLAUDE.md` の `user-invocable skills` に登録が必要

`deploy` は「ステップバイステップで対話しながらデプロイを行うワークフロー」が適切なため、ワークフロー型 Skill として設計する。

### 1.2 既存ワークフロー型 Skill の観察

`research-spec-plan` Skill を参照:
- Markdown 形式で手順を記述
- AskUserQuestion による確認・分岐
- ユーザーのレビュー待機ポイントを明示
- 重要なルール（やってはいけないこと）を末尾に記載

---

## 2. プロジェクトのデプロイ構成

### 2.1 デプロイターゲット一覧

| ターゲット | プラットフォーム | 自動化状況 |
|-----------|----------------|-----------|
| API | Cloudflare Workers (Hono + D1) | 手動（ローカル実行） |
| Frontend | Cloudflare Workers (Next.js + OpenNext) | 手動（ローカル実行） |
| Extension | Chrome Web Store | 手動（Zip 提出） |

### 2.2 API デプロイの詳細

コマンド:
```bash
cd api
pnpm run migrate:prod:remote  # スキーマ変更がある場合のみ
pnpm run deploy               # wrangler deploy --minify
```

事前チェック（Lefthook pre-push で自動実行済み）:
- `pnpm run lint`
- `pnpm run test`
- `pnpm run knip`
- OpenAPI 同期チェック（`pnpm run generate && git diff --exit-code -- openapi.yaml`）

デプロイ設定（wrangler.jsonc）:
- Worker 名: `effective-yomimono-api`
- D1 Database: `yomimono-db`（ID: `729de7ac-2aab-47a5-a92f-6e30dd610c9c`）
- minify オプション有効

### 2.3 Frontend デプロイの詳細

コマンド:
```bash
cd frontend
pnpm run deploy  # deploy:setup → opennextjs-cloudflare build → opennextjs-cloudflare deploy
```

`deploy:setup`（`setup-deploy.sh`）が行うこと:
1. `CLOUDFLARE_API_TOKEN` の存在確認
2. `CLOUDFLARE_ACCOUNT_ID` の存在確認
3. KV namespace（`NEXT_INC_CACHE_KV`）を Wrangler API 経由で検索または作成
4. `wrangler.jsonc` の `PLACEHOLDER_KV_NAMESPACE_ID` を実際の ID に置換

デプロイ設定（wrangler.jsonc）:
- Worker 名: `effective-yomimono`
- Service Binding: `API` → `effective-yomimono-api`
- KV: `NEXT_INC_CACHE_KV`（Next.js ISR キャッシュ用）
- 環境変数: `BFF_API_BASE_URL`

事前チェック（Lefthook pre-push で自動実行済み）:
- `pnpm run lint`
- `pnpm run test`
- `pnpm run typecheck`
- `pnpm run knip`
- `pnpm run build`
- Orval 同期チェック（`pnpm run check:orval`）

### 2.4 Extension デプロイの詳細

ビルドコマンド:
```bash
cd extension
pnpm run build  # mkdir -p dist && cp -r manifest.json background.js popup images dist/
```

現状:
- Chrome Web Store への自動デプロイは存在しない
- ビルド生成物（dist/）を手動で Chrome Web Store Dash に提出
- または `chrome://extensions` でローカル読み込み（開発時）

Extension には正式なデプロイ自動化がないため、Skill では「ビルドと検証」を担当する。

---

## 3. CI/CD 廃止の背景

以前は GitHub Actions による CI/CD を運用していたが廃止された:
- コミット `cde5d64`: "feat: GitHub Actions を廃止し Lefthook でローカルチェックに移行"
- コミット `31e1c8c`: "fix: CIのデプロイ時のマイグレーションを削除し、手動実行に変更"

現在の設計思想:
- **デプロイはローカルから手動実行**
- **品質チェックは Lefthook（push 時）が担保**
- **Claude Code Skill がデプロイ手順をガイド**

---

## 4. 環境要件

### 4.1 必要な環境変数

| 変数名 | 用途 | 対象 |
|--------|------|------|
| `CLOUDFLARE_API_TOKEN` | Wrangler 認証 | API + Frontend |
| `CLOUDFLARE_ACCOUNT_ID` | KV namespace 操作 | Frontend |

### 4.2 必要なツール

- `wrangler` CLI（Cloudflare Workers デプロイ）
- `pnpm`（パッケージ管理）
- Node.js（wrangler, opennextjs-cloudflare 実行環境）

---

## 5. デプロイフローにおける注意点

### 5.1 DBマイグレーション（API）
毎回実行して欲しい。
ただし実行前にD1のバックアップをとること データの消失には細心の注意を払いたい
必ずdrizzle generateをやって更新がないことをチェックする


D1 データベースへのマイグレーションは `pnpm run migrate:prod:remote` で実行するが:
- **デプロイのたびに実行してはいけない**（スキーマ変更がある場合のみ）
- マイグレーション実行後のロールバックは困難
- drizzle/（マイグレーションファイル）の差分で判断する

### 5.2 KV Namespace（Frontend）

`setup-deploy.sh` が自動で KV namespace を作成・設定するが:
- `wrangler.jsonc` を変更するため、変更後に `git diff` で確認が必要
- 本番と開発で別の namespace になっていることを確認する

### 5.3 Lefthook チェックの重複
Lefthookで検証済みならやらない

`git push` 時に Lefthook が pre-push チェックを実行する。
Skill 内で同じチェックを再実行するか否かは設計上の判断点:
- **再実行する**: 安全だが冗長（特に build は時間がかかる）
- **スキップする**: push 済みであれば不要だが、ローカル変更がある場合に危険

→ Skill では「最後のコミット・プッシュ済みか確認する」ことを優先し、個別チェックは省略可能とする設計が適切。

### 5.4 Extension の取り扱い
これは完全手動でOk

Chrome Web Store への提出は完全に手動プロセスであるため:
- Skill の範囲はビルドと検証まで
- Chrome Web Store への提出手順は案内テキストとして提示

---

## 6. 既存デプロイドキュメント

`docs/design/001_開発環境の仕様.md` に手動デプロイ手順が記述されている（詳細は別途確認）。
Skill はこのドキュメントを補完・置き換えるインタラクティブなガイドとなる。

---

## 7. Skill の設計方針（案）

### 7.1 Skill の種別: ワークフロー型

`/deploy` コマンドで起動し、以下のフローを対話的に実行する:

1. デプロイターゲットを確認（API / Frontend / Extension / すべて）　全てを固定でOK
2. 現在の git 状態を確認（未コミット変更、push 状態）
3. ターゲットごとの固有チェックを実行
4. デプロイコマンドを実行
5. 完了確認

### 7.2 考慮すべき設計上の問題

**問題1: デプロイ順序**
API と Frontend の両方をデプロイする場合、API を先にデプロイする必要がある（Frontend が API に Service Binding で依存しているため）。

**問題2: マイグレーション判定**
APIデプロイ時に D1 マイグレーションが必要かどうかを判定するロジックが必要。
`git diff origin/main -- api/drizzle/` で差分を確認するのが有効。

**問題3: デプロイの冪等性**
デプロイが失敗した場合のリトライ方針を明確にする必要がある（Wrangler のデプロイは基本的に冪等）。

**問題4: ブラウザ動作確認**
明示的に不要とする
CLAUDE.md に「API や UI を変更した場合は Chrome DevTools MCP で動作確認を行う」というルールがある。
Skill にこのチェックを組み込むべきかどうかを検討する。

---

## 8. 参考情報

- 既存 Skill の場所: `.claude/skills/vercel-react-best-practices/`
- Skill 登録場所（想定）: `.claude/skills/deploy/`
- CLAUDE.md の user-invocable skills セクションへの追記が必要
- デプロイコマンド参照元: `api/package.json`, `frontend/package.json`, `extension/package.json`
- wrangler 設定: `api/wrangler.jsonc`, `frontend/wrangler.jsonc`
