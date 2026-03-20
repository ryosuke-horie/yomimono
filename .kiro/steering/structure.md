# Structure Context

## リポジトリ構成

モノレポ構成で、各パッケージが独立した package.json を持つ。

```
api/          # Hono API バックエンド
frontend/     # Next.js フロントエンド
extension/    # Chrome 拡張機能
docs/         # 設計・調査ドキュメント
```

## API アーキテクチャ (レイヤードパターン)

```
routes/        -> HTTP ハンドラ (Hono ルート定義)
services/      -> ビジネスロジック
repositories/  -> データアクセス (Drizzle ORM)
interfaces/    -> 型定義 (リポジトリインターフェース等)
db/schema.ts   -> Drizzle スキーマ定義
exceptions/    -> カスタムエラークラス
openapi/       -> OpenAPI スペック生成
```

依存方向: routes -> services -> repositories -> db

リポジトリ層はインターフェースで抽象化し、サービス層から具象実装に依存しない。

## フロントエンドアーキテクチャ (機能ベース)

```
app/           -> Next.js ページ/レイアウト
features/      -> 機能モジュール (components/, queries/, types.ts)
components/    -> 共通コンポーネント
hooks/         -> カスタム React フック
lib/openapi/   -> Orval 自動生成 API クライアント
providers/     -> コンテキストプロバイダ (QueryProvider, ToastProvider)
```

機能固有のコードは `features/{feature}/` に閉じる。
共通利用されるものだけ `components/` や `hooks/` に置く。

## パスエイリアス

- フロントエンド: `@/*` -> `src/*`

## データモデル

- `bookmarks`: id, url, title, isRead, createdAt, updatedAt
- `favorites`: id, bookmarkId (unique FK), createdAt
- 効率的なクエリのためのインデックス: isRead, createdAt, 複合(isRead, createdAt)

## 拡張機能

- Manifest v3、バンドラなしの vanilla JavaScript
- background service worker + popup UI
