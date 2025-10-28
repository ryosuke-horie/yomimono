# MCPサーバー設計

## 目的
MCPサーバー (`mcp` パッケージ) は、Effective Yomimono のラベリング業務を支援するクライアント（Claude Desktop など）から API への操作を仲介する。ここでは現行アーキテクチャの把握と、Vitest を利用したテスト戦略、および改善候補を整理する。

## システム構成概要
- **通信レイヤー**: `src/index.ts` で `@modelcontextprotocol/sdk` の `McpServer` を生成し、`StdioServerTransport` に接続してリクエストループを保持する。
- **ツール定義層**: `src/tools.ts` で6つのツール (`getUnlabeledArticles`, `getLabels`, `assignLabel`, `getLabelById`, `assignLabelsToMultipleArticles`, `getUnreadBookmarks`) を登録し、それぞれが API クライアント経由で外部 API を呼び出す。
- **APIクライアント層**: `src/lib/apiClient.ts` が HTTP リクエストを担い、`fetch` と `zod` 検証でレスポンスを整形する。エンドポイントは `/api/bookmarks/*` および `/api/labels/*`。
- **設定**: 環境変数 `API_BASE_URL` を必須とし、`tsconfig.json` で ESNext 向けのビルドと `build/` への出力を指定。`vitest.config.ts` は Node 環境・`src/**/*.ts` のカバレッジ収集を設定。

## データフロー
1. クライアントが MCP ツールを呼び出す。
2. ツールハンドラが `apiClient` の該当メソッドを実行。
3. `apiClient` は `API_BASE_URL` を組み立てて `fetch` し、`zod` でレスポンスを検証。
4. 成功時はライトウェイトな DTO を返却し、MCP プロトコルのレスポンスとして文字列化される。失敗時は例外を握りつぶさず `console.error` とエラーメッセージを返す。

## テスト方針 (Vitest)
### 単体テスト対象
- `apiClient` 各関数: `fetch` をモックし、成功レスポンス・バリデーション失敗・HTTP エラーの分岐を検証する。
- ツール登録 (`server.tool`): `apiClient` をスパイし、入力検証やエラー伝搬を確認する軽量テストを想定。

### 実装ガイドライン
- `vitest` を `devDependencies` に追加し、`"test": "vitest run"` スクリプトを `package.json` に定義する。（済）
- テストファイル配置は `src/lib/apiClient.test.ts` や `src/tools.test.ts` など `src` 直下に配置し、`vitest.config.ts` の `include` パターンに合致させる。
- `fetch` モックには `vi.stubGlobal("fetch", ...)` を利用し、テスト毎にリセットする。`beforeEach` / `afterEach` で状態をクリアし、副作用を回避。
- レスポンス検証では `safeParse` の `error.message` をアサートすることで実装依存を避ける。

### カバレッジおよび品質確認
- 追加するテストで `apiClient.ts` の主要分岐を網羅し、将来的にはツール層も含めた 80% 以上のライン・ブランチカバレッジを目標とする。
- CI 運用を想定し `pnpm run test -- --run` を基本コマンドとする。カバレッジレポートは `coverage/` に出力されるため `.gitignore` 済みであることを再確認する。

## アーキテクチャ改善候補
1. **API クライアントの抽象化拡張**  
   - `requestJson` / `requestVoid` ヘルパーを導入し、HTTP エラー整形と Zod 検証を共通化済み。今後はタイムアウト制御やリトライ、構造化ログの注入などを拡張ポイントとして検討する。
2. **環境変数バリデーション**  
   - `dotenv` 初期化直後に `API_BASE_URL` の存在チェックを実行し、サーバー起動前に失敗させることで運用時の事故を防ぐ。
3. **テレメトリの整備**  
   - バッチ付与 (`assignLabelsToMultipleArticles`) では処理件数やスキップ件数をログに残しているが、構造化ログや計測に発展させる余地がある。
4. **ツール応答形式の標準化**  
   - 現在はテキスト JSON 文字列を返している。将来的には `type: "json"` レスポンスや独自フォーマットを検討し、クライアントでのパース負荷を軽減する。

## 今後のタスク
- 追加済みのサンプルテストを拡張し、ツール層のエッジケースやリトライ対象例外をカバーする。
- 改善項目（リトライ・構造化ログ等）の試行結果を ADR もしくは設計書に追記し、合意形成を進める。
