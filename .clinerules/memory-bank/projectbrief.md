# プロジェクト概要

## プロジェクトの目的

技術記事を効率的に収集し、個人学習を最適化するためのツール。ブラウザで開いた技術記事をワンクリックで保存し、後で整理して学習できる環境を提供します。

## 主要機能

1. リンク収集（Chrome拡張機能）
   - 開いているタブからリンクとタイトルを収集
   - ワンクリックでAPIにデータを送信

2. 記事管理（フロントエンド）
   - 未読記事の一覧表示
   - お気に入り記事の管理
   - 直感的なUI/UX

3. データストレージ（API）
   - 記事データの永続化
   - 効率的なデータアクセス

## 技術スタック

### フロントエンド
- Next.js
- TailwindCSS
- @opennextjs/cloudflare

### バックエンド
- Hono
- Cloudflare D1 (SQLite)
- Drizzle ORM

### Chrome拡張機能
- Vanilla JavaScript
- Chrome Extensions API

### 開発環境
- Bun（ランタイム）
- Biome（Linter）
- knip（静的解析）
- Vitest（テスト）

## デプロイメント

- フロントエンド：Cloudflare Workers
- API：Cloudflare Workers
- 拡張機能：ローカルインストール（chrome://extensions/）

## 品質管理

1. テスト戦略
   - APIは単体テストで90%以上のカバレッジ
   - フロントエンドは現状テスト省略（小規模のため）

2. 静的解析
   - BiomeによるLint
   - knipによる未使用コード検出
   - CIでの自動検証

## プロジェクトスコープ

- 個人学習用のプライベートプロジェクト
- 技術学習・実験の場としても活用
- スモールスタートで必要な機能を段階的に追加
