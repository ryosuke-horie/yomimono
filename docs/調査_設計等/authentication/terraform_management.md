# Cloudflare AccessのTerraformによる管理

## 概要

この文書では、Effective YomimonoプロジェクトにおけるCloudflare Zero TrustとCloudflare Accessの設定をTerraformを使用して自動化・管理する方法について詳述します。インフラストラクチャのコード化（IaC）アプローチにより、一貫性のある環境構築と設定管理を実現します。

## Terraformによる管理の利点

Cloudflare AccessをTerraformで管理する主な利点：

1. **設定の一貫性**
   - 環境間での設定の不一致を防止
   - 構成のドリフトを検出・修正

2. **バージョン管理**
   - GitなどのVCSでアクセス設定の変更履歴を保持
   - 設定変更の監査証跡を維持

3. **自動化**
   - 手動設定のミスを減少
   - CI/CDパイプラインとの統合

4. **再現性**
   - 開発、テスト、本番環境を一貫して構築可能
   - 災害復旧シナリオでの迅速な環境再構築

## Terraformプロバイダーの設定

Cloudflare Terraformプロバイダーの基本設定：

```hcl
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  required_version = ">= 1.0.0"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# APIトークンは変数として定義
variable "cloudflare_api_token" {
  description = "Cloudflare API Token with Zero Trust permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}
```

## Zero Trustアカウントの管理

Cloudflare Zero Trustアカウントの設定（注：現在のTerraformプロバイダーではZero Trustアカウント自体の作成はサポートされておらず、事前にダッシュボードで作成する必要があります）：

```hcl
# 既存のZero Trustアカウントを参照するデータソース
data "cloudflare_accounts" "current" {
  name = var.cloudflare_account_name
}

locals {
  account_id = data.cloudflare_accounts.current.accounts[0].id
}

# アカウント設定の出力
output "zero_trust_account_id" {
  value = local.account_id
}
```

## アクセスアプリケーションの管理

Cloudflare Accessアプリケーション（フロントエンドとバックエンドAPI）の定義：

```hcl
# フロントエンドアプリケーションの定義
resource "cloudflare_access_application" "frontend" {
  account_id                = local.account_id
  name                      = "Effective Yomimono Frontend"
  domain                    = "app.effective-yomimono.yourdomain.com"
  type                      = "self_hosted"
  session_duration          = "24h"
  auto_redirect_to_identity = true
}

# バックエンドAPIアプリケーションの定義
resource "cloudflare_access_application" "api" {
  account_id       = local.account_id
  name             = "Effective Yomimono API"
  domain           = "api.effective-yomimono.yourdomain.com"
  type             = "self_hosted"
  session_duration = "24h"
}
```

## アクセスポリシーの管理

フロントエンドとバックエンドのアクセスポリシー設定：

```hcl
# フロントエンド用ユーザー認証ポリシー
resource "cloudflare_access_policy" "frontend_auth" {
  account_id     = local.account_id
  application_id = cloudflare_access_application.frontend.id
  name           = "Frontend Authentication"
  precedence     = 1
  decision       = "allow"

  # メールアドレスベースのアクセス許可
  include {
    email = ["your-email@example.com"]
    # または以下の認証方法も利用可能
    # github {
    #   name = "example-org"
    # }
    # google {
    #   identity = "example@gmail.com"
    # }
  }
}

# APIサービストークンポリシー
resource "cloudflare_access_policy" "api_service_token" {
  account_id     = local.account_id
  application_id = cloudflare_access_application.api.id
  name           = "API Service Token"
  precedence     = 1
  decision       = "allow"

  # サービストークンによるアクセス許可
  include {
    service_token = [cloudflare_access_service_token.api_token.id]
  }
}
```

## サービストークンの管理

API通信用のサービストークンの生成と管理：

```hcl
# APIアクセス用サービストークンの生成
resource "cloudflare_access_service_token" "api_token" {
  account_id = local.account_id
  name       = "frontend-to-api-token"
}

# 生成されたトークン情報の出力（セキュアな取り扱いが必要）
output "service_token_client_id" {
  value     = cloudflare_access_service_token.api_token.client_id
  sensitive = true
}

output "service_token_client_secret" {
  value     = cloudflare_access_service_token.api_token.client_secret
  sensitive = true
}
```

## Cloudflare Workersの設定

Cloudflare WorkersとCloudflare Accessの統合設定：

