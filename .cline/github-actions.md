# GitHub Actions設計ドキュメント

## 概要
APIの自動テストとカバレッジチェックを行うCIパイプラインの設計。

## トリガー条件
- プッシュイベント
  - mainブランチへのプッシュ
  - apiディレクトリ配下の変更時のみ
- プルリクエストイベント
  - apiディレクトリ配下の変更時のみ

## ジョブ構成

### テストジョブ（test）

#### 環境
- runs-on: ubuntu-latest
- Node.js: 20.x

#### ステップ
1. チェックアウト
```yaml
- uses: actions/checkout@v4
```

2. Node.jsセットアップ
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20.x
    cache: npm
    cache-dependency-path: api/package-lock.json
```

3. 依存関係インストール
```yaml
- run: |
    cd api
    npm ci
```

4. テスト実行とカバレッジ収集
```yaml
- name: Run tests with coverage
  run: |
    cd api
    npm test -- --coverage
```

5. カバレッジチェック
```yaml
- name: Check coverage threshold
  run: |
    cd api
    COVERAGE=$(cat coverage/coverage-summary.json | jq -r '.total.statements.pct')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage ($COVERAGE%) is below threshold (80%)"
      exit 1
    fi
```

6. PRコメント投稿
```yaml
- name: Post coverage comment
  if: github.event_name == 'pull_request'
  uses: marocchino/sticky-pull-request-comment@v2
  with:
    header: test-coverage
    message: |
      ### テストカバレッジレポート
      
      全体のカバレッジ: ${COVERAGE}%
      
      閾値: 80%
      
      ${COVERAGE_DETAIL}
```

## 必要な権限

### GITHUB_TOKEN
- `pull-requests: write`: PRへのコメント投稿権限
- `contents: read`: リポジトリ内容の読み取り権限

```yaml
permissions:
  pull-requests: write
  contents: read
```

## エラー処理
1. カバレッジが80%未満の場合
   - ジョブを失敗させる
   - PRの場合はコメントで詳細を通知

2. テスト失敗時
   - ジョブを失敗させる
   - エラー内容をGitHub Actionsのログに出力
   - PRの場合はコメントでテスト失敗を通知

## 追加設定
- Working Directory: api/
- Node.js環境のキャッシュ設定
- テスト結果とカバレッジレポートのアーティファクト保存

## 注意事項
1. カバレッジチェックは statements coverage を基準とする
2. PRコメントは既存のコメントを更新する形式で投稿（重複防止）
3. mainブランチのプッシュ時はコメント投稿をスキップ
4. テスト実行時はproduction環境の環境変数を使用