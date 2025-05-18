# Lefthook完全クリーンアップ手順

## 実施日時
2025-05-18

## 実施内容

### 1. Gitフックファイルのバックアップと削除
以下のファイルをバックアップしてから削除しました：
- `.git/hooks/pre-commit` → `/tmp/lefthook-backup/pre-commit`
- `.git/hooks/prepare-commit-msg` → `/tmp/lefthook-backup/prepare-commit-msg`

バックアップファイルは以下で確認できます：
```bash
ls -la /tmp/lefthook-backup/
```

### 2. lefthook.checksumファイルの削除
- 削除前の内容: `451f886ed3bb13948431028f4d0e1017 1746346868`
- 削除済み: `.git/info/lefthook.checksum`

### 3. 残存するlefthook関連項目

#### Git設定に残っているブランチ情報
```
branch.feature/lefthook-setup-issue334.remote=origin
branch.feature/lefthook-setup-issue334.merge=refs/heads/feature/lefthook-setup-issue334
branch.feature/add-knip-to-lefthook.remote=origin  
branch.feature/add-knip-to-lefthook.merge=refs/heads/feature/add-knip-to-lefthook
```

これらのブランチ設定は削除しても問題ありません。

### 4. 完全クリーンアップのための追加手順

#### 不要なブランチ設定の削除
```bash
# 個別に削除
git config --unset-all branch.feature/lefthook-setup-issue334.remote
git config --unset-all branch.feature/lefthook-setup-issue334.merge
git config --unset-all branch.feature/add-knip-to-lefthook.remote
git config --unset-all branch.feature/add-knip-to-lefthook.merge

# ローカルブランチが残っていれば削除
git branch -d feature/lefthook-setup-issue334 2>/dev/null || true
git branch -d feature/add-knip-to-lefthook 2>/dev/null || true
```

### 5. クリーンアップ完了確認

以下のコマンドで残存するlefthook関連の設定がないことを確認：
```bash
# Git設定の確認
git config --list | grep lefthook

# ファイルシステムの確認
find . -name '*lefthook*' ! -path './node_modules/*' ! -path './.git/*' ! -path './*/node_modules/*'
```

## バックアップファイルの取り扱い

バックアップファイルは `/tmp/lefthook-backup/` に保存されています。
内容を確認し、必要なければ以下のコマンドで削除してください：

```bash
rm -rf /tmp/lefthook-backup
```

## まとめ

1. Gitフックファイル（pre-commit, prepare-commit-msg）のバックアップと削除：✅
2. lefthook.checksumファイルの削除：✅  
3. Git設定に残るブランチ設定の確認と削除手順の文書化：✅
4. プロジェクト内のlefthook関連ファイルの確認（該当なし）：✅

lefthookの痕跡はGitフックファイルとchecksumファイル以外にはGit設定のブランチ情報のみでした。