import { desc, eq } from "drizzle-orm";
import { type D1Database, drizzle } from "drizzle-orm/d1";
import {
	type InsertRssBatchLog,
	type RssBatchLog,
	rssBatchLogs,
} from "../db/schema";

export class RssBatchLogRepository {
	private db;
	public rssBatchLogsTable = rssBatchLogs;

	constructor(d1Database: D1Database) {
		this.db = drizzle(d1Database);
	}

	async create(log: InsertRssBatchLog): Promise<RssBatchLog> {
		const result = await this.db
			.insert(rssBatchLogs)
			.values(log)
			.returning()
			.all();

		return result[0];
	}

	async update(
		id: number,
		data: Partial<InsertRssBatchLog>,
	): Promise<RssBatchLog> {
		const result = await this.db
			.update(rssBatchLogs)
			.set(data)
			.where(eq(rssBatchLogs.id, id))
			.returning()
			.all();

		return result[0];
	}

	async findByFeedId(feedId: number): Promise<RssBatchLog[]> {
		return await this.db
			.select()
			.from(rssBatchLogs)
			.where(eq(rssBatchLogs.feedId, feedId))
			.orderBy(desc(rssBatchLogs.createdAt))
			.all();
	}

	async findLatestByFeedId(feedId: number): Promise<RssBatchLog | undefined> {
		return await this.db
			.select()
			.from(rssBatchLogs)
			.where(eq(rssBatchLogs.feedId, feedId))
			.orderBy(desc(rssBatchLogs.createdAt))
			.get();
	}
}