```hcl
# フロントエンドWorkerの定義
resource "cloudflare_worker_script" "frontend_worker" {
  account_id = local.account_id
  name       = "frontend-worker"
  content    = file("${path.module}/scripts/frontend_worker.js")
  
  # 環境変数設定
  plain_text_binding {
    name = "CF_ACCESS_CLIENT_ID"
    text = cloudflare_access_service_token.api_token.client_id
  }
  
  secret_text_binding {
    name = "CF_ACCESS_CLIENT_SECRET"
    text = cloudflare_access_service_token.api_token.client_secret
  }
}

# APIバックエンドWorkerの定義
resource "cloudflare_worker_script" "api_worker" {
  account_id = local.account_id
  name       = "api-worker"
  content    = file("${path.module}/scripts/api_worker.js")
  
  # 環境変数設定（検証用）
  plain_text_binding {
    name = "CF_ACCESS_CLIENT_ID"
    text = cloudflare_access_service_token.api_token.client_id
  }
  
  secret_text_binding {
    name = "CF_ACCESS_CLIENT_SECRET"
    text = cloudflare_access_service_token.api_token.client_secret
  }
}
```

## Workers用カスタムドメインの設定

Workersのカスタムドメイン設定：

```hcl
# フロントエンド用カスタムドメイン
resource "cloudflare_worker_route" "frontend_route" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "app.effective-yomimono.yourdomain.com/*"
  script_name = cloudflare_worker_script.frontend_worker.name
}

# API用カスタムドメイン
resource "cloudflare_worker_route" "api_route" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "api.effective-yomimono.yourdomain.com/*"
  script_name = cloudflare_worker_script.api_worker.name
}
```

## DNSレコードの管理

必要なDNSレコードの設定：

```hcl
# フロントエンド用DNSレコード
resource "cloudflare_record" "frontend" {
  zone_id = var.cloudflare_zone_id
  name    = "app"
  value   = "100::"  # Cloudflare Workersは特殊なIPを使用
  type    = "AAAA"
  proxied = true
}

# API用DNSレコード
resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = "100::"  # Cloudflare Workersは特殊なIPを使用
  type    = "AAAA"
  proxied = true
}
```

## WAFとレート制限の設定

セキュリティ強化のためのWAFとレート制限の設定：

```hcl
# APIエンドポイントのレート制限ルール
resource "cloudflare_rate_limit" "api_rate_limit" {
  zone_id    = var.cloudflare_zone_id
  threshold  = 100
  period     = 1
  match {
    request {
      url_pattern = "api.effective-yomimono.yourdomain.com/*"
      schemes     = ["HTTP", "HTTPS"]
      methods     = ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
  }
  action {
    mode    = "simulate"
    timeout = 300
    response {
      content_type = "application/json"
      body         = "{\"error\": \"Rate limit exceeded\", \"status\": 429}"
    }
  }
  disabled   = false
  description = "API Rate Limiting"
}

# WAFルールの設定
resource "cloudflare_waf_rule" "api_waf" {
  zone_id = var.cloudflare_zone_id
  rule_id = "api-protection-rule"
  mode    = "on"
}
```

## 実装のためのファイル構成

効率的なTerraform管理のためのファイル構成：

```
terraform/
├── main.tf              # メインの設定ファイル
├── variables.tf         # 変数定義
├── outputs.tf           # 出力定義
├── access.tf            # Access関連の設定
├── workers.tf           # Workers関連の設定
├── dns.tf               # DNS関連の設定
├── security.tf          # WAF、レート制限の設定
├── scripts/             # Workerスクリプト
│   ├── frontend_worker.js
│   └── api_worker.js
└── terraform.tfvars.example  # 変数のサンプルファイル
```

## 状態管理と機密情報の扱い

Terraformの状態ファイルと機密情報の安全な管理：

```hcl
# リモート状態管理の設定（例：Terraform Cloud）
terraform {
  backend "remote" {
    organization = "your-organization"
    workspaces {
      name = "effective-yomimono-infrastructure"
    }
  }
}
```

機密情報を安全に管理するためのベストプラクティス：

1. **.tfvarsファイルをGit管理対象外に**
   ```
   # .gitignore
   *.tfvars
   ```

2. **環境変数を使用**
   ```bash
   export TF_VAR_cloudflare_api_token="your-api-token"
   ```

3. **Terraform Cloudの変数機能を利用**
   - Terraform CloudのUI上で機密変数を設定
   - 「Sensitive」フラグを有効化

## サービストークンのローテーション戦略

セキュリティを維持するためのサービストークンローテーション戦略：

