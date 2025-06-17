# E2Eテスト

このディレクトリには、フロントエンドアプリケーションのE2E（End-to-End）テストが含まれています。

## セットアップ

### 前提条件

- フロントエンドサーバー（localhost:3000）が起動していること
- APIサーバー（localhost:8787）が起動していること

### テストの実行

```bash
# 全てのE2Eテストを実行
npm run test:e2e

# UIモードでテストを実行（ブラウザで確認可能）
npm run test:e2e:ui

# デバッグモードでテストを実行
npm run test:e2e:debug

# テスト結果のレポートを表示
npm run test:e2e:report
```

## ディレクトリ構造

```
e2e/
├── README.md                 # このファイル
├── global-setup.ts          # グローバルセットアップ
├── global-teardown.ts       # グローバル終了処理
├── fixtures/                # テストデータとフィクスチャ
│   └── test-data.ts         # サンプルデータ
├── tests/                   # テストファイル
│   └── homepage.spec.ts     # ホームページのテスト
└── utils/                   # テストユーティリティ
    └── test-helpers.ts      # テストヘルパー関数
```

## テスト作成の指針

### 命名規則

- テストファイル: `*.spec.ts`
- テスト説明: 日本語で記述
- data-testid: ケバブケース（例: `data-testid="create-bookmark-button"`）

### テストパターン

1. **ページ表示テスト**: ページが正しく表示されるかを確認
2. **ナビゲーションテスト**: ページ間の移動が正常に動作するかを確認
3. **フォーム操作テスト**: フォームの入力・送信が正常に動作するかを確認
4. **API連携テスト**: フロントエンドとAPIの連携が正常に動作するかを確認
5. **レスポンシブテスト**: 異なる画面サイズでの表示を確認

### ヘルパークラス

- `NavigationHelper`: ページナビゲーション
- `BookmarkHelper`: ブックマーク操作
- `ApiHelper`: API呼び出しの待機・検証
- `WaitHelper`: 要素の待機処理

## 設定ファイル

### playwright.config.ts

- テストディレクトリ: `./e2e`
- ベースURL: `http://localhost:3000`
- 対応ブラウザ: Chrome, Firefox, Safari（デスクトップ・モバイル）
- 自動サーバー起動: フロントエンド・API両方

### 環境変数

- `CI`: CI環境での実行時の設定調整
- テスト用の環境変数は必要に応じて追加

## トラブルシューティング

### よくある問題

1. **サーバーが起動していない**
   - フロントエンド: `npm run dev`
   - API: `cd ../api && npm run dev`

2. **テストがタイムアウトする**
   - ネットワークの状態を確認
   - サーバーの応答速度を確認

3. **要素が見つからない**
   - data-testid属性が正しく設定されているか確認
   - 要素の表示タイミングを確認

### デバッグ方法

```bash
# ヘッドレスモードを無効にしてブラウザを表示
npm run test:e2e:debug

# 特定のテストファイルのみ実行
npx playwright test e2e/tests/homepage.spec.ts

# スクリーンショット付きでテスト実行
npx playwright test --screenshot=on
```