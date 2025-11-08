# Issue: Buttonコンポーネントをディレクトリ構成にそろえる

## 背景
- `frontend/src/components` 配下では Toast のみがディレクトリ構成で、Button/Modal などは単一ファイルに実装とテストが混在している。
- 今後 Storybook 化やバリエーション追加が進むと、単一ファイル構成では肥大化し可読性が落ちるリスクがある。
- まずは Button をディレクトリ管理へ移行し、index エクスポートなどのパターンを固めて他コンポーネントへ横展開する足掛かりにしたい。

## やること
- [ ] `frontend/src/components/Button/Button.tsx` へ移動し、公開エントリとして `frontend/src/components/Button/index.ts` を追加する。
- [ ] テストを `frontend/src/components/Button/Button.test.tsx` へ移し、関連 import を更新する。
- [ ] 既存の `import { Button } from "@/components/Button";` など利用箇所が壊れていないか確認し、必要があればパスを調整する。
- [ ] 変更後に `pnpm --filter frontend test:run` など最低限の回帰確認を行い、結果を記録する。

## 完了条件
- Button 関連ファイルがディレクトリ配下に集約され、ルート直下に不要なファイルが残っていない。
- Frontend テストが通り、動作確認結果を Issue コメントか PR 説明に記載している。
- 今後の他コンポーネント移行手順として再利用できるよう、PR でディレクトリ構成方針を共有している。
