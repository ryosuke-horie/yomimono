import { HTTPException } from "hono/http-exception";
export class RssFeedService {
	repository;
	constructor(repository) {
		this.repository = repository;
	}
	async getAllFeeds() {
		return await this.repository.findAll();
	}
	async getFeedById(id) {
		const feed = await this.repository.findById(id);
		if (!feed) {
			throw new HTTPException(404, {
				message: `RSSフィードが見つかりません: ID ${id}`,
			});
		}
		return feed;
	}
	async createFeed(data) {
		// TODO: URLの有効性チェックやRSSフィードの検証を追加
		return await this.repository.create(data);
	}
	async updateFeed(id, data) {
		const updatedFeed = await this.repository.update(id, data);
		if (!updatedFeed) {
			throw new HTTPException(404, {
				message: `RSSフィードが見つかりません: ID ${id}`,
			});
		}
		return updatedFeed;
	}
	async deleteFeed(id) {
		const success = await this.repository.delete(id);
		if (!success) {
			throw new HTTPException(404, {
				message: `RSSフィードが見つかりません: ID ${id}`,
			});
		}
	}
}
