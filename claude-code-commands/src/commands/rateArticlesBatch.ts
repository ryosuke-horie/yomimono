import { apiClient } from "../lib/apiClient.js";
import {
	ConsoleOutput,
	FileUtils,
	ProgressDisplay,
	Semaphore,
	Timer,
	UrlUtils,
} from "../lib/utils.js";
/**
 * rate-articles-batch コマンドの実装
 * 複数記事の一括評価
 */
import type { BatchRateOptions, BatchResult, ErrorInfo, SavedRating } from "../types/index.js";
import { rateArticleCommand } from "./rateArticle.js";

/**
 * rate-articles-batch コマンドのメイン実行関数
 */
export async function rateArticlesBatchCommand(options: BatchRateOptions): Promise<void> {
	const timer = new Timer();
	const progress = new ProgressDisplay();

	try {
		ConsoleOutput.section("バッチ記事評価開始");
		ConsoleOutput.info(`実行オプション: ${JSON.stringify(options, null, 2)}`);

		// URLリスト読み込み
		progress.startStep({ step: 1, total: 3, name: "URLリスト読み込み", description: "" });
		const urls = await FileUtils.readUrlsFromFile(options.urlsFile);
		progress.succeedStep(`${urls.length}件のURLを読み込みました`);

		// URL の検証
		const validUrls = validateUrls(urls);
		if (validUrls.length !== urls.length) {
			ConsoleOutput.warn(`${urls.length - validUrls.length}件の無効なURLをスキップしました`);
		}

		if (validUrls.length === 0) {
			throw new Error("有効なURLが見つかりません");
		}

		ConsoleOutput.info(`評価対象: ${validUrls.length}記事`);
		ConsoleOutput.info(`並行数: ${options.concurrency}`);

		// バッチ処理実行
		progress.startStep({ step: 2, total: 3, name: "バッチ評価実行", description: "" });
		const batchResult = await processBatch(validUrls, options);
		progress.succeedStep("バッチ評価完了");

		// 結果サマリー表示
		progress.startStep({ step: 3, total: 3, name: "結果サマリー", description: "" });
		await displayBatchSummary(batchResult, timer);
		progress.succeedStep("サマリー表示完了");

		// 結果ファイル出力
		if (options.outputFile) {
			await FileUtils.writeResultsToFile(options.outputFile, batchResult);
			ConsoleOutput.info(`結果ファイル: ${options.outputFile}`);
		}

		ConsoleOutput.success(`バッチ評価が完了しました (${timer.elapsedFormatted()})`);
	} catch (error) {
		progress.failStep(`バッチ処理でエラーが発生しました: ${error}`);
		throw error;
	} finally {
		progress.stop();
	}
}

/**
 * URL リストの検証
 */
function validateUrls(urls: string[]): string[] {
	return urls.filter((url) => {
		if (!url || url.trim() === "") return false;
		if (url.startsWith("#")) return false; // コメント行
		return UrlUtils.isValidUrl(url.trim());
	});
}

/**
 * バッチ処理の実行
 */
async function processBatch(urls: string[], options: BatchRateOptions): Promise<BatchResult> {
	const results: SavedRating[] = [];
	const errors: ErrorInfo[] = [];
	const semaphore = new Semaphore(options.concurrency);
	const startTime = Date.now();

	// 並行処理で各URLを評価
	const promises = urls.map(async (url, index) => {
		await semaphore.acquire();

		try {
			ConsoleOutput.info(`[${index + 1}/${urls.length}] ${url}`);

			// 既存評価のチェック
			if (options.skipExisting) {
				const existing = await checkExistingRating(url);
				if (existing) {
					ConsoleOutput.info("   ⏭️  既に評価済み - スキップ");
					return;
				}
			}

			// 記事評価実行
			await rateArticleCommand({
				url,
				autoEvaluate: true,
				skipConfirmation: true,
				outputFormat: "summary",
			});

			// 評価結果を取得
			const bookmark = await apiClient.checkExistingBookmark(url);
			if (bookmark) {
				const rating = await apiClient.checkExistingRating(bookmark.id);
				if (rating) {
					results.push(rating);
					ConsoleOutput.success(`   ✅ 評価完了 (スコア: ${rating.totalScore.toFixed(1)})`);
				}
			}
		} catch (error) {
			const errorInfo: ErrorInfo = {
				url,
				error: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString(),
			};
			errors.push(errorInfo);
			ConsoleOutput.error(`   ❌ エラー: ${errorInfo.error}`);
		} finally {
			semaphore.release();
		}
	});

	await Promise.all(promises);

	const duration = Date.now() - startTime;

	return {
		results,
		errors,
		summary: {
			total: urls.length,
			success: results.length,
			failed: errors.length,
			duration,
		},
	};
}

