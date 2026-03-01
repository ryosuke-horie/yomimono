# macOSクライアント 仕様書

## 1. 概要

yomimono の macOS デスクトップクライアントアプリを SwiftUI で実装する。
既存の REST API を使ったブックマーク閲覧・管理に加え、RSS 定期取得と CLI ツール連携による記事概要生成を段階的に実装する。

### 技術スタック

| 項目 | 採用技術 |
|------|---------|
| 言語 | Swift 6 |
| UI フレームワーク | SwiftUI |
| 依存関係管理 | Swift Package Manager |
| ターゲット OS | macOS 13 (Ventura) 以降 |
| 配布方式 | Ad-hoc（個人ユース・署名なし） |

---

## 2. 機能定義

### 2.1 フェーズ 1: ブックマーク閲覧・管理

Web フロントエンド（Next.js）と同等の機能を macOS アプリとして提供する。

#### 画面構成

サイドバー + コンテンツ領域の構成（macOS の標準的な 2 ペイン UI）。

| サイドバー項目 | 内容 | 対応 API |
|--------------|------|---------|
| 未読 | 未読ブックマーク一覧 + 未読数・本日既読数 | GET /api/bookmarks |
| お気に入り | お気に入りブックマーク一覧 | GET /api/bookmarks/favorites |
| 最近読んだ | 日付ごとにグループされた既読一覧 | GET /api/bookmarks/recent |

#### ブックマークカードのアクション

| アクション | 条件 | 処理 |
|-----------|------|------|
| タイトルクリック | 常時 | `NSWorkspace.shared.open(url)` でデフォルトブラウザを開く + PATCH /read |
| お気に入り追加 | isFavorite=false | POST /api/bookmarks/{id}/favorite |
| お気に入り削除 | isFavorite=true | DELETE /api/bookmarks/{id}/favorite |
| 既読にする | isRead=false | PATCH /api/bookmarks/{id}/read |
| 未読に戻す | isRead=true | PATCH /api/bookmarks/{id}/unread |

#### データ更新

- ウィンドウフォーカス時にデータを自動リフレッシュする
- 手動リフレッシュボタンを提供する
- 各アクション後、即座に UI に反映する（楽観的更新）

### 2.2 フェーズ 2: RSS 定期取得

RSS フィードを定期的に取得し、新着記事を yomimono API 経由でブックマークとして登録する。

#### RSS 管理

- RSS フィード URL をアプリ内で追加・削除・一覧表示できる
- 設定はローカルに永続化する（`UserDefaults` または JSON ファイル）

#### 定期取得

- アプリ起動中: 1 時間ごとに全 RSS フィードを取得する
- 取得した記事の URL が未登録の場合のみ API に登録する（重複スキップ）
- 新着記事が登録された場合、macOS Notification Center に通知する

#### バックグラウンド実行

- LaunchAgent を使い、アプリが閉じている間も定期取得を継続できる設計とする
- LaunchAgent の plist 設置はユーザーが手動で行う手順を README に記載する

### 2.3 フェーズ 3: CLI ツール連携による概要生成

ローカルにインストールされた CLI ツール（`claude`、`gemini` 等）をサブプロセスとして呼び出し、記事の概要を生成する。

#### 概要生成フロー

1. ユーザーがブックマークカード上で「概要を生成」を選択する
2. RSS から取得した記事本文（または URL）を CLI ツールに渡す
3. 生成された概要をブックマークに紐づけてローカルに保存する
4. ブックマードカード上に概要を表示する

#### CLI 実行

- `Process()` で `claude -p "..."` または `gemini "..."` を実行する
- 使用する CLI ツールと引数テンプレートはアプリの設定画面で変更できる
- CLI のフルパスは設定から指定できる（PATH 環境変数の差異に対応するため）

#### 概要データの保持

- 概要テキストはローカルのみに保存する（既存 API には追加しない）
- 保存先は `~/Library/Application Support/yomimono/summaries.json`

---

## 3. 非機能要件

### 3.1 パフォーマンス

- アプリ起動から未読一覧の表示まで 1 秒以内
- API レスポンス待ち中はスケルトン UI またはローディングインジケーターを表示する

### 3.2 エラーハンドリング

- API 呼び出し失敗時はエラーメッセージをインライン表示する（アラートダイアログは使わない）
- RSS 取得失敗時は個別フィードのエラーをログに記録し、他のフィードの取得は継続する
- CLI ツールが見つからない場合はパスの設定を促すメッセージを表示する

### 3.3 オフライン

- API 疎通不可時はキャッシュされた最後のデータを表示する（ステイル表示を明示する）
- 操作（既読化等）はオフライン時は実行不可とし、再接続後に操作できるよう案内する

---

## 4. スコープ外（やらないこと）

- Chrome 拡張機能と同等の「タブ URL 一括登録」機能
- macOS App Store への提出・コード署名
- iPhone / iPad 対応（iOS ターゲットの追加）
- ブックマークの検索・フィルタリング（将来の拡張候補）
- 既存 API へのデータ追加（概要テキスト等はローカルのみ保存）
- ダークモード/ライトモード切り替え設定（OS 設定に追従するのみ）

---

## 5. インターフェース定義

### 5.1 REST API クライアント

既存 API はそのまま使用する。変更なし。

```swift
// デコード対象の型（Codable）
struct BookmarkWithFavorite: Codable, Identifiable {
    let id: Int
    let url: String
    let title: String?
    let isRead: Bool
    let isFavorite: Bool
    let createdAt: String
    let updatedAt: String
}

struct BookmarkListResponse: Codable {
    let success: Bool
    let bookmarks: [BookmarkWithFavorite]
    let totalUnread: Int
    let todayReadCount: Int
}
```

### 5.2 CLI 実行インターフェース

```swift
struct CLIRunner {
    // executablePath: CLI のフルパス（例: "/usr/local/bin/claude"）
    // arguments: CLI に渡す引数のリスト
    // 戻り値: 標準出力の内容
    func run(executablePath: String, arguments: [String]) async throws -> String
}
```

### 5.3 ローカル永続化データ

RSS フィード設定（UserDefaults）:

```swift
struct RSSFeed: Codable, Identifiable {
    let id: UUID
    let url: String
    let title: String
    let lastFetchedAt: Date?
}
```

概要データ（`~/Library/Application Support/yomimono/summaries.json`）:

```swift
struct BookmarkSummary: Codable {
    let bookmarkId: Int
    let summary: String
    let generatedAt: Date
    let cliTool: String  // 使用した CLI ツール名
}
```

---

## 6. 制約・前提条件

- macOS 13 (Ventura) 以降を実行環境とする
- CLI ツール（`claude`、`gemini` 等）はユーザーが別途インストール済みであることを前提とする
- `BGTaskScheduler` は macOS では使用不可のため、バックグラウンド実行は LaunchAgent で対応する
- Ad-hoc 配布のため Sandbox を有効化しない（外部プロセス呼び出しへの制限なし）
- 既存の yomimono API に変更は加えない
