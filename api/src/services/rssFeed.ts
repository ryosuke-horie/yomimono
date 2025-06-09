import type { InsertRssFeed, RssFeed } from "../db/schema";
import { NotFoundError } from "../exceptions";
import type { RssFeedRepository } from "../interfaces/repository/rssFeed";
import type { RssFeedService as IRssFeedService } from "../interfaces/service/rssFeed";

export class RssFeedService implements IRssFeedService {
	constructor(private repository: RssFeedRepository) {}

	async getAllFeeds(): Promise<RssFeed[]> {
		return await this.repository.findAll();
	}

	async getFeedById(id: number): Promise<RssFeed> {
		const feed = await this.repository.findById(id);
		if (!feed) {
			throw new NotFoundError(`RSSフィードが見つかりません: ID ${id}`);
		}
		return feed;
	}

	async createFeed(data: InsertRssFeed): Promise<RssFeed> {
		// TODO: URLの有効性チェックやRSSフィードの検証を追加
		return await this.repository.create(data);
	}

	async updateFeed(id: number, data: Partial<InsertRssFeed>): Promise<RssFeed> {
		const updatedFeed = await this.repository.update(id, data);
		if (!updatedFeed) {
			throw new NotFoundError(`RSSフィードが見つかりません: ID ${id}`);
		}
		return updatedFeed;
	}

	async deleteFeed(id: number): Promise<void> {
		const success = await this.repository.delete(id);
		if (!success) {
			throw new NotFoundError(`RSSフィードが見つかりません: ID ${id}`);
		}
	}
}
