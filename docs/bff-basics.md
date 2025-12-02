# BFF共通部品の使い方

## サーバー専用クライアント
- BFF から外部 API を呼び出す際は `frontend/src/lib/bff/client.ts` の `fetchFromApi` を使う。
- Orval のサーバー向け生成物で組み立てたパスをそのまま渡す。例:
  ```ts
  import { getGetApiBookmarksUrl } from "@/lib/openapi/server";
  import { fetchFromApi } from "@/lib/bff/client";

  const result = await fetchFromApi(getGetApiBookmarksUrl(params), {
    revalidateSeconds: 30, // 必要に応じて簡易キャッシュを付与
  });
  ```
- リクエストは `cache: "no-store"`、`next.revalidate` は明示した秒数のみが有効になる。API キーは `BFF_API_KEY` が自動付与される。

## エラー正規化とステータスコード
- `frontend/src/lib/bff/errors.ts` に BFF 用の `BffError` とステータスマッピングを定義。
- 上流の `400/401/403/404/409/429/5xx` をコードに正規化し、未知のステータスや解析不可なレスポンスは 502 の `INVALID_RESPONSE`/`UPSTREAM_ERROR` に揃える。
- Route Handler では `errorJsonResponse` を使うと `{ success: false, message, code }` 形式で統一したレスポンスを返せる。

## キャッシュ方針
- デフォルトは `Cache-Control: private, max-age=0, must-revalidate` でキャッシュなし。
- `buildCacheControl` で `maxAge` や `staleWhileRevalidate` を指定可能。BFF レイヤー以降でキャッシュ設定が一元化される。

## 環境変数の扱い
- 外部 API のベース URL とキーは `BFF_API_BASE_URL` / `BFF_API_KEY`（サーバー専用）に置く。
- `NEXT_PUBLIC_*` には機密情報を入れない。クライアント直呼びの後方互換が必要な場合のみ、`.env.example` の公開用変数を一時的に使う。
