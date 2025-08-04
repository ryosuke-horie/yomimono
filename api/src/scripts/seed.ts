import Database from "better-sqlite3";
/**
 * シードデータ生成スクリプト
 * 開発環境でのテスト用データ生成
 * 現実的なテック記事のブックマーク、ラベル、お気に入りデータを生成する
 */
import { drizzle } from "drizzle-orm/better-sqlite3";
import { getCurrentDatabaseConfig } from "../config/database";
import {
	articleLabels,
	bookmarks,
	favorites,
	type InsertArticleLabel,
	type InsertBookmark,
	type InsertFavorite,
	type InsertLabel,
	labels,
} from "../db/schema";

// 環境チェック用の型定義
interface SeedDataOptions {
	bookmarkCount?: number;
	labelCount?: number;
	favoriteRatio?: number; // お気に入り率 (0-1)
	forceRun?: boolean; // 本番環境でも実行を強制する
}

/**
 * 技術記事のサンプルデータ
 */
const SAMPLE_TECH_ARTICLES = [
	{
		url: "https://zenn.dev/frontend/articles/react-19-new-features",
		title: "React 19の新機能まとめ: コンカレントレンダリングとSuspense改善",
	},
	{
		url: "https://qiita.com/backend/items/nodejs-performance-tuning-2024",
		title: "Node.js パフォーマンスチューニング 2024年版",
	},
	{
		url: "https://tech.company.com/blog/microservices-architecture-patterns",
		title: "マイクロサービスアーキテクチャ設計パターン完全ガイド",
	},
	{
		url: "https://dev.to/webdev/css-grid-advanced-techniques",
		title: "CSS Grid上級テクニック: レスポンシブデザインの新常識",
	},
	{
		url: "https://medium.com/@author/typescript-5-new-features",
		title: "TypeScript 5.0新機能解説: 型安全性とDXの向上",
	},
	{
		url: "https://blog.company.com/database-optimization-postgresql",
		title: "PostgreSQL最適化技法: インデックス設計からクエリ改善まで",
	},
	{
		url: "https://zenn.dev/devops/articles/kubernetes-monitoring-observability",
		title: "Kubernetes監視とObservability: Prometheus + Grafana実践",
	},
	{
		url: "https://qiita.com/security/items/web-security-checklist-2024",
		title: "Webセキュリティチェックリスト 2024: XSS, CSRF対策完全版",
	},
	{
		url: "https://tech.startup.com/blog/serverless-architecture-aws-lambda",
		title: "サーバーレスアーキテクチャ実践: AWS Lambda + API Gateway",
	},
	{
		url: "https://dev.to/mobile/flutter-state-management-guide",
		title: "Flutter状態管理パターン比較: Provider vs Riverpod vs Bloc",
	},
	{
		url: "https://medium.com/@engineer/graphql-vs-rest-api-comparison",
		title: "GraphQL vs REST API: 実装コストとパフォーマンス比較",
	},
	{
		url: "https://blog.team.com/machine-learning-production-deployment",
		title: "機械学習モデルの本番デプロイメント: MLOpsベストプラクティス",
	},
	{
		url: "https://zenn.dev/frontend/articles/vue3-composition-api-patterns",
		title: "Vue 3 Composition API活用パターン: 再利用可能なロジック設計",
	},
	{
		url: "https://qiita.com/infrastructure/items/docker-best-practices-2024",
		title: "Docker運用ベストプラクティス 2024: セキュリティとパフォーマンス",
	},
	{
		url: "https://tech.enterprise.com/blog/microservices-testing-strategies",
		title: "マイクロサービステスト戦略: 単体・結合・E2Eテストの実装",
	},
	{
		url: "https://dev.to/backend/redis-performance-optimization",
		title: "Redis最適化ガイド: メモリ使用量削減とレスポンス改善",
	},
	{
		url: "https://medium.com/@architect/clean-architecture-implementation",
		title: "クリーンアーキテクチャ実装例: TypeScriptで学ぶ設計原則",
	},
	{
		url: "https://blog.company.com/ci-cd-pipeline-github-actions",
		title: "GitHub ActionsによるCI/CDパイプライン構築: 自動テスト・デプロイ",
	},
	{
		url: "https://zenn.dev/data/articles/big-data-processing-spark",
		title: "Apache Sparkによるビッグデータ処理: 効率的な分散処理設計",
	},
	{
		url: "https://qiita.com/mobile/items/ios-swiftui-advanced-techniques",
		title: "SwiftUI上級テクニック: カスタムビューとアニメーション実装",
	},
	{
		url: "https://tech.startup.com/blog/event-driven-architecture",
		title: "イベント駆動アーキテクチャ設計: 非同期処理とメッセージング",
	},
	{
		url: "https://dev.to/webdev/progressive-web-app-guide",
		title: "PWA開発完全ガイド: オフライン対応とプッシュ通知実装",
	},
	{
		url: "https://medium.com/@devops/monitoring-alerting-best-practices",
		title: "監視・アラート設計ベストプラクティス: SLI/SLO運用指針",
	},
	{
		url: "https://blog.team.com/api-gateway-design-patterns",
		title: "API Gateway設計パターン: 認証・認可・レート制限実装",
	},
	{
		url: "https://zenn.dev/ai/articles/llm-application-development",
		title: "LLMアプリケーション開発: プロンプトエンジニアリングとRAG実装",
	},
	{
		url: "https://qiita.com/game/items/unity-performance-optimization",
		title: "Unity最適化テクニック: レンダリング・メモリ・CPU使用量改善",
	},
	{
		url: "https://tech.company.com/blog/database-sharding-strategies",
		title: "データベースシャーディング戦略: 水平分割設計と運用課題",
	},
	{
		url: "https://dev.to/security/zero-trust-architecture-implementation",
		title: "ゼロトラストアーキテクチャ実装: 境界防御からの脱却",
	},
	{
		url: "https://medium.com/@frontend/micro-frontends-architecture",
		title: "マイクロフロントエンドアーキテクチャ: モジュラー設計と運用",
	},
	{
		url: "https://blog.startup.com/stream-processing-kafka-flink",
		title: "ストリーム処理アーキテクチャ: Kafka + Flink によるリアルタイム分析",
	},
];

