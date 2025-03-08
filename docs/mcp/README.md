# Effective Yomimono MCP 実装計画

このディレクトリには、Effective Yomimono プロジェクトに Model Context Protocol (MCP) を導入するための計画、ガイド、サンプルコードが含まれています。

## ドキュメント一覧

1. [**実装ガイド**](./implementation_guide.md) - MCP の基本概念と Effective Yomimono への実装アプローチ
2. [**サンプル実装**](./sample_implementation.md) - 具体的な実装例とコードサンプル
3. [**利点とユースケース**](./benefits_and_use_cases.md) - MCP 導入のメリットと実現可能なユースケース

## Model Context Protocol (MCP) とは

Model Context Protocol (MCP) は、大規模言語モデル (LLM) アプリケーションと外部データソースやツールの間のシームレスな連携を可能にするオープンプロトコルです。Anthropic によって開発され、オープンスタンダードとして公開されています。

主な特徴:
- データへのアクセスを標準化
- 外部ツールの実行を可能に
- セキュリティとプライバシーを考慮した設計
- マルチモーダルおよびリアルタイムなデータ連携

## 導入の目的

Effective Yomimono プロジェクトに MCP を導入する主な目的:

1. **AI 連携の強化** - Claude などの LLM と連携して、ブックマーク管理にインテリジェンスを追加
2. **機能拡張** - 記事の自動分類、要約、推薦などの高度な機能を可能に
3. **標準規格への対応** - 将来的な拡張性と互換性を確保
4. **ユーザー体験の向上** - より自然な対話形式でのブックマーク管理を実現

## 実装アプローチ

既存の Effective Yomimono API に MCP を統合する主な方法として、TypeScript SDK を使用した既存 API への統合アプローチを採用します：

- 既存の Hono.js API に MCP エンドポイントを追加
- 同じサービスとデータアクセス層を再利用
- `/api/mcp/*` エンドポイントを通じてアクセス

## 実装ステップ

1. 必要なパッケージのインストール
2. MCP サーバークラスの作成
3. リソースとツールの定義と実装
4. 既存 API との統合
5. テスト実装
6. デプロイ設定

## 次のステップ

- [実装ガイド](./implementation_guide.md)を参照して基本概念を理解する
- [サンプル実装](./sample_implementation.md)を使って具体的な実装方法を確認する
- [利点とユースケース](./benefits_and_use_cases.md)を参考に機能を企画する
- 「フェーズ 1: 基本的な MCP サーバーの実装」から段階的に進める

## 参考リソース

- [Model Context Protocol 公式ドキュメント](https://modelcontextprotocol.io/)
- [MCP GitHub リポジトリ](https://github.com/modelcontextprotocol)
- [Anthropic の MCP 紹介記事](https://www.anthropic.com/news/model-context-protocol)
- [MCP サーバーの例](https://github.com/modelcontextprotocol/servers)
