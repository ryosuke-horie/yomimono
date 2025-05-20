/**
 * RSSフィードを取得するサービス
 */
export class RSSFetcher {
	/**
	 * 指定されたURLからRSSフィードを取得する
	 * @param url RSSフィードのURL
	 * @returns RSSフィードのXML文字列
	 * @throws 取得が失敗した場合
	 */
	async fetchFeed(url) {
		console.log(`RSSフィード取得開始: ${url}`);
		const startTime = Date.now();
		try {
			const response = await Promise.race([
				fetch(url, {
					headers: {
						"User-Agent": "Yomimono RSS Reader 1.0",
						Accept: "application/rss+xml, application/xml, text/xml",
					},
					cf: {
						cacheEverything: true,
						cacheTtl: 300, // 5分間キャッシュ
					},
				}),
				// 30秒でタイムアウト
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error("RSS fetch timeout")), 30000),
				),
			]);
			const elapsedTime = Date.now() - startTime;
			console.log(`RSSフィード取得完了: ${url} (${elapsedTime}ms)`);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch RSS: ${response.status} ${response.statusText}`,
				);
			}
			const text = await response.text();
			console.log(`RSSデータサイズ: ${text.length}文字`);
			return text;
		} catch (error) {
			const elapsedTime = Date.now() - startTime;
			console.error(`RSSフィード取得エラー: ${url} (${elapsedTime}ms)`, error);
			throw error;
		}
	}
}