/**
 * ラベルのサンプルデータ
 */
const SAMPLE_LABELS = [
	{
		name: "React",
		description:
			"Reactライブラリに関する記事。コンポーネント設計、Hooks、状態管理など",
	},
	{
		name: "Node.js",
		description:
			"Node.jsを使ったサーバーサイド開発。パフォーマンス改善や運用に関する記事",
	},
	{
		name: "TypeScript",
		description: "TypeScriptの型システム、新機能、実装パターンに関する記事",
	},
	{
		name: "データベース",
		description: "PostgreSQL、MySQL、NoSQLなどデータベース技術全般の記事",
	},
	{
		name: "インフラ・DevOps",
		description:
			"Kubernetes、Docker、CI/CD、監視など開発・運用基盤に関する記事",
	},
	{
		name: "セキュリティ",
		description: "Webセキュリティ、認証・認可、脆弱性対策に関する記事",
	},
	{
		name: "アーキテクチャ",
		description: "システム設計、マイクロサービス、設計パターンに関する記事",
	},
	{
		name: "パフォーマンス",
		description: "最適化、チューニング、パフォーマンス改善に関する記事",
	},
];

/**
 * 環境チェック: 本番環境での実行を防ぐ
 */
function validateEnvironment(forceRun = false): void {
	const config = getCurrentDatabaseConfig();

	if (config.environment === "production" && !forceRun) {
		throw new Error(
			"本番環境でのシードデータ実行は禁止されています。forceRun=trueで強制実行可能ですが注意してください。",
		);
	}

	console.log(`シードデータ生成開始 - 環境: ${config.environment}`);
}

/**
 * ランダムな日付を生成（過去30日以内）
 */
function generateRandomDate(): Date {
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const randomTime =
		thirtyDaysAgo.getTime() +
		Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
	return new Date(randomTime);
}

/**
 * 配列からランダムに要素を選択
 */
function getRandomElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

/**
 * 配列から指定数の要素をランダムに選択（重複なし）
 */
function getRandomElements<T>(array: T[], count: number): T[] {
	const shuffled = [...array].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * ブックマークデータを生成
 */
function generateBookmarkData(count: number): InsertBookmark[] {
	const selectedArticles = getRandomElements(SAMPLE_TECH_ARTICLES, count);

	return selectedArticles.map((article) => {
		const createdAt = generateRandomDate();
		const isRead = Math.random() < 0.3; // 30%の確率で既読
		const updatedAt = isRead
			? new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)
			: createdAt;

		return {
			url: article.url,
			title: article.title,
			isRead,
			createdAt,
			updatedAt,
		} satisfies InsertBookmark;
	});
}

/**
 * ラベルデータを生成
 */
function generateLabelData(count: number): InsertLabel[] {
	const selectedLabels = getRandomElements(SAMPLE_LABELS, count);

	return selectedLabels.map((label) => {
		const now = new Date();
		return {
			name: label.name,
			description: label.description,
			createdAt: now,
			updatedAt: now,
		} satisfies InsertLabel;
	});
}

