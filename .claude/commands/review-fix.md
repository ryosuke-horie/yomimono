# PRに対して受けたレビューを読んで修正対応する

以下STEPに従ってください

## STEP

1. github mcpツールを使用します
2. PRに対して受けたレビューコメントを確認します
3. レビューコメントへの変更をTODOにプランニングします
4. 指摘に対して修正を加える
5. 確認用のコマンドを利用する。（下記コマンド集参考）
6. commit, pushを行う
7. 1分待機して、ghコマンドでCIの状況を確認する
8. 必要であればPR上で新しくコメントを追記する

## コマンド集

今回利用される可能性のある想定のコマンド集

- `git *`
- `gh *`
- `cd`
- `npm run format`
- `npm run typecheck`
- `npm run test`
- `npm run test:coverage`