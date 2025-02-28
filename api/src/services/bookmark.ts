import type { InsertBookmark } from "../db/schema";
import type { BookmarkRepository } from "../repositories/bookmark";

export interface BookmarkService {
	createBookmarksFromUrls(urls: string[]): Promise<void>;
}

export class DefaultBookmarkService implements BookmarkService {
	constructor(private readonly repository: BookmarkRepository) {}

	async createBookmarksFromUrls(urls: string[]): Promise<void> {
		const bookmarks = await Promise.all(
			urls.map(async (url) => {
				const title = await this.fetchTitleFromUrl(url);
				return {
					url,
					title,
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				} satisfies InsertBookmark;
			}),
		);

		await this.repository.createMany(bookmarks);
	}

	private async fetchTitleFromUrl(url: string): Promise<string | null> {
		try {
			const response = await fetch(url);
			const html = await response.text();
			const titleMatch = html.match(/<title>(.*?)<\/title>/i);
			return titleMatch ? titleMatch[1] : null;
		} catch (error) {
			console.error(`Failed to fetch title for ${url}:`, error);
			return null;
		}
	}
}
