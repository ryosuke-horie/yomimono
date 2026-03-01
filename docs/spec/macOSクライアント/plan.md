# macOSクライアント 実装計画

## 実装フェーズ概要

```
Phase 1: プロジェクトセットアップ
Phase 2: ブックマーク閲覧・管理（基本機能）
Phase 3: RSS 定期取得
Phase 4: CLI ツール連携による概要生成
```

Phase 1 → 2 → 3 → 4 の順に実装する。各 Phase は前 Phase の完了を前提とする。

---

## Phase 1: プロジェクトセットアップ

### 1-1. Xcode プロジェクト作成

- [ ] Xcode で新規 macOS App プロジェクトを作成する
  - 名前: `yomimono`
  - Interface: SwiftUI
  - Language: Swift
  - Bundle Identifier: `com.yomimono.macos`
  - ターゲット OS: macOS 13.0
- [ ] `yomimono/macos-app/` ディレクトリにプロジェクトを配置する
- [ ] Sandbox を無効化する（Entitlements ファイルで `com.apple.security.app-sandbox` を `false` に設定）
- [ ] App Transport Security を無効化せず、HTTPS のみで通信することを確認する

### 1-2. ディレクトリ構造の整備

- [ ] 以下のフォルダ構成を Xcode プロジェクト内に作成する
  ```
  macos-app/
  ├── App/
  │   └── YomimonoApp.swift        (エントリーポイント)
  ├── Features/
  │   ├── Bookmarks/               (Phase 2)
  │   │   ├── Views/
  │   │   ├── ViewModels/
  │   │   └── Models/
  │   ├── RSS/                     (Phase 3)
  │   │   ├── Views/
  │   │   ├── ViewModels/
  │   │   └── Models/
  │   └── Summary/                 (Phase 4)
  │       ├── Views/
  │       └── Services/
  ├── Services/
  │   ├── BookmarkAPIClient.swift
  │   ├── RSSFetcher.swift
  │   └── CLIRunner.swift
  ├── Models/
  │   ├── Bookmark.swift
  │   ├── RSSFeed.swift
  │   └── BookmarkSummary.swift
  └── Shared/
      ├── Extensions/
      └── Components/
  ```

### 1-3. 依存ライブラリの追加（Swift Package Manager）

- [ ] `FeedKit` を SPM で追加する（RSS / Atom パーサ）
  - URL: `https://github.com/nmdias/FeedKit`

### 1-4. モノレポへの統合

- [ ] `yomimono/` ルートの `README.md` に `macos-app/` の開発手順を追記する
- [ ] `pnpm-workspace.yaml` には追加しない（Swift Package Manager で管理するため）
- [ ] `lefthook.yml` に SwiftLint の lint コマンドを追加する（任意・後回し可）

---

## Phase 2: ブックマーク閲覧・管理

### 2-1. データモデル定義

- [ ] `Bookmark.swift` に `BookmarkWithFavorite` / `BookmarkListResponse` / `FavoriteBookmarksResponse` / `RecentBookmarksResponse` を `Codable` で定義する
- [ ] API レスポンスの `createdAt`（ISO 8601 文字列）を `Date` に変換するカスタム `DateFormatter` を定義する

### 2-2. BookmarkAPIClient の実装

- [ ] `BookmarkAPIClient.swift` を実装する
  - ベース URL: `https://effective-yomimono-api.ryosuke-horie37.workers.dev`
  - `URLSession` + `async/await` で各エンドポイントを呼び出す関数を実装する
  - 実装対象:
    - [ ] `fetchUnreadBookmarks() async throws -> BookmarkListResponse`
    - [ ] `fetchFavoriteBookmarks() async throws -> FavoriteBookmarksResponse`
    - [ ] `fetchRecentBookmarks() async throws -> RecentBookmarksResponse`
    - [ ] `markAsRead(id: Int) async throws`
    - [ ] `markAsUnread(id: Int) async throws`
    - [ ] `addToFavorites(id: Int) async throws`
    - [ ] `removeFromFavorites(id: Int) async throws`
  - HTTP エラー（4xx / 5xx）時は `BookmarkAPIError` をスローする

