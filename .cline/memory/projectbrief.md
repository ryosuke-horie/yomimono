# Effective Yomimono Project Brief

## プロジェクト概要
ブラウザで開いているタブのURLを効率的に収集・管理するためのChrome拡張機能とそのバックエンドシステム。

## コア機能
1. Chrome拡張機能
- 現在開いているタブの一覧表示
- 複数タブの選択機能
- 選択したタブのURL・タイトル情報の収集
- APIを通じたブックマーク保存

2. バックエンドAPI
- ブックマークデータの保存・管理
- 一括登録機能の提供

## 技術スタック
- Chrome Extension API (Manifest V3)
- TypeScript
- Cloudflare Workers (API)
