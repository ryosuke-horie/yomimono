# macOSクライアント リサーチ

## 概要

yomimono の macOS デスクトップクライアントアプリを実装するための調査結果をまとめる。
以下の 3 機能群を統合した macOS ネイティブアプリを目指す。

1. ブックマーク閲覧・管理（Web フロントエンドと同等）
2. RSS フィードの定期自動取得
3. ローカルにインストールされた CLI ツール（`claude`、`gemini` 等）をサブプロセスとして呼び出しての記事概要生成

macOS 固有の機能を積極的に活用することを前提とする。
本 research では「技術スタックとして実現に制約があるか否か」の観点を中心に整理する。

---

## 1. 既存システムの理解

### 1.1 API エンドポイント

ベース URL: `https://effective-yomimono-api.ryosuke-horie37.workers.dev`
- 認証: なし（個人ユースのためパブリックエンドポイント）
- プロトコル: REST / JSON

| メソッド | パス | 概要 |
|---------|------|------|
| GET | /api/bookmarks | 未読ブックマーク一覧（totalUnread, todayReadCount 含む） |
| GET | /api/bookmarks/favorites | お気に入り一覧 |
| GET | /api/bookmarks/recent | 最近既読にしたもの（日付ごとグループ） |
| PATCH | /api/bookmarks/{id}/read | 既読化 |
| PATCH | /api/bookmarks/{id}/unread | 未読に戻す |
| POST | /api/bookmarks/{id}/favorite | お気に入り追加 |
| DELETE | /api/bookmarks/{id}/favorite | お気に入り削除 |

### 1.2 データモデル

```typescript
type BookmarkWithFavorite = {
  id: number;
  url: string;
  title: string | null;
  isRead: boolean;
  isFavorite: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

type BookmarkListResponse = {
  success: true;
  bookmarks: BookmarkWithFavorite[];
  totalUnread: number;
  todayReadCount: number;
};

// GET /api/bookmarks/recent（"YYYY-MM-DD" をキーとした日付グループ）
type RecentBookmarksResponse = {
  success: true;
  bookmarks: Record<string, BookmarkWithFavorite[]>;
};
```

### 1.3 Web フロントエンドの機能（移植対象）

| ページ | 概要 |
|--------|------|
| 未読一覧 | 未読ブックマーク一覧（未読数・本日既読数を表示） |
| お気に入り | お気に入り一覧 |
| 最近読んだ | 日付ごとにグループされた最近既読一覧 |

ブックマークカードのアクション：
- タイトルクリック → デフォルトブラウザで開く + 自動既読化
- お気に入りトグル（追加/削除）
- 既読にする（未読時のみ）
- 未読に戻す（既読時のみ）

---

## 2. フレームワーク選択と技術的制約の整理

### 2.1 候補フレームワーク

本案件で検討する選択肢は以下の 2 つ。

| | Tauri v2 | SwiftUI |
|---|---|---|
| 言語 | Rust（バックエンド）+ TypeScript/React（UI） | Swift |
| 既存スキル活用 | 高（TS/React をそのまま使える） | 低（Swift の学習が必要） |
| macOS 固有 API へのアクセス | Tauri プラグイン経由（一部制限あり） | フルアクセス |
| バンドルサイズ | 600KB 未満 | OS 組み込み |

### 2.2 機能ごとの技術的制約

#### A. REST API 呼び出し（ブックマーク管理）

どちらも制約なし。
- Tauri v2: React 側の Fetch API で直接呼び出せる。CSP 設定で外部ドメインを明示的に許可する必要がある（設定の手間はあるが制約ではない）。
- SwiftUI: `URLSession` で直接呼び出せる。

#### B. 外部 CLI プロセスの呼び出し（`claude`、`gemini` 等）

どちらも制約なし。ただし macOS の Sandbox 設定に注意が必要。

Tauri v2:
- `@tauri-apps/plugin-shell` を使い `claude "..."` 等を実行できる
- `capabilities/default.json` で実行を許可するコマンドを明示的に列挙する必要がある
- Ad-hoc 配布（個人ユース）では Sandbox を無効化できるため制限なし

