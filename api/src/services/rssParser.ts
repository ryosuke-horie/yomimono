import { XMLParser } from "fast-xml-parser";
import { ValidationError } from "../exceptions";
import type { Article } from "../types/rss";

/**
 * RSSフィードをパースするサービス
 */
export class RSSParser {
	private parser: XMLParser;

	constructor() {
		this.parser = new XMLParser({
			ignoreAttributes: false,
			parseAttributeValue: true,
		});
	}

	/**
	 * RSS/Atomフィードをパースして記事データを取得する
	 * @param feedData フィードのXML文字列
	 * @returns 記事の配列
	 * @throws パースが失敗した場合またはサポートされていない形式の場合
	 */
	async parseFeed(feedData: string): Promise<Article[]> {
		const result = this.parser.parse(feedData);

		if (result.rss?.channel) {
			return this.parseRSS2(result.rss.channel);
		}

		if (result.feed) {
			return this.parseAtom(result.feed);
		}

		throw new ValidationError("Unsupported feed format");
	}

	/**
	 * RSS 2.0形式のフィードをパースする
	 * @param channel RSSチャンネルデータ
	 * @returns 記事の配列
	 */
	// biome-ignore lint/suspicious/noExplicitAny: XMLパーサーの出力は型が不明
	private parseRSS2(channel: any): Article[] {
		const items = Array.isArray(channel.item) ? channel.item : [channel.item];

		// biome-ignore lint/suspicious/noExplicitAny: XMLパーサーの出力は型が不明
		return items.filter(Boolean).map((item: any) => {
			const article: Article = {
				guid: item.guid || item.link,
				url: item.link,
				title: item.title,
				description: item.description,
				author: item.author,
			};

			if (item.pubDate) {
				article.publishedAt = new Date(item.pubDate);
			}

			if (item.category) {
				const categories = Array.isArray(item.category)
					? item.category
					: [item.category];
				article.categories = categories;
			}

			return article;
		});
	}

	/**
	 * Atom形式のフィードをパースする
	 * @param feed Atomフィードデータ
	 * @returns 記事の配列
	 */
	// biome-ignore lint/suspicious/noExplicitAny: XMLパーサーの出力は型が不明
	private parseAtom(feed: any): Article[] {
		const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

		// biome-ignore lint/suspicious/noExplicitAny: XMLパーサーの出力は型が不明
		return entries.filter(Boolean).map((entry: any) => {
			const article: Article = {
				guid: entry.id,
				url: this.getAtomLink(entry.link),
				title: entry.title,
				description: entry.summary || entry.content,
			};

			if (entry.updated) {
				article.publishedAt = new Date(entry.updated);
			}

			if (entry.author?.name) {
				article.author = entry.author.name;
			}

			if (entry.category) {
				const categories = Array.isArray(entry.category)
					? entry.category
					: [entry.category];
				article.categories = categories.map(
					// biome-ignore lint/suspicious/noExplicitAny: XMLパーサーの出力は型が不明
					(cat: any) => cat["@_term"] || cat.term || cat,
				);
			}

			return article;
		});
	}

	/**
	 * AtomエントリからURLを取得する
	 * @param link リンクデータ
	 * @returns URL文字列
	 */
	// biome-ignore lint/suspicious/noExplicitAny: XMLパーサーの出力は型が不明
	private getAtomLink(link: any): string {
		if (typeof link === "string") {
			return link;
		}
		if (Array.isArray(link)) {
			return link[0]["@_href"] || link[0].href || link[0];
		}
		return link["@_href"] || link.href || "";
	}
}