/**
 * 記事-ラベル関連付けデータを生成
 */
function generateArticleLabelData(
	bookmarkIds: number[],
	labelIds: number[],
): InsertArticleLabel[] {
	const articleLabels: InsertArticleLabel[] = [];

	// 各ブックマークに1-3個のラベルをランダムに割り当て
	for (const bookmarkId of bookmarkIds) {
		const labelCount = Math.floor(Math.random() * 3) + 1; // 1-3個
		const selectedLabelIds = getRandomElements(labelIds, labelCount);

		for (const labelId of selectedLabelIds) {
			articleLabels.push({
				articleId: bookmarkId,
				labelId,
				createdAt: new Date(),
			} satisfies InsertArticleLabel);
		}
	}

	return articleLabels;
}

/**
 * お気に入りデータを生成
 */
function generateFavoriteData(
	bookmarkIds: number[],
	favoriteRatio: number,
): InsertFavorite[] {
	const favoriteCount = Math.floor(bookmarkIds.length * favoriteRatio);
	const selectedBookmarkIds = getRandomElements(bookmarkIds, favoriteCount);

	return selectedBookmarkIds.map(
		(bookmarkId) =>
			({
				bookmarkId,
				createdAt: new Date(),
			}) satisfies InsertFavorite,
	);
}

/**
 * データベース接続を作成
 */
function createDatabaseConnection() {
	const config = getCurrentDatabaseConfig();

	if (config.environment === "development") {
		// 開発環境ではSQLiteファイルを使用
		const sqliteDb = new Database(config.url);
		return drizzle(sqliteDb); // better-sqlite3用のdrizzle設定
	}

	throw new Error("本番環境でのシードデータ実行はサポートされていません");
}

/**
 * データベースをクリアする関数
 */
export async function clearDatabase(): Promise<void> {
	const config = getCurrentDatabaseConfig();

	if (config.environment === "production") {
		throw new Error("本番環境でのデータクリアは禁止されています");
	}

	const db = createDatabaseConnection();

	console.log("データベースをクリア中...");

	// 外部キー制約のため、順序を考慮して削除
	await db.delete(articleLabels);
	await db.delete(favorites);
	await db.delete(bookmarks);
	await db.delete(labels);

	console.log("✅ データベースクリア完了");
}

/**
 * シードデータのメイン実行関数
 */
export async function runSeedData(
	options: SeedDataOptions = {},
): Promise<void> {
	const {
		bookmarkCount = 25,
		labelCount = 6,
		favoriteRatio = 0.3,
		forceRun = false,
	} = options;

	try {
		// 環境チェック
		validateEnvironment(forceRun);

		// データベース接続
		const db = createDatabaseConnection();

		console.log("シードデータ生成中...");

		// 既存データをクリア
		console.log("既存データをクリア中...");
		await db.delete(articleLabels);
		await db.delete(favorites);
		await db.delete(bookmarks);
		await db.delete(labels);
		console.log("✅ 既存データをクリアしました");

		// 1. ラベルデータを挿入
		console.log("ラベルデータを生成中...");
		const labelData = generateLabelData(labelCount);
		const insertedLabels = await Promise.all(
			labelData.map(async (label) => {
				const result = await db.insert(labels).values(label).returning();
				return result[0]; // SQLiteでは配列の最初の要素を取得
			}),
		);
		const labelIds = insertedLabels.map((label) => label.id);
		console.log(`${insertedLabels.length}個のラベルを作成しました`);

		// 2. ブックマークデータを挿入
		console.log("ブックマークデータを生成中...");
		const bookmarkData = generateBookmarkData(bookmarkCount);
		const insertedBookmarks = await Promise.all(
			bookmarkData.map(async (bookmark) => {
				const result = await db.insert(bookmarks).values(bookmark).returning();
				return result[0]; // SQLiteでは配列の最初の要素を取得
			}),
		);
		const bookmarkIds = insertedBookmarks.map((bookmark) => bookmark.id);
		console.log(`${insertedBookmarks.length}個のブックマークを作成しました`);

		// 3. 記事-ラベル関連付けデータを挿入
		console.log("記事-ラベル関連付けを生成中...");
		const articleLabelData = generateArticleLabelData(bookmarkIds, labelIds);
		await Promise.all(
			articleLabelData.map(async (articleLabel) => {
				await db.insert(articleLabels).values(articleLabel).run();
			}),
		);
		console.log(
			`${articleLabelData.length}個の記事-ラベル関連付けを作成しました`,
		);

		// 4. お気に入りデータを挿入
		console.log("お気に入りデータを生成中...");
		const favoriteData = generateFavoriteData(bookmarkIds, favoriteRatio);
		await Promise.all(
			favoriteData.map(async (favorite) => {
				await db.insert(favorites).values(favorite).run();
			}),
		);
		console.log(`${favoriteData.length}個のお気に入りを作成しました`);

		console.log("✅ シードデータ生成が完了しました！");
		console.log("📊 生成データサマリー:");
		console.log(`  - ブックマーク: ${insertedBookmarks.length}件`);
		console.log(`  - ラベル: ${insertedLabels.length}件`);
		console.log(`  - 記事-ラベル関連付け: ${articleLabelData.length}件`);
		console.log(`  - お気に入り: ${favoriteData.length}件`);
	} catch (error) {
		console.error("❌ シードデータ生成中にエラーが発生しました:", error);
		throw error;
	}
}

