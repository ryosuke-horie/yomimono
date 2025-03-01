# Chrome拡張機能の実装計画

## 概要
開いているタブのURLを取得し、APIエンドポイントに一括でPOSTする Chrome拡張機能

## 機能要件
1. 現在開いているすべてのタブのURLを取得
2. 取得したURLをAPIエンドポイントに一括でPOSTする

## 技術仕様

### ディレクトリ構造
```
.cline/extension/
├── manifest.json       # 拡張機能の設定ファイル
├── background.js      # バックグラウンドスクリプト
├── popup/
│   ├── popup.html    # ポップアップUI
│   ├── popup.js      # ポップアップのロジック
│   └── popup.css     # ポップアップのスタイル
└── README.md         # ドキュメント
```

### 主要コンポーネント

#### manifest.json
- マニフェストバージョン3を使用
- 必要な権限を設定（tabs, host）
- バックグラウンドスクリプトの登録
- ポップアップUIの設定

#### background.js
- Chrome.tabs APIを使用してタブ情報を取得
- 取得したURLをAPIエンドポイントにPOST

#### ポップアップUI
- 実行ボタン
- 処理状態の表示
- 結果の表示

### 使用するChrome API
- `chrome.tabs.query()`: 現在のウィンドウのタブ情報を取得
- `chrome.runtime.sendMessage()`: コンポーネント間の通信

### APIエンドポイントとの通信
- Fetch APIを使用
- POSTリクエストでURLリストを送信
- エラーハンドリングの実装

## インストール方法
1. Chromeで `chrome://extensions` を開く
2. デベロッパーモードを有効化
3. 「パッケージ化されていない拡張機能を読み込む」から拡張機能のディレクトリを選択

## 開発フロー
1. manifest.jsonの作成
2. バックグラウンドスクリプトの実装
3. ポップアップUIの実装
4. APIとの通信処理の実装
5. エラーハンドリングの追加
6. テストとデバッグ