/**
 * 既存評価のチェック
 */
async function checkExistingRating(url: string): Promise<boolean> {
	try {
		const bookmark = await apiClient.checkExistingBookmark(url);
		if (!bookmark) return false;

		const rating = await apiClient.checkExistingRating(bookmark.id);
		return rating !== null;
	} catch {
		return false;
	}
}

/**
 * バッチ結果サマリーの表示
 */
async function displayBatchSummary(result: BatchResult, timer: Timer): Promise<void> {
	ConsoleOutput.section("バッチ評価結果");

	// 基本統計
	ConsoleOutput.summary({
		処理対象: `${result.summary.total}件`,
		成功: `${result.summary.success}件`,
		失敗: `${result.summary.failed}件`,
		成功率: `${((result.summary.success / result.summary.total) * 100).toFixed(1)}%`,
		処理時間: timer.elapsedFormatted(),
		平均処理時間: `${(result.summary.duration / result.summary.total / 1000).toFixed(1)}秒/件`,
	});

	// 成功した評価の統計
	if (result.results.length > 0) {
		const scores = result.results.map((r) => r.totalScore);
		const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
		const maxScore = Math.max(...scores);
		const minScore = Math.min(...scores);

		ConsoleOutput.subsection("評価スコア統計");
		console.log(`   平均スコア: ${avgScore.toFixed(2)}/10`);
		console.log(`   最高スコア: ${maxScore.toFixed(1)}/10`);
		console.log(`   最低スコア: ${minScore.toFixed(1)}/10`);

		// トップ3の記事を表示
		const topArticles = result.results.sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);

		if (topArticles.length > 0) {
			ConsoleOutput.subsection("高評価記事 Top 3");
			for (const [index, article] of topArticles.entries()) {
				console.log(
					`   ${index + 1}. スコア ${article.totalScore.toFixed(1)} - ID:${article.articleId}`
				);
			}
		}
	}

	// エラー詳細
	if (result.errors.length > 0) {
		ConsoleOutput.subsection("エラー詳細");
		const errorGroups = groupErrorsByType(result.errors);

		for (const [errorType, errors] of Object.entries(errorGroups)) {
			console.log(`   ${errorType}: ${errors.length}件`);
			if (errors.length <= 3) {
				for (const error of errors) {
					console.log(`     - ${error.url}`);
				}
			} else {
				console.log(`     - ${errors[0].url}`);
				console.log(`     - ${errors[1].url}`);
				console.log(`     - ... 他${errors.length - 2}件`);
			}
		}
	}

	// 推奨アクション
	if (result.summary.failed > 0) {
		ConsoleOutput.subsection("推奨アクション");
		if (result.errors.some((e) => e.error.includes("ANTHROPIC_API_KEY"))) {
			ConsoleOutput.info("💡 ANTHROPIC_API_KEY 環境変数を設定してください");
		}
		if (result.errors.some((e) => e.error.includes("記事内容の抽出"))) {
			ConsoleOutput.info("💡 ネットワーク接続を確認してください");
		}
		if (result.errors.some((e) => e.error.includes("無効なURL"))) {
			ConsoleOutput.info("💡 URLリストの形式を確認してください");
		}
	}
}

/**
 * エラーをタイプ別にグループ化
 */
