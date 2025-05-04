# effective-yomimono

効率的な読書管理のためのブックマーク収集・管理システムです。技術記事を収集し、読む習慣を効率化することを目的としています。

## ドキュメント作成方針について

[document README](./docs/README.md)

## 開発環境について

### フロントエンド

- ルートに`.env`を用意する(sampleのコピーでOK)
- 開発時はAPIを`npm run dev`で立ち上げて利用する想定

## プロジェクト概要
「effective-yomimono」は、ウェブ上の読みたい記事やコンテンツを効率的に管理するためのツールです。技術記事をタブで開いて並べておくことが多い開発者の習慣に着目し、Chrome拡張機能でブックマークを簡単に収集し、APIを通じてデータを保存、フロントエンドで整理・閲覧できます。

## セットアップと実行方法

### APIの実行
```bash
cd api
npm install
npm run dev  # 開発サーバー起動
```

### フロントエンドの実行
```bash
cd frontend
npm install
npm run dev  # 開発サーバー起動（http://localhost:3000）
```

### Chrome拡張機能のインストール
1. Chromeブラウザで `chrome://extensions` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `extension` ディレクトリを選択

### デプロイ
```bash
# APIのデプロイ
cd api
npm run deploy

# フロントエンドのデプロイ
cd frontend
npm run deploy
```

## 開発ツール

### Lintとフォーマット

各ディレクトリでlintとformatを実行できます：

```bash
# APIのlint
cd api
bun run lint

# フロントエンドのlint
cd frontend
bun run lint
```

ルートディレクトリから一括でlintを実行することも可能です：

```bash
# すべてのプロジェクトのlint実行
bun run lint

# すべてのプロジェクトのformat実行
bun run format
```

### pre-commitフック（lefthook）

このプロジェクトではlefthookを使用してpre-commitフックを実装しています。
コミット時に自動的に各ディレクトリのbiomeによるLintチェックが実行され、問題があれば自動的に修正されます。

初回セットアップ時に以下のコマンドを実行してlefthookをインストールしてください：

```bash
bun install
bun lefthook install
```

## データベースマイグレーション
```bash
cd api
# マイグレーションファイル生成
npx drizzle-kit generate

# マイグレーション適用
npx drizzle-kit migrate
```
