-- article_labels テーブルを先に削除（labels への外部キー制約があるため）
DROP TABLE IF EXISTS `article_labels`;

-- labels テーブルを削除
DROP TABLE IF EXISTS `labels`;