### 2-3. アプリケーション構造の実装

- [ ] `YomimonoApp.swift` にメインウィンドウと `NavigationSplitView` の骨格を実装する
- [ ] サイドバーに「未読」「お気に入り」「最近読んだ」の 3 項目を実装する
- [ ] ウィンドウフォーカス時にデータをリフレッシュする処理を実装する（`NSWindowDelegate` または `scenePhase`）

### 2-4. 未読ブックマーク一覧画面

- [ ] `UnreadBookmarksViewModel.swift` を実装する（`@Observable` または `ObservableObject`）
  - データ取得・ローディング状態・エラー状態を管理する
- [ ] `UnreadBookmarksView.swift` を実装する
  - 未読数・本日既読数のサマリー表示
  - ブックマークカードのリスト表示（`List` または `ScrollView` + `LazyVStack`）
  - ローディング中のスケルトン UI またはプログレスインジケーター
  - エラー時のインラインエラーメッセージ表示
  - 手動リフレッシュボタン

### 2-5. ブックマークカードコンポーネント

- [ ] `BookmarkCardView.swift` を実装する
  - タイトル（クリックでブラウザを開く + 既読化）
  - URL（グレーテキスト）
  - 登録日
  - お気に入りボタン（星アイコン、トグル）
  - 既読にするボタン（未読時のみ表示）
  - 未読に戻すボタン（既読時のみ表示）
  - 各ボタンの処理中はインジケーターを表示してボタンを無効化する
- [ ] タイトルクリック時に `NSWorkspace.shared.open(url)` で外部ブラウザを開き、同時に既読 API を呼び出す

### 2-6. お気に入り一覧画面

- [ ] `FavoritesViewModel.swift` を実装する
- [ ] `FavoritesView.swift` を実装する（未読一覧と同様の構成）

### 2-7. 最近読んだ一覧画面

- [ ] `RecentViewModel.swift` を実装する
- [ ] `RecentView.swift` を実装する
  - 日付（`YYYY-MM-DD`）をセクションヘッダーとして表示する
  - 各セクション内にブックマークカードを並べる

### 2-8. Phase 2 動作確認

- [ ] 未読一覧・お気に入り・最近読んだの各画面が表示されることを確認する
- [ ] 各ブックマークカードのアクション（ブラウザ開く・既読化・お気に入りトグル）が正常に動作することを確認する
- [ ] API エラー時にエラーメッセージが表示されることを確認する

---

## Phase 3: RSS 定期取得

### 3-1. RSS フィードのデータモデルと永続化

- [ ] `RSSFeed.swift` に `RSSFeed` 構造体を定義する（`id: UUID`, `url: String`, `title: String`, `lastFetchedAt: Date?`）
- [ ] `RSSFeedStore.swift` を実装する（`UserDefaults` を使った読み書き）

### 3-2. RSS フィード管理 UI

- [ ] サイドバーに「RSS フィード」セクションを追加する
- [ ] `RSSFeedListView.swift` を実装する（フィード一覧・追加・削除）
- [ ] フィード追加シート: URL 入力 → フィードタイトルの自動取得 → 保存

### 3-3. RSS フェッチャーの実装

- [ ] `RSSFetcher.swift` を実装する
  - `FeedKit` を使って RSS / Atom / JSON Feed をパースする
  - 各エントリの `url`, `title`, `publishedAt` を取得する
- [ ] 取得した記事の URL が既存のブックマークに含まれていない場合のみ `POST /api/bookmarks/bulk` で登録する
  - 重複チェック: 既存の未読ブックマーク一覧と URL を照合する

### 3-4. 定期取得タイマー

- [ ] `RSSScheduler.swift` を実装する
  - アプリ起動時に開始、1 時間ごとに全 RSS フィードを取得する
  - `Timer.publish` (Combine) で実装する
  - `YomimonoApp.swift` でアプリ起動時に `RSSScheduler` を開始する

