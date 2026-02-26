# Plan: deploy用 Claude Code Skill

## 実装チェックリスト

### Phase 1: 準備

- [ ] `backups/` ディレクトリを作成し、`.gitignore` に追加する
  - バックアップ SQL ファイルをリポジトリに含めないようにする
  - `backups/.gitkeep` を置いてディレクトリ自体は追跡する

### Phase 2: Skill ファイルの作成

- [ ] `.claude/skills/deploy/` ディレクトリを作成する
- [ ] `.claude/skills/deploy/SKILL.md` を作成する
  - フロントマター（name, description, metadata）を記述する
  - 以下のワークフロー手順を Markdown で記述する:
    1. 事前チェック
    2. API デプロイ（バックアップ → db:generate → マイグレーション → deploy）
    3. Frontend デプロイ
    4. Extension 案内

### Phase 3: SKILL.md の詳細内容

SKILL.md に含める各セクション:

- [ ] 事前チェックのルール
  - `git status` で未コミット変更がないことを確認
  - `git status` でローカルブランチが push 済みであることを確認
  - `CLOUDFLARE_API_TOKEN` 環境変数の存在確認
  - `CLOUDFLARE_ACCOUNT_ID` 環境変数の存在確認
  - いずれかが未達成なら中断し、対処を案内する

- [ ] D1 バックアップのルール
  - `wrangler d1 export yomimono-db --remote --output ./backups/yomimono-db-{timestamp}.sql` を実行
  - バックアップ失敗時は以降の処理をすべて中断する

- [ ] db:generate チェックのルール
  - `cd api && pnpm run db:generate` を実行
  - `git diff --exit-code -- api/drizzle/` を実行
  - 差分が検出された場合は中断し、「スキーマ変更がコミットされていない」旨を案内する

- [ ] D1 マイグレーションのルール
  - バックアップ完了後にユーザー確認を行う
  - 確認後 `cd api && pnpm run migrate:prod:remote` を実行する

- [ ] API デプロイのルール
  - `cd api && pnpm run deploy` を実行する

- [ ] Frontend デプロイのルール
  - `cd frontend && pnpm run deploy` を実行する
  - KV namespace の自動セットアップが内包されている旨を表示する

- [ ] Extension 案内のルール
  - 自動処理は行わず、手動提出の手順をテキストで表示する

- [ ] 完了メッセージのルール
  - デプロイ済みの Worker URL を表示する:
    - API: `https://effective-yomimono-api.ryosuke-horie37.workers.dev`
    - Frontend: `https://effective-yomimono.{account}.workers.dev`

### Phase 4: CLAUDE.md への登録

- [ ] プロジェクトルートの `CLAUDE.md` に user-invocable skills セクションへ追記する
  ```
  - deploy: yomimono プロジェクトの本番デプロイを実行する。API → Frontend の順にデプロイし、Extension の手動提出手順を案内する。
  ```

---

## 実装順序と依存関係

```
Phase 1（backups/ 準備）
    ↓
Phase 2-3（SKILL.md 作成）
    ↓
Phase 4（CLAUDE.md 登録）
```

Phase 1 は独立して先に完了させる。
Phase 2-3 は同時進行（SKILL.md 一枚を書き上げる）。
Phase 4 は SKILL.md 完成後に実施する。

---

## 懸念点・リスクと対処方針

### リスク1: `wrangler d1 export` の出力オプション

`wrangler d1 export` のオプション名（`--output`）が wrangler のバージョンによって異なる可能性がある。
→ 実装時に `wrangler d1 export --help` で確認し、正確なオプション名を使用する。

### リスク2: タイムスタンプ生成

SKILL.md 内でのタイムスタンプ生成は Bash コマンド（`date +%Y%m%d-%H%M%S`）で行う。
→ Bash ツールで実行するため問題なし。

### リスク3: CLAUDE.md の重複登録

既存の `user-invocable skills` セクションが存在するか確認が必要。
→ 実装前に CLAUDE.md を読んで既存セクションの有無を確認する。

### リスク4: backups/ ディレクトリのサイズ

長期間運用すると SQL ファイルが蓄積してディスクを圧迫する可能性がある。
→ Skill のドキュメントに「定期的な手動削除を推奨」と記載する（自動削除は範囲外）。
