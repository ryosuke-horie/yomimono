/**
 * RSSフィード定義
 * 購読対象のRSSフィードURLをハードコードで管理する
 * フィードの追加・削除はこのファイルを編集してデプロイする
 */

type FeedDefinition = {
	id: string;
	url: string;
	title: string;
};

export const FEED_DEFINITIONS: readonly FeedDefinition[] = [
	{
		id: "loglass-tech-blog",
		url: "https://zenn.dev/p/loglass/feed",
		title: "ログラス テックブログ",
	},
] as const;

export type { FeedDefinition };

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("FEED_DEFINITIONS は空でない配列である", () => {
		expect(FEED_DEFINITIONS.length).toBeGreaterThan(0);
	});

	test("各フィード定義は id, url, title を持つ", () => {
		for (const feed of FEED_DEFINITIONS) {
			expect(typeof feed.id).toBe("string");
			expect(typeof feed.url).toBe("string");
			expect(typeof feed.title).toBe("string");
			expect(feed.id.length).toBeGreaterThan(0);
			expect(feed.url.length).toBeGreaterThan(0);
			expect(feed.title.length).toBeGreaterThan(0);
		}
	});

	test("フィード ID は一意である", () => {
		const ids = FEED_DEFINITIONS.map((f) => f.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
}
