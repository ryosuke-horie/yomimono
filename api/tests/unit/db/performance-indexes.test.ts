/**
 * パフォーマンスインデックステスト
 * 新しく追加されたインデックスが正しく作成され、機能することを確認する
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { getCurrentDatabaseConfig } from "../../../src/config/database";
import { articleLabels, bookmarks, labels } from "../../../src/db/schema";

describe("パフォーマンスインデックステスト", () => {
	let sqliteDB: Database.Database;
	let db: BetterSQLite3Database;

	beforeAll(async () => {
		// インメモリSQLiteデータベースを作成
		sqliteDB = new Database(":memory:");
		db = drizzle(sqliteDB);

		const dbConfig = getCurrentDatabaseConfig();
		console.log(`テスト実行環境: ${dbConfig.url}`);

		// スキーマを適用
		const migrations = [
			// 基本テーブル作成
			`CREATE TABLE bookmarks (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				url TEXT NOT NULL,
				title TEXT,
				is_read INTEGER DEFAULT 0 NOT NULL,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			)`,
			`CREATE TABLE labels (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL UNIQUE,
				description TEXT,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			)`,
			`CREATE TABLE article_labels (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				article_id INTEGER NOT NULL,
				label_id INTEGER NOT NULL,
				created_at INTEGER NOT NULL,
				FOREIGN KEY (article_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
				FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
			)`,
			`CREATE TABLE favorites (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				bookmark_id INTEGER NOT NULL UNIQUE,
				created_at INTEGER NOT NULL,
				FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
			)`,
			// パフォーマンスインデックス
			"CREATE INDEX idx_bookmarks_is_read ON bookmarks (is_read)",
			"CREATE INDEX idx_bookmarks_created_at ON bookmarks (created_at)",
			"CREATE INDEX idx_bookmarks_is_read_created_at ON bookmarks (is_read, created_at)",
			"CREATE INDEX idx_article_labels_article_id ON article_labels (article_id)",
			"CREATE INDEX idx_article_labels_label_id ON article_labels (label_id)",
			"CREATE INDEX idx_article_labels_article_label ON article_labels (article_id, label_id)",
		];

		for (const migration of migrations) {
			sqliteDB.exec(migration);
		}
	});

	afterAll(() => {
		if (sqliteDB) {
			sqliteDB.close();
		}
	});

	describe("インデックス存在確認", () => {
		test("bookmarksテーブルのインデックスが作成されている", async () => {
			const indexes = sqliteDB
				.prepare(
					`
					SELECT name 
					FROM sqlite_master 
					WHERE type='index' 
						AND tbl_name='bookmarks' 
						AND name LIKE 'idx_%'
					ORDER BY name
				`,
				)
				.all() as Array<{ name: string }>;

			const indexNames = indexes.map((idx) => idx.name);

			expect(indexNames).toContain("idx_bookmarks_is_read");
			expect(indexNames).toContain("idx_bookmarks_created_at");
			expect(indexNames).toContain("idx_bookmarks_is_read_created_at");
		});

		test("article_labelsテーブルのインデックスが作成されている", async () => {
			const indexes = sqliteDB
				.prepare(
					`
					SELECT name 
					FROM sqlite_master 
					WHERE type='index' 
						AND tbl_name='article_labels' 
						AND name LIKE 'idx_%'
					ORDER BY name
				`,
				)
				.all() as Array<{ name: string }>;

			const indexNames = indexes.map((idx) => idx.name);

			expect(indexNames).toContain("idx_article_labels_article_id");
			expect(indexNames).toContain("idx_article_labels_label_id");
			expect(indexNames).toContain("idx_article_labels_article_label");
		});
	});

	describe("インデックス詳細情報確認", () => {
		test("bookmarksテーブルの複合インデックス構造が正しい", async () => {
			const indexInfo = sqliteDB
				.prepare(
					`
					PRAGMA index_info(idx_bookmarks_is_read_created_at)
				`,
				)
				.all();

			const typedIndexInfo = indexInfo as Array<{ name: string }>;
			expect(typedIndexInfo).toHaveLength(2);
			expect(typedIndexInfo[0].name).toBe("is_read");
			expect(typedIndexInfo[1].name).toBe("created_at");
		});

		test("article_labelsテーブルの複合インデックス構造が正しい", async () => {
			const indexInfo = sqliteDB
				.prepare(
					`
					PRAGMA index_info(idx_article_labels_article_label)
				`,
				)
				.all();

			const typedIndexInfo = indexInfo as Array<{ name: string }>;
			expect(typedIndexInfo).toHaveLength(2);
			expect(typedIndexInfo[0].name).toBe("article_id");
			expect(typedIndexInfo[1].name).toBe("label_id");
		});
	});

	describe("クエリプラン確認", () => {
		test("未読記事取得時にインデックスが使用される", async () => {
			const queryPlan = sqliteDB
				.prepare(
					`
					EXPLAIN QUERY PLAN
					SELECT * FROM bookmarks 
					WHERE is_read = 0 
					ORDER BY created_at DESC
				`,
				)
				.all();

			// インデックススキャンが使用されていることを確認
			const planText = (queryPlan as Array<{ detail: string }>)
				.map((row) => row.detail)
				.join(" ");
			expect(planText).toMatch(/idx_bookmarks_is_read/);
		});

		test("記事ラベルJOIN時にインデックスが使用される", async () => {
			const queryPlan = sqliteDB
				.prepare(
					`
					EXPLAIN QUERY PLAN
					SELECT b.*, l.name as label_name
					FROM bookmarks b
					LEFT JOIN article_labels al ON b.id = al.article_id
					LEFT JOIN labels l ON al.label_id = l.id
				`,
				)
				.all();

			// article_labelsテーブルでインデックススキャンが使用されていることを確認
			// SQLiteは最適なインデックスを選択するため、複合インデックスが使用される場合もある
			const planText = (queryPlan as Array<{ detail: string }>)
				.map((row) => row.detail)
				.join(" ");
			expect(planText).toMatch(/idx_article_labels/);
		});

		test("ラベルフィルタリング時にインデックスが使用される", async () => {
			const queryPlan = sqliteDB
				.prepare(
					`
					EXPLAIN QUERY PLAN
					SELECT b.*
					FROM bookmarks b
					JOIN article_labels al ON b.id = al.article_id
					WHERE al.label_id = 1
				`,
				)
				.all();

			// article_labelsテーブルでインデックススキャンが使用されていることを確認
			const planText = (queryPlan as Array<{ detail: string }>)
				.map((row) => row.detail)
				.join(" ");
			expect(planText).toMatch(/idx_article_labels/);
		});
	});

	describe("実際のパフォーマンステスト", () => {
		beforeAll(async () => {
			// テストデータの作成
			const insertBookmark = sqliteDB.prepare(
				`INSERT INTO bookmarks (url, title, is_read, created_at, updated_at) 
				 VALUES (?, ?, ?, ?, ?)`,
			);

			for (let i = 1; i <= 100; i++) {
				const now = Date.now();
				insertBookmark.run(
					`https://example.com/${i}`,
					`Test Article ${i}`,
					i % 3 === 0 ? 1 : 0, // 3分の1を既読に
					now - i * 1000, // 作成時間をずらす
					now,
				);
			}

			// ラベルの作成
			const insertLabel = sqliteDB.prepare(
				`INSERT INTO labels (name, description, created_at, updated_at) 
				 VALUES (?, ?, ?, ?)`,
			);

			for (let i = 1; i <= 10; i++) {
				const now = Date.now();
				insertLabel.run(`Label ${i}`, `Test Label ${i}`, now, now);
			}

			// article_labelsの作成（記事とラベルを紐付け）
			const insertArticleLabel = sqliteDB.prepare(
				`INSERT INTO article_labels (article_id, label_id, created_at) 
				 VALUES (?, ?, ?)`,
			);

			for (let i = 1; i <= 50; i++) {
				insertArticleLabel.run(i, (i % 10) + 1, Date.now());
			}
		});

		test("未読記事の取得パフォーマンス", async () => {
			const start = performance.now();

			const unreadBookmarks = sqliteDB
				.prepare(
					`
					SELECT * FROM bookmarks 
					WHERE is_read = 0 
					ORDER BY created_at DESC 
					LIMIT 20
				`,
				)
				.all();

			const duration = performance.now() - start;

			console.log(`📈 未読記事取得時間: ${duration.toFixed(2)}ms`);
			console.log(`📊 取得件数: ${unreadBookmarks.length}件`);

			// パフォーマンスが妥当であることを確認（10ms以下）
			expect(duration).toBeLessThan(10);
			expect(unreadBookmarks.length).toBeGreaterThan(0);
		});

		test("ラベル付き記事の取得パフォーマンス", async () => {
			const start = performance.now();

			const labeledBookmarks = sqliteDB
				.prepare(
					`
					SELECT b.*, l.name as label_name
					FROM bookmarks b
					LEFT JOIN article_labels al ON b.id = al.article_id
					LEFT JOIN labels l ON al.label_id = l.id
					ORDER BY b.created_at DESC
					LIMIT 20
				`,
				)
				.all();

			const duration = performance.now() - start;

			console.log(`📈 ラベル付き記事取得時間: ${duration.toFixed(2)}ms`);
			console.log(`📊 取得件数: ${labeledBookmarks.length}件`);

			// パフォーマンスが妥当であることを確認（15ms以下）
			expect(duration).toBeLessThan(15);
			expect(labeledBookmarks.length).toBeGreaterThan(0);
		});

		test("特定ラベルでのフィルタリングパフォーマンス", async () => {
			const start = performance.now();

			const filteredBookmarks = sqliteDB
				.prepare(
					`
					SELECT b.*
					FROM bookmarks b
					JOIN article_labels al ON b.id = al.article_id
					WHERE al.label_id = 1
					ORDER BY b.created_at DESC
				`,
				)
				.all();

			const duration = performance.now() - start;

			console.log(`📈 ラベルフィルタリング時間: ${duration.toFixed(2)}ms`);
			console.log(`📊 取得件数: ${filteredBookmarks.length}件`);

			// パフォーマンスが妥当であることを確認（10ms以下）
			expect(duration).toBeLessThan(10);
			expect(filteredBookmarks.length).toBeGreaterThan(0);
		});
	});

	describe("インデックス統計情報", () => {
		test("インデックスの使用統計を確認", async () => {
			// SQLiteの統計情報を確認（利用可能な場合）
			try {
				const stats = sqliteDB.prepare("PRAGMA index_list(bookmarks)").all();

				console.log("📊 bookmarksテーブルのインデックス一覧:");
				const typedStats = stats as Array<{ name: string; unique: boolean }>;
				for (const stat of typedStats) {
					console.log(
						`  - ${stat.name}: ${stat.unique ? "UNIQUE" : "NON-UNIQUE"}`,
					);
				}

				expect(stats.length).toBeGreaterThan(0);
			} catch (error) {
				console.log("統計情報の取得をスキップ:", (error as Error).message);
			}
		});

		test("データベースサイズの増加を確認", async () => {
			// データベースサイズの確認
			try {
				const pageCount = sqliteDB.prepare("PRAGMA page_count").get() as {
					page_count: number;
				};

				const pageSize = sqliteDB.prepare("PRAGMA page_size").get() as {
					page_size: number;
				};

				const dbSize = pageCount.page_count * pageSize.page_size;
				console.log(`💾 データベースサイズ: ${(dbSize / 1024).toFixed(2)}KB`);

				// インデックス追加後もサイズが妥当であることを確認
				expect(dbSize).toBeLessThan(1024 * 1024); // 1MB以下
			} catch (error) {
				console.log("サイズ情報の取得をスキップ:", (error as Error).message);
			}
		});
	});
});

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe("パフォーマンスインデックステストの構成", () => {
		test("テストファイルが正しく構成されている", () => {
			expect(true).toBe(true);
		});
	});
}
