# アクセス制御

## フロントエンドへのアクセス制御

`https://effective-yomimono.ryosuke-horie37.workers.dev`へのアクセスに対してCloudflare Accessによって私のGmailアカウントによりログインされていることを確認してアクセス制御を行なっています。

### 設定に当たり追加で知っておくべきこと

- Googleアカウントで制御を加えたかったため、Google Cloud上でOAuhtクライアントの作成を行なっています
- 実際の手順
    - `https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/google/`この手順に従いGoogle設定とZero Trustにログイン方法としてGoogleを追加
    - Cloudflare Zero TrustのAccess＞Policyを作成
    - 必須ルールに自分のGmailアカウントを設定
    - Policyをアプリケーションドメインに対して適用
- アクセス時にどうなるか
    - Cloudflare Accessの画面になり、Zero Trustのログイン方法が選べる
    - Gmailでログインするとリダイレクトされ、フロントエンドが表示