### 3-5. Notification Center 通知

- [ ] アプリ起動時に `UNUserNotificationCenter` の通知許可をリクエストする
- [ ] 新着記事が登録されたとき、登録件数を Notification Center に通知する

### 3-6. LaunchAgent セットアップ手順の整備

- [ ] `macos-app/LaunchAgent/com.yomimono.rss-fetcher.plist` のサンプルファイルを作成する
- [ ] `README.md` にインストール手順（plist の配置と `launchctl` コマンド）を記載する

### 3-7. Phase 3 動作確認

- [ ] RSS フィードの追加・削除が正常に動作することを確認する
- [ ] RSS 取得で新着記事がブックマークに登録されることを確認する
- [ ] 重複する URL が再登録されないことを確認する
- [ ] 通知が表示されることを確認する

---

## Phase 4: CLI ツール連携による概要生成

### 4-1. CLIRunner の実装

- [ ] `CLIRunner.swift` を実装する
  - `Foundation.Process` を使って外部コマンドを非同期で実行する
  - 標準出力を取得して `String` で返す
  - 実行エラー（コマンドが見つからない等）は `CLIError` としてスローする

### 4-2. 概要データのローカル保存

- [ ] `BookmarkSummary.swift` に `BookmarkSummary` 構造体を定義する（`bookmarkId: Int`, `summary: String`, `generatedAt: Date`, `cliTool: String`）
- [ ] `SummaryStore.swift` を実装する
  - 保存先: `~/Library/Application Support/yomimono/summaries.json`
  - `bookmarkId` をキーにした読み書きを実装する

### 4-3. 設定画面の実装

- [ ] `SettingsView.swift` を実装する（`Settings` scene として追加）
  - CLI ツールのフルパス設定（例: `/usr/local/bin/claude`）
  - CLI への引数テンプレート設定（例: `-p "以下を要約してください:\n{{text}}"`）
  - 設定値は `UserDefaults` に保存する
- [ ] パス未設定・CLI が見つからない場合の警告メッセージを表示する

### 4.4. 概要生成フローの実装

- [ ] ブックマークカードに「概要を生成」ボタンを追加する（概要未生成時のみ表示）
- [ ] ボタンタップ時のフロー:
  - [ ] RSS から取得した記事の `description` テキストを取得する（未取得の場合は URL のみ渡す）
  - [ ] `CLIRunner` で設定された CLI を実行し、結果を取得する
  - [ ] 生成された概要を `SummaryStore` に保存する
- [ ] 生成中はスピナーを表示し、完了後に概要テキストを表示する
- [ ] 生成済みの概要はカード内にグレーテキストで表示する

### 4-5. Phase 4 動作確認

- [ ] 設定画面で CLI パスを設定できることを確認する
- [ ] CLI が見つからない場合にエラーメッセージが表示されることを確認する
- [ ] 「概要を生成」ボタンを押すと CLI が実行され、結果が表示されることを確認する
- [ ] アプリ再起動後も生成済みの概要が表示されることを確認する

---

## 懸念点・リスクと対処方針

### CLI の PATH 問題

GUI アプリから起動した場合、シェルの `PATH` が引き継がれないため `claude` 等のコマンドを単純に呼び出せない場合がある。
対処: 設定画面で CLI のフルパスをユーザーが指定する形にする。ユーザーは `which claude` で確認して設定する。

### RSS フィードの本文取得

RSS の `description` フィールドはサマリーのみの場合が多い。全文は取得しない方針とし、まず `description` を概要生成の対象とする。

### 既存 API との重複チェックのコスト

重複チェックのため `GET /api/bookmarks` で現在の未読一覧を取得して URL を照合する。
既読ブックマークとの重複はチェックしない（再度登録されても未読として扱う）。

### LaunchAgent の自動インストール

アプリから自動的に plist を配置する実装は複雑なため、Phase 3 では手動インストールの手順提供にとどめる。
自動化は将来の拡張として検討する。
