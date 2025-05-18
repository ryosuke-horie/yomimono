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
	async fetchFeed(url: string): Promise<string> {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Yomimono RSS Reader 1.0",
				Accept: "application/rss+xml, application/xml, text/xml",
			},
			cf: {
				cacheEverything: true,
				cacheTtl: 300, // 5分間キャッシュ
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch RSS: ${response.status}`);
		}

		return response.text();
	}
}
