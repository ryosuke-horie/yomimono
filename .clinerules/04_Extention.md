# Extension

## 概要

ローカルで読み込みを行って運用している拡張機能。
開いているタブのリンクとURLを収集し、APIにPOSTする。

## ディレクトリ構成

```
.
├── background.js ... エントリーポイント。
├── biome.json
├── bun.lock
├── images ... 拡張機能用のアイコンを配置
│   ├── icon128.png
│   ├── icon16.png
│   └── icon48.png
├── knip.config.ts
├── manifest.json
├── package-lock.json
├── package.json
└── popup ... 拡張機能アイコンを押下した時のUIを配置
    ├── popup.css
    ├── popup.html
    └── popup.js
```