SwiftUI:
- Swift の `Process()` クラスで外部コマンドをそのまま実行できる
- Ad-hoc 配布では Sandbox を無効化できるため制限なし

Sandbox についての共通注意点:
- macOS App Store へ提出する場合は Sandbox が強制され、外部プロセス呼び出しが制限される
- 個人配布（Ad-hoc）であれば Sandbox なしで配布でき、制約はない
- 本案件は個人ユースのため問題なし

#### C. RSS 定期取得（バックグラウンド処理）

どちらも実現可能だが実装方法が異なる。

macOS の注意点: iOS の `BGTaskScheduler` は macOS では利用不可（API_UNAVAILABLE）。

Tauri v2:
- アプリ起動中の定期実行: Rust の `tokio::time::interval()` で実装
- アプリ停止中の定期実行: LaunchAgent（macOS 標準の定期実行機構）を併用
- LaunchAgent の plist をアプリインストール時に `~/Library/LaunchAgents/` に配置する

SwiftUI:
- アプリ起動中の定期実行: `Timer.publish` または `DispatchSourceTimer` で実装
- アプリ停止中の定期実行: LaunchAgent を同様に利用

LaunchAgent は両フレームワーク共通で macOS 標準の定期実行手段となる。
どちらを選んでも制約はない。

#### D. RSS パーシング

どちらも制約なし。
- Tauri v2（Rust）: `feed-rs` crate が RSS / Atom / JSON Feed を自動判定してパースできる
- SwiftUI（Swift）: `XMLParser`（標準）または `FeedKit`（サードパーティ）

#### E. ユーザー通知（新着 RSS の通知）

どちらも制約なし。
- Tauri v2: `@tauri-apps/plugin-notification` で macOS Notification Center に通知を送れる
- SwiftUI: `UNUserNotificationCenter` でネイティブに送れる

#### F. デフォルトブラウザで URL を開く

どちらも制約なし。
- Tauri v2: `@tauri-apps/plugin-shell` の `open()` を使う
- SwiftUI: `NSWorkspace.shared.open()` を使う

---

## 3. フレームワーク選択の結論

### 3.1 技術的な制約という観点での評価

実現したい機能（REST API 呼び出し・外部 CLI 呼び出し・RSS 定期取得・ユーザー通知）のいずれについても、Tauri v2 と SwiftUI の間に「実現できない」という意味での技術的ブロッカーはない。

差があるのは以下の点：

- Tauri v2 は `capabilities` や CSP の設定が必要な箇所があり、設定を誤るとハマりやすい
- SwiftUI は macOS の全 API に直接アクセスできるため、設定の摩擦が少ない
- 外部 CLI 呼び出しは両者とも Ad-hoc 配布前提であれば制限なし

### 3.2 採用フレームワーク

SwiftUI を採用する。

理由：
- 「macOS 固有で作る」という方針に最も合致する
- 外部 CLI プロセス呼び出し（`Process()`）、LaunchAgent 統合、通知（UserNotifications）のいずれも macOS ネイティブ API に直接アクセスできる
- Tauri v2 で必要な capabilities / CSP 等の追加設定・トラブルシューティングのコストがない
- SwiftUI の宣言的 UI は React に近い概念（`@State` は useState、`@ObservedObject` は useRef/Context に相当）のため、React 経験者にとって概念移行のコストは想定より低い

Tauri v2 は既存 TypeScript/React スキルを活かせるメリットがあるが、
macOS 固有機能への統合コストを考慮すると SwiftUI の方が適している。

---

## 4. SwiftUI 技術スタック詳細

### 4.1 開発環境

- Xcode 16 以降
- Swift 6 / SwiftUI
- Swift Package Manager（依存関係管理）
- macOS 13 (Ventura) 以降をターゲット

### 4.2 主要コンポーネントと macOS API

| 機能 | 使用 API / ライブラリ |
|------|-----------------------|
| REST API 呼び出し | `URLSession` + `Codable` |
| デフォルトブラウザで開く | `NSWorkspace.shared.open(url)` |
| 外部 CLI 実行（claude, gemini 等） | `Process()` / `Foundation.Process` |
| RSS 取得・パース | `URLSession` + `XMLParser` または FeedKit（SPM） |
| 定期実行（アプリ起動中） | `Timer.publish` (Combine) |
| 定期実行（バックグラウンド） | LaunchAgent + plist |
| ユーザー通知 | `UNUserNotificationCenter` |
| メニューバー常駐 | `MenuBarExtra` scene |

