# Frontend

## ディレクトリ構成

```
.
├── knip.config.ts
├── next.config.mjs ... Next.jsのコンフィグファイル
├── open-next.config.ts ... OpenNextのコンフィグファイル(Cloudflareにホストするため)
├── package-lock.json
├── package.json
├── public
│   └── icon.webp
├── src
│   ├── app ... URLパスに影響するトップレベルのソースコード。基本的にcomponentsを呼び出してページを組み立てる役割。
│   │   ├── error.tsx
│   │   ├── favorites
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── components ... コンポーネント定義を記載。ロジック部分は積極的にhooksに実装。
│   │   ├── BookmarkCard.tsx
│   │   ├── BookmarksList.tsx
│   │   └── Header.tsx
│   ├── hooks ... カスタムフックを記載。
│   │   └── useBookmarks.ts
│   ├── lib ... libと言いつつConfigが記載されている。
│   │   └── api
│   └── types ... 型定義
│       ├── api.ts
│       └── bookmark.ts
├── tsconfig.json
└── wrangler.jsonc
```

## 静的解析

`knip`, `Biome`を採用。
CIでPull Requestに対して検証されるため、必ずパスする必要がある。

## テスト

- フロントエンドのテストは現状存在しない。
- DOMに由来するテストはFlakyでページ数や機能の少ない現状ではテストを書く恩恵が薄いため。

## 主要なライブラリ構成

- Next.js ... メインフレームワーク
- @opennextjs/cloudflare ... cloudflareにNextjsをデプロイするために利用
- TailwindCSS ... UIをTailwindで記載している