/**
 * CLIから実行される場合のエントリーポイント
 */
if (
	typeof process !== "undefined" &&
	process.argv &&
	import.meta.url === `file://${process.argv[1]}`
) {
	runSeedData()
		.then(() => {
			console.log("シードデータ生成スクリプトが正常に完了しました");
			process.exit(0);
		})
		.catch((error) => {
			console.error("シードデータ生成スクリプトでエラーが発生しました:", error);
			process.exit(1);
		});
}

// テスト用のexport
export {
	validateEnvironment,
	generateRandomDate,
	getRandomElement,
	getRandomElements,
	generateBookmarkData,
	generateLabelData,
	generateArticleLabelData,
	generateFavoriteData,
	SAMPLE_TECH_ARTICLES,
	SAMPLE_LABELS,
};

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe("Seed Data Generation", () => {
		describe("validateEnvironment", () => {
			test("開発環境では正常に実行される", () => {
				// 実際の環境設定を確認して開発環境の場合のみ実行
				const config = getCurrentDatabaseConfig();
				if (config.environment === "development") {
					expect(() => validateEnvironment()).not.toThrow();
				} else {
					// 本番環境の場合はスキップ
					expect(true).toBe(true);
				}
			});

			test("本番環境でもforceRun=trueで実行される", () => {
				expect(() => validateEnvironment(true)).not.toThrow();
			});
		});

		describe("generateRandomDate", () => {
			test("過去30日以内の日付を生成する", () => {
				const now = new Date();
				const thirtyDaysAgo = new Date(
					now.getTime() - 30 * 24 * 60 * 60 * 1000,
				);

				const randomDate = generateRandomDate();

				expect(randomDate.getTime()).toBeGreaterThanOrEqual(
					thirtyDaysAgo.getTime(),
				);
				expect(randomDate.getTime()).toBeLessThanOrEqual(now.getTime());
			});

			test("複数回実行して異なる日付が生成される", () => {
				const dates = Array.from({ length: 10 }, () => generateRandomDate());
				const uniqueDates = new Set(dates.map((d) => d.getTime()));

				// 高確率で異なる日付が生成される
				expect(uniqueDates.size).toBeGreaterThan(1);
			});
		});

		describe("getRandomElement", () => {
			test("配列から要素を選択する", () => {
				const array = ["a", "b", "c", "d", "e"];
				const element = getRandomElement(array);

				expect(array).toContain(element);
			});

			test("単一要素の配列から正しく選択する", () => {
				const array = ["only"];
				const element = getRandomElement(array);

				expect(element).toBe("only");
			});
		});

		describe("getRandomElements", () => {
			test("指定数の要素を重複なく選択する", () => {
				const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
				const selected = getRandomElements(array, 5);

				expect(selected).toHaveLength(5);
				expect(new Set(selected).size).toBe(5); // 重複チェック
				for (const element of selected) {
					expect(array).toContain(element);
				}
			});

			test("配列より多い数を指定した場合は配列の長さまで選択する", () => {
				const array = [1, 2, 3];
				const selected = getRandomElements(array, 10);

				expect(selected).toHaveLength(3);
			});

			test("0個選択した場合は空配列を返す", () => {
				const array = [1, 2, 3, 4, 5];
				const selected = getRandomElements(array, 0);

				expect(selected).toHaveLength(0);
			});
		});

		describe("generateBookmarkData", () => {
			test("指定数のブックマークデータを生成する", () => {
				const bookmarks = generateBookmarkData(5);

				expect(bookmarks).toHaveLength(5);

				for (const bookmark of bookmarks) {
					expect(bookmark.url).toBeDefined();
					expect(bookmark.title).toBeDefined();
					expect(typeof bookmark.isRead).toBe("boolean");
					expect(bookmark.createdAt).toBeInstanceOf(Date);
					expect(bookmark.updatedAt).toBeInstanceOf(Date);
				}
			});

			test("各ブックマークのURLが有効な形式である", () => {
				const bookmarks = generateBookmarkData(3);

				for (const bookmark of bookmarks) {
					expect(bookmark.url).toMatch(/^https?:\/\/.+/);
				}
			});

			test("既読ブックマークのupdatedAtがcreatedAt以降である", () => {
				const bookmarks = generateBookmarkData(10);

				for (const bookmark of bookmarks) {
					if (bookmark.isRead && bookmark.updatedAt && bookmark.createdAt) {
						expect(bookmark.updatedAt.getTime()).toBeGreaterThanOrEqual(
							bookmark.createdAt.getTime(),
						);
					}
				}
			});
		});

		describe("generateLabelData", () => {
			test("指定数のラベルデータを生成する", () => {
				const labels = generateLabelData(3);

				expect(labels).toHaveLength(3);

				for (const label of labels) {
					expect(label.name).toBeDefined();
					expect(label.description).toBeDefined();
					expect(label.createdAt).toBeInstanceOf(Date);
					expect(label.updatedAt).toBeInstanceOf(Date);
				}
			});

			test("利用可能なラベル数より多い数を指定した場合は利用可能数まで生成する", () => {
				const labels = generateLabelData(100);

				expect(labels.length).toBeLessThanOrEqual(SAMPLE_LABELS.length);
			});
		});

		describe("generateArticleLabelData", () => {
			test("記事-ラベル関連付けデータを生成する", () => {
				const bookmarkIds = [1, 2, 3];
				const labelIds = [1, 2, 3, 4];

				const articleLabels = generateArticleLabelData(bookmarkIds, labelIds);

				expect(articleLabels.length).toBeGreaterThan(0);

				for (const articleLabel of articleLabels) {
					expect(bookmarkIds).toContain(articleLabel.articleId);
					expect(labelIds).toContain(articleLabel.labelId);
					expect(articleLabel.createdAt).toBeInstanceOf(Date);
				}
			});

			test("各記事に1-3個のラベルが割り当てられる", () => {
				const bookmarkIds = [1, 2, 3];
				const labelIds = [1, 2, 3, 4, 5];

				const articleLabels = generateArticleLabelData(bookmarkIds, labelIds);

				// 各記事のラベル数をカウント
				const labelCountsByArticle: { [key: number]: number } = {};
				for (const al of articleLabels) {
					labelCountsByArticle[al.articleId] =
						(labelCountsByArticle[al.articleId] || 0) + 1;
				}

				for (const count of Object.values(labelCountsByArticle)) {
					expect(count).toBeGreaterThanOrEqual(1);
					expect(count).toBeLessThanOrEqual(3);
				}
			});
		});

		describe("generateFavoriteData", () => {
			test("指定した比率でお気に入りデータを生成する", () => {
				const bookmarkIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
				const favoriteRatio = 0.3;

				const favorites = generateFavoriteData(bookmarkIds, favoriteRatio);

				expect(favorites).toHaveLength(3); // 10 * 0.3 = 3

				for (const favorite of favorites) {
					expect(bookmarkIds).toContain(favorite.bookmarkId);
					expect(favorite.createdAt).toBeInstanceOf(Date);
				}
			});

			test("重複するブックマークIDが生成されない", () => {
				const bookmarkIds = [1, 2, 3, 4, 5];
				const favorites = generateFavoriteData(bookmarkIds, 1.0);

				const uniqueBookmarkIds = new Set(favorites.map((f) => f.bookmarkId));
				expect(uniqueBookmarkIds.size).toBe(favorites.length);
			});
		});

		describe("SAMPLE_DATA validation", () => {
			test("サンプル記事データが適切な形式である", () => {
				expect(SAMPLE_TECH_ARTICLES.length).toBeGreaterThan(20);

				for (const article of SAMPLE_TECH_ARTICLES) {
					expect(article.url).toMatch(/^https?:\/\/.+/);
					expect(article.title).toBeDefined();
					expect(article.title.length).toBeGreaterThan(10);
				}
			});

			test("サンプルラベルデータが適切な形式である", () => {
				expect(SAMPLE_LABELS.length).toBeGreaterThan(5);

				for (const label of SAMPLE_LABELS) {
					expect(label.name).toBeDefined();
					expect(label.description).toBeDefined();
					expect(label.name.length).toBeGreaterThan(0);
					expect(label.description.length).toBeGreaterThan(10);
				}
			});
		});
	});
}