```hcl
# 新旧サービストークンを管理するアプローチ
resource "cloudflare_access_service_token" "api_token_current" {
  account_id = local.account_id
  name       = "frontend-to-api-token-${formatdate("YYYYMMDD", timestamp())}"
}

# 古いトークンを一定期間残す（移行のため）
resource "cloudflare_access_policy" "api_service_token" {
  account_id     = local.account_id
  application_id = cloudflare_access_application.api.id
  name           = "API Service Token Policy"
  precedence     = 1
  decision       = "allow"

  include {
    service_token = [
      cloudflare_access_service_token.api_token_current.id,
      var.previous_token_id # 古いトークンID（必要に応じて）
    ]
  }
}
```

## トークン情報の安全な管理

生成されたトークンを安全に管理するためのパイプライン設定：

```yaml
# 例：GitHub Actions workflowファイル
name: Deploy Terraform Configuration

on:
  push:
    branches: [ main ]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Terraform Init
        run: terraform init
        env:
          TF_API_TOKEN: ${{ secrets.TF_API_TOKEN }}
          
      - name: Terraform Apply
        run: terraform apply -auto-approve
        env:
          TF_API_TOKEN: ${{ secrets.TF_API_TOKEN }}
          
      - name: Extract Tokens
        run: |
          CLIENT_ID=$(terraform output -raw service_token_client_id)
          CLIENT_SECRET=$(terraform output -raw service_token_client_secret)
          echo "::add-mask::$CLIENT_ID"
          echo "::add-mask::$CLIENT_SECRET"
          echo "CLIENT_ID=$CLIENT_ID" >> $GITHUB_ENV
          echo "CLIENT_SECRET=$CLIENT_SECRET" >> $GITHUB_ENV
          
      - name: Update Secret Storage
        uses: microsoft/variable-substitution@v1
        with:
          files: '.env.template'
        env:
          CF_ACCESS_CLIENT_ID: ${{ env.CLIENT_ID }}
          CF_ACCESS_CLIENT_SECRET: ${{ env.CLIENT_SECRET }}
```

## テラフォームリソースのインポート

既存のCloudflare Access設定をTerraformでインポートする方法：

```bash
# 既存のアクセスアプリケーションをインポートする例
terraform import cloudflare_access_application.frontend account_id/app_id

# 既存のアクセスポリシーをインポートする例
terraform import cloudflare_access_policy.frontend_auth account_id/app_id/policy_id

# 既存のサービストークンをインポートする例（注：シークレットは再取得できない）
terraform import cloudflare_access_service_token.api_token account_id/token_id
```

## 考慮事項とリスク

Terraformで管理する際の考慮事項とリスク：

1. **ステート管理**
   - ステートファイルには機密情報が含まれるため、安全な保存が必須
   - リモートバックエンド利用を推奨

2. **APIトークン権限**
   - Terraform用のAPIトークンは強力な権限を持つため、適切な保護が必要
   - 最小権限の原則に基づき適切な権限設定を行う

3. **サービストークンの機密情報**
   - 生成されたサービストークンの安全な配布方法を計画する
   - ビルドパイプラインでの適切な機密情報処理を実装

4. **変更の影響**
   - Terraformの適用は即時反映されるため、運用中のシステムへの影響を考慮
   - 重要な変更は運用時間外に適用することを検討

5. **設定の依存関係**
   - リソース間の依存関係を理解し、適切な順序で適用
   - 破壊的変更の影響を把握

## まとめ

Cloudflare Zero TrustとCloudflare AccessをTerraformで管理することで、Effective Yomimonoプロジェクトの認証・認可インフラを効率的かつ一貫性を持って管理できます。コードによるインフラ定義により、設定変更の追跡、環境間の一貫性の維持、自動化された展開が可能になります。

サービストークンはTerraformで生成・管理できますが、生成されたシークレット情報の安全な取り扱いには十分な注意が必要です。適切なセキュリティプラクティスを適用することで、Terraformを用いた効果的なインフラ管理が実現できます。

## 参考リソース

- [Cloudflare Terraformプロバイダー公式ドキュメント](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [Cloudflare Access Terraformリソースリファレンス](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/access_application)
- [Terraform状態管理ベストプラクティス](https://www.terraform.io/docs/cloud/guides/recommended-practices/part1.html)
- [TerraformセキュリティベストプラクティスAzureサンプル](https://learn.microsoft.com/ja-jp/azure/developer/terraform/best-practices-end-to-end-testing)