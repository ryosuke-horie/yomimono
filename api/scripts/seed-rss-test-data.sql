-- テスト用のRSSフィードデータを追加
INSERT INTO rss_feeds (name, url, is_active) VALUES
  ('TechCrunch', 'https://techcrunch.com/feed/', true),
  ('Hacker News', 'https://hnrss.org/frontpage', true),
  ('DEV Community', 'https://dev.to/feed', false); -- 非アクティブなフィードのテスト用

-- 既存のテストデータがある場合は以下でクリア可能
-- DELETE FROM rss_feed_items;
-- DELETE FROM rss_batch_logs;