function groupErrorsByType(errors: ErrorInfo[]): Record<string, ErrorInfo[]> {
	const groups: Record<string, ErrorInfo[]> = {};

	for (const error of errors) {
		let errorType = "その他";

		if (error.error.includes("無効なURL")) {
			errorType = "無効なURL";
		} else if (error.error.includes("記事内容の抽出")) {
			errorType = "コンテンツ抽出エラー";
		} else if (error.error.includes("ANTHROPIC_API_KEY")) {
			errorType = "API設定エラー";
		} else if (error.error.includes("評価")) {
			errorType = "評価処理エラー";
		} else if (error.error.includes("保存")) {
			errorType = "データ保存エラー";
		}

		if (!groups[errorType]) {
			groups[errorType] = [];
		}
		groups[errorType].push(error);
	}

	return groups;
}

if (import.meta.vitest) {
	const { test, expect, vi } = import.meta.vitest;

	// 依存関係のモック
	vi.mock("./rateArticle.js");
	vi.mock("../lib/utils.js");
	vi.mock("../lib/apiClient.js");

	test("validateUrls が正しくURLを検証する", () => {
		const urls = [
			"https://example.com/valid",
			"invalid-url",
			"# コメント",
			"",
			"https://example.com/another-valid",
		];

		const validUrls = validateUrls(urls);
		expect(validUrls).toEqual(["https://example.com/valid", "https://example.com/another-valid"]);
	});

	test("checkExistingRating が既存評価を正しくチェックする", async () => {
		const mockBookmark = { id: 1, title: "Test", url: "https://example.com", createdAt: "" };
		const mockRating = { id: 1, articleId: 1, totalScore: 8.0, createdAt: "" };

		(apiClient.checkExistingBookmark as any) = vi.fn().mockResolvedValue(mockBookmark);
		(apiClient.checkExistingRating as any) = vi.fn().mockResolvedValue(mockRating);

		const result = await checkExistingRating("https://example.com");
		expect(result).toBe(true);
	});

	test("checkExistingRating がブックマークが存在しない場合にfalseを返す", async () => {
		(apiClient.checkExistingBookmark as any) = vi.fn().mockResolvedValue(null);

		const result = await checkExistingRating("https://example.com");
		expect(result).toBe(false);
	});

	test("groupErrorsByType が正しくエラーをグループ化する", () => {
		const errors: ErrorInfo[] = [
			{ url: "https://example.com/1", error: "無効なURLです", timestamp: "2023-01-01" },
			{ url: "https://example.com/2", error: "記事内容の抽出に失敗", timestamp: "2023-01-01" },
			{ url: "https://example.com/3", error: "無効なURLです", timestamp: "2023-01-01" },
			{ url: "https://example.com/4", error: "その他のエラー", timestamp: "2023-01-01" },
		];

		const groups = groupErrorsByType(errors);
		expect(groups.無効なURL).toHaveLength(2);
		expect(groups.コンテンツ抽出エラー).toHaveLength(1);
		expect(groups.その他).toHaveLength(1);
	});

	test("processBatch が正常に完了する", async () => {
		const urls = ["https://example.com/1", "https://example.com/2"];
		const options: BatchRateOptions = {
			urlsFile: "test.txt",
			concurrency: 2,
			skipExisting: false,
		};

		// rateArticleCommand のモック
		(rateArticleCommand as any) = vi.fn().mockResolvedValue(undefined);

		// API クライアントのモック
		const mockBookmark = { id: 1, title: "Test", url: "", createdAt: "" };
		const mockRating = { id: 1, articleId: 1, totalScore: 8.0, createdAt: "" };

		(apiClient.checkExistingBookmark as any) = vi.fn().mockResolvedValue(mockBookmark);
		(apiClient.checkExistingRating as any) = vi.fn().mockResolvedValue(mockRating);

		const result = await processBatch(urls, options);

		expect(result.summary.total).toBe(2);
		expect(result.summary.success).toBe(2);
		expect(result.summary.failed).toBe(0);
		expect(result.results).toHaveLength(2);
		expect(result.errors).toHaveLength(0);
	});
}