### 4.3 外部 CLI 呼び出しの実装例

```swift
import Foundation

func runCLI(command: String, arguments: [String]) async throws -> String {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    process.arguments = [command] + arguments

    let pipe = Pipe()
    process.standardOutput = pipe

    try process.run()
    process.waitUntilExit()

    let data = pipe.fileHandleForReading.readDataToEndOfFile()
    return String(data: data, encoding: .utf8) ?? ""
}

// 使用例
let output = try await runCLI(command: "claude", arguments: ["-p", "以下を要約してください: \(articleText)"])
```

### 4.4 RSS 定期取得の実装例

```swift
import Combine

class RSSScheduler: ObservableObject {
    private var cancellable: AnyCancellable?

    func start() {
        cancellable = Timer.publish(every: 3600, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                Task { await self?.fetchAllFeeds() }
            }
    }
}
```

### 4.5 プロジェクト配置

Xcode プロジェクトとして `macos-app/` に配置する。
Swift Package Manager を使用するため pnpm workspace の管理外となる。
Lefthook への統合は SwiftLint / swift-format を使った lint のみ追加する。

```
yomimono/
├── api/
├── extension/
├── frontend/
├── macos-app/              ← Xcode プロジェクト（新規作成）
│   ├── macos-app.xcodeproj/
│   ├── macos-app/
│   │   ├── App/
│   │   │   └── YomimonoApp.swift
│   │   ├── Features/
│   │   │   ├── Bookmarks/
│   │   │   ├── RSS/
│   │   │   └── Summary/
│   │   └── Services/
│   │       ├── BookmarkAPIClient.swift
│   │       ├── RSSFetcher.swift
│   │       └── CLIRunner.swift
│   └── Package.swift
└── pnpm-workspace.yaml     （macos-app は含めない）
```

---

## 5. 技術的リスクと考慮事項

### 5.1 外部 CLI のパス問題

`claude` や `gemini` コマンドは通常 `/usr/local/bin/` や `~/.local/bin/` 等にインストールされる。
`Process()` で実行する際、GUI アプリから起動した場合は `PATH` 環境変数がシェルと異なることがある。
実行可能ファイルのフルパスを指定するか、起動時に `PATH` を明示的に設定する対処が必要。

### 5.2 LaunchAgent の設定

定期実行を実現するために LaunchAgent の plist を `~/Library/LaunchAgents/` に配置する必要がある。
アプリのインストール時にこれを自動的に行う仕組みが必要（またはユーザーが手動で行う手順を用意する）。

### 5.3 RSS コンテンツの取得範囲

RSS フィードの `description` フィールドはサマリーのみ含む場合が多い。
記事の全文は元ページのスクレイピングが必要になるケースがある。
スクレイピングは利用規約上の問題を伴う場合があるため、まず RSS の `description` を概要生成の対象とするのが安全。

### 5.4 Swift 習得コスト

既存の TypeScript/React スキルは直接転用できない。
ただし SwiftUI の宣言的 UI は React に近い設計思想を持つため、UI の概念的移行コストは低い。
Concurrency（async/await）は Swift 5.5 以降で標準化されており、TypeScript の async/await とほぼ同じ感覚で書ける。

---

## 6. 参考資料

- [SwiftUI ドキュメント](https://developer.apple.com/documentation/swiftui)
- [Foundation.Process（外部プロセス実行）](https://developer.apple.com/documentation/foundation/process)
- [URLSession](https://developer.apple.com/documentation/foundation/urlsession)
- [UserNotifications](https://developer.apple.com/documentation/usernotifications)
- [MenuBarExtra](https://developer.apple.com/documentation/swiftui/menubarextra)
- [launchd.info（LaunchAgent チュートリアル）](https://www.launchd.info/)
- [FeedKit（RSS パーサ・SPM 対応）](https://github.com/nmdias/FeedKit)
