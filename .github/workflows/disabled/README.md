# 無効化されたワークフロー

## GitHub Actions無料枠制限による一時的な無効化

このディレクトリには、GitHub Actions無料枠の制限により一時的に無効化されたワークフローファイルが保存されています。

### 無効化されたワークフロー

- `ci-github-hosted.yml.disabled`: GitHub-hosted runnerを使用するCI（E2Eテスト含む）

### 有効化方法

GitHub Actions無料枠が復活した際は、以下の手順で再有効化してください：

1. `.disabled` 拡張子を削除
2. ファイルを `.github/workflows/` ディレクトリに移動
3. ファイル内のコメント（`# DISABLED:` 部分）を削除

```bash
# 例: E2Eテストワークフローの再有効化
mv .github/workflows/disabled/ci-github-hosted.yml.disabled .github/workflows/ci-github-hosted.yml
# ファイル内のDISABLEDコメントを手動で削除
```

### 注意事項

- 削除ではなく無効化のため、設定は保持されます
- E2Eテストは手動での動作確認に切り替えてください
- 必要に応じて self-hosted runner での E2E実行を検討してください