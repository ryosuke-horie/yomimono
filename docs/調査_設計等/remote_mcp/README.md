# リモートMCPサーバー調査・実装計画

## 調査結果

### 1. ローカルMCPサーバーとリモートMCPサーバーの違い

| 項目 | ローカルMCP | リモートMCP |
|-----|-----------|------------|
| **実行環境** | ローカルマシン | インターネット上（Cloudflare Workers等） |
| **アクセス範囲** | 個人利用のみ | 複数ユーザー、組織間で共有可能 |
| **認証** | なし | OAuth2.0、GitHub認証等 |
| **通信方式** | Stdio（標準入出力） | HTTP + SSE（Server-Sent Events） |
| **Claude連携** | Claude Desktop限定 | Claude Web版でも利用可能 |
| **セキュリティ** | ローカル実行のみ | トークンベース認証、権限管理 |
| **デプロイ** | 個別インストール | URLベースの配布 |

### 2. Claude Desktopでの設定方法

#### ローカルMCP（現在の設定）
```json
{
  "mcpServers": {
    "effective-yomimono-mcp": {
      "command": "node",
      "args": ["/path/to/build/index.js"],
      "env": {
        "API_BASE_URL": "https://effective-yomimono-api.ryosuke-horie37.workers.dev"
      }
    }
  }
}
```

#### リモートMCP（将来の設定）
```json
{
  "mcpServers": {
    "effective-yomimono-remote": {
      "url": "https://effective-yomimono-mcp.ryosuke-horie37.workers.dev",
      "oauth": {
        "clientId": "github_oauth_client_id",
        "authUrl": "https://github.com/login/oauth/authorize",
        "tokenUrl": "https://github.com/login/oauth/access_token"
      }
    }
  }
}
```

### 3. リモートMCPサーバーが満たすべき要件

#### 技術要件
- **HTTP/SSE通信**: Stdio transportの代わりにHTTPベースの通信
- **OAuth認証**: GitHub OAuth等の認証システム
- **ステートレス設計**: Cloudflare Workersで動作する
- **セキュリティ**: APIキー管理、権限制御
- **パフォーマンス**: 低レイテンシ、高可用性

#### 機能要件
- 既存のツール機能をすべてサポート
- 認証済みユーザーのみアクセス可能
- 適切なエラーハンドリング
- 使用量制限・レート制限

### 4. セキュリティ観点

#### 認証・認可
- **OAuth 2.0フロー**: GitHub認証による安全なアクセス
- **トークンベース認証**: アクセストークンによる権限管理
- **スコープ制限**: 必要最小限の権限のみ付与

#### データ保護
- **API通信の暗号化**: HTTPS必須
- **認証情報の安全な保管**: 環境変数での管理
- **アクセスログ**: 不正アクセスの監視

#### 権限制御
- **ユーザー固有のデータアクセス**: 他ユーザーのデータにアクセス不可
- **操作権限の制限**: 読み取り専用/書き込み権限の分離
- **レート制限**: DDoS攻撃の防止

### 5. Cloudflare環境での実装方法

#### 必要なコンポーネント
1. **Cloudflare Workers**: MCPサーバーのホスティング
2. **OAuth Provider**: GitHub OAuth App
3. **Durable Objects**: 永続化された接続管理（必要に応じて）
4. **KV Storage**: 設定データやキャッシュ（必要に応じて）

#### 実装アーキテクチャ
```
Claude Client 
    ↓ (HTTPS + SSE)
Cloudflare Workers (Remote MCP Server)
    ↓ (HTTPS)
Effective Yomimono API
    ↓
Cloudflare D1 Database
```

## 実装計画

### Phase 1: リモートMCP基盤実装
1. **OAuth認証システム構築**
   - GitHub OAuth Appの作成
   - 認証フローの実装
   - トークン管理

2. **HTTP/SSE通信実装**
   - Stdio transportからHTTP transportへの変更
   - SSE（Server-Sent Events）による双方向通信
   - McpAgent SDKの活用

3. **Cloudflare Workers設定**
   - Workers環境での実行
   - 環境変数の設定
   - ルーティングの実装

### Phase 2: 既存機能の移行
1. **ツール機能の移行**
   - 全17個のツールをリモート対応
   - 認証が必要な操作の特定
   - エラーハンドリングの強化

2. **API連携の調整**
   - 認証トークンによるAPI呼び出し
   - レート制限の実装
   - ログ記録の強化

### Phase 3: セキュリティ強化・運用準備
1. **セキュリティ実装**
   - 認証・認可の徹底
   - データアクセス制御
   - 監査ログ

2. **運用機能**
   - ヘルスチェック
   - メトリクス収集
   - エラー監視

### Phase 4: ユーザー体験向上
1. **Claude Web版対応**
   - WebブラウザからのMCP利用
   - 設定の簡素化

2. **ドキュメント整備**
   - セットアップガイド
   - トラブルシューティング

## 段階的移行プラン

### ステップ1: 並行運用
- ローカルMCPサーバーは継続運用
- リモートMCPサーバーを新規構築
- 両方のアクセス方法を提供

### ステップ2: 段階的移行
- 新機能はリモートMCPのみで提供
- ユーザーにリモートMCP利用を推奨
- フィードバック収集・改善

### ステップ3: 完全移行
- ローカルMCPサーバーのサポート終了
- リモートMCPへの完全移行
- ドキュメントの更新

## 技術的な検討事項

### 課題と対策
1. **レイテンシの増加**
   - 対策: Cloudflare Workersの低レイテンシ特性を活用
   - キャッシュ戦略の検討

2. **認証の複雑化**
   - 対策: OAuth実装の自動化
   - ユーザーフレンドリーな設定フロー

3. **運用コストの増加**
   - 対策: Cloudflare Workersの従量課金モデル活用
   - 適切な使用量制限

### 期待される効果
1. **アクセシビリティ向上**: Claude Web版での利用
2. **共有性向上**: 組織内でのMCPサーバー共有
3. **運用効率化**: 中央集権的な管理
4. **セキュリティ強化**: 適切な認証・認可