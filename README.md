# effective-yomimono

## APIリクエスト仕様
- エンドポイント: `/bookmarks`
- メソッド: `POST`
- リクエスト形式:
```json
{
  "bookmarks": [
    {
      "url": "https://example.com",
      "title": "ページタイトル"
    }
  ]
}
```

# Chrome拡張機能

## 概要
Chromeで開いているタブのURLとタイトルを一括で取得し、APIエンドポイントに送信するための拡張機能です。

## 機能
- 現在開いているChromeウィンドウの全タブのURL・タイトルを取得
- 取得したデータをAPIエンドポイントに一括でPOST送信
- 処理状態とレスポンスの可視化

## インストール方法
1. Chromeブラウザで `chrome://extensions` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `extension` ディレクトリを選択

## 使用方法
1. Chromeツールバーの拡張機能アイコンをクリック
2. 表示されたポップアップ内の「URLを収集して送信」ボタンをクリック
3. 処理状態がポップアップ内に表示され、完了時にはAPIからのレスポンスが表示されます

## 動作の流れ
1. ユーザーがポップアップUIのボタンをクリック
2. バックグラウンドプロセスが起動し、chrome.tabs APIを使用して現在のウィンドウの全タブ情報を収集
3. 収集したデータをJSON形式でAPIエンドポイントにPOST
4. APIからのレスポンスをポップアップUI上に表示
5. エラーが発生した場合は、詳細なエラーメッセージを表示

## エラーハンドリング
- タブ情報の取得に失敗した場合のエラー表示
- APIリクエスト失敗時のエラーメッセージ表示（HTTPステータスコードとエラー詳細を含む）
- ネットワークエラーの検知と表示

## 技術仕様とファイル構成

### ディレクトリ構造
```
extension/
├── manifest.json       # 拡張機能の設定
├── background.js      # バックグラウンド処理（タブ情報取得とAPI通信）
├── popup/
│   ├── popup.html    # ポップアップUI
│   ├── popup.css     # スタイル定義
│   └── popup.js      # UIのロジック
```

### 使用技術
- Chrome Extensions Manifest V3
- Chrome Tabs API
- Fetch API for HTTP通信
- ES6+ JavaScript
