# フロントエンド BookmarkCard 再レンダリング問題調査

## 問題概要

フロントエンドの `BookmarkCard` コンポーネント内で、お気に入りボタンまたは既読ボタンをクリックした際に、リスト全体が再レンダリングされるような「リロード風の挙動」が発生する。

## 調査経緯

1.  **`BookmarkCard.tsx` の分析:**
    *   ボタンクリック時に `useBookmarks` フックの関数 (`markAsRead`, `addToFavorites`, `removeFromFavorites`) を呼び出す。
    *   API 呼び出し後に親から渡された `onUpdate?.()` コールバックを実行する。
    *   コンポーネント自体にリロード処理はない。
2.  **`useBookmarks.ts` の分析:**
    *   `markAsRead`: API 呼び出しのみで状態更新は行わない。
    *   `addToFavorites`, `removeFromFavorites`: API 呼び出し後に `fetchFavorites` を実行する。
    *   `fetchFavorites`: API から**お気に入りリスト全体**を再取得し、`favorites` 状態を更新する。
    *   `getUnreadBookmarks`: API から**未読リスト全体**を取得し、呼び出し元に返す。
3.  **`BookmarksList.tsx` の分析:**
    *   `mode` (`all` or `favorites`) に応じて表示データを管理。
    *   `handleUpdate` 関数を定義し、`mode` に応じて `fetchBookmarks` (未読リスト全体取得) または `fetchFavorites` (お気に入りリスト全体取得) を割り当て。
    *   `BookmarkCard` に `onUpdate={handleUpdate}` を渡している。
    *   リストレンダリングには `displayData.map` と `key={bookmark.id}` を使用。

## 原因特定

`BookmarkCard` での状態変更（既読、お気に入り）をトリガーとして、親コンポーネント (`BookmarksList`) が `onUpdate` コールバック (`handleUpdate`) を実行し、その中で**リスト全体のデータを API から再取得** (`fetchBookmarks` または `fetchFavorites`) して状態を更新するため、結果的にリスト全体が再レンダリングされている。

## 解決策提案

1.  **状態の部分更新:**
    *   API 呼び出し成功後、リスト全体の再取得ではなく、変更があったブックマークの情報のみを使ってローカルの状態 (`bookmarks` または `favorites` 配列) を更新する。
    *   `useBookmarks` フックまたは `BookmarksList` コンポーネント内で状態更新ロジックを実装する。
    *   **メリット:** API 負荷と再レンダリング範囲を最小限に抑えられる。
    *   **デメリット:** 状態管理ロジックがやや複雑になる可能性がある。
2.  **楽観的UI更新 (Optimistic UI Update):**
    *   API 呼び出し前に UI を即座に変更後の状態に更新する。
    *   API 呼び出しが成功したらそのまま、失敗したら UI を元に戻しエラー表示する。
    *   **メリット:** ユーザーの体感速度が向上する。
    *   **デメリット:** 失敗時のロールバック処理が必要になる。状態管理がより複雑になる可能性がある。

## 次のアクション

ユーザーと相談の結果、**楽観的UI更新 (Optimistic UI Update)** を **TanStack Query (React Query) v5** を用いて実装する方針を決定。

**実装方針:**
1.  TanStack Query を導入し、`QueryClientProvider` を設定する。
2.  既存のデータ取得・更新ロジック (`useBookmarks`) を `useQuery` および `useMutation` を使用するようにリファクタリングする。
3.  `useMutation` の `onMutate`, `onError`, `onSettled` オプションを活用して楽観的更新を実装する。
    *   `onMutate`: キャッシュの楽観的更新とロールバック用データの保存。
    *   `onError`: キャッシュのロールバック。
    *   `onSettled`: 関連クエリの無効化 (`invalidateQueries`) による最終的なデータ同期。
4.  データ取得・更新ロジックを `frontend/src/queries` (または類似のディレクトリ) 配下のカスタムフックに分離する。
5.  API レスポンスは当面変更せず、既存のエンドポイントを活用する。必要に応じて後から最適化を検討する。

上記方針に基づき、実装を進める。
