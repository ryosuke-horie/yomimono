---
name: rss-add
description: RSSフィード定義を追加する。指定URLのRSSフィードを検証し、api/src/config/feeds.ts に新しいフィード定義を追記する。
user-invocable: true
---

# RSS フィード追加スキル

RSSフィードの URL を受け取り、検証した上で `api/src/config/feeds.ts` の `FEED_DEFINITIONS` 配列に追記する。

## 引数

`/rss-add <URL>` の形式で呼び出す。`<URL>` は RSS/Atom フィードの URL。

## 処理手順

1. 引数から URL を取得する。URL が指定されていない場合は AskUserQuestion ツールで確認する

2. WebFetch ツールで URL の内容を取得する

3. 取得した内容が RSS 2.0 (`<rss>` タグ) または Atom (`<feed>` タグ) としてパース可能か確認する
   - パースできない場合はエラーメッセージを表示して終了する

4. フィードのタイトルを XML から取得する
   - RSS 2.0: `<channel><title>` の値
   - Atom: `<feed><title>` の値

5. フィード ID をタイトルから生成する
   - 日本語の場合はローマ字に変換せず、英語のキーワードを使う
   - kebab-case にする（例: "Zenn トレンド" -> "zenn-trend"）
   - 既存の ID と重複しないか `api/src/config/feeds.ts` を Read ツールで確認する

6. `api/src/config/feeds.ts` の `FEED_DEFINITIONS` 配列の最後のエントリの後に新しいエントリを Edit ツールで追記する
   ```typescript
   {
     id: "<生成したID>",
     url: "<指定されたURL>",
     title: "<取得したタイトル>",
   },
   ```

7. 追加結果をユーザーに表示する:
   - フィード ID
   - フィード URL
   - フィードタイトル
