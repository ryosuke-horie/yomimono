/**
 * rate-article コマンドの実装
 * 記事評価ワークフローの自動化
 */
import inquirer from "inquirer";
import { apiClient } from "../lib/apiClient.js";
import { contentExtractor } from "../lib/contentExtractor.js";
import { articleEvaluator } from "../lib/evaluator.js";
import { ConsoleOutput, ProgressDisplay, Timer, UrlUtils } from "../lib/utils.js";
import type {
	ArticleContent,
	ArticleInfo,
	ProgressStep,
	RateArticleOptions,
	SavedRating,
} from "../types/index.js";

/**
 * rate-article コマンドのメイン実行関数
 */
export async function rateArticleCommand(options: RateArticleOptions): Promise<void> {
	const timer = new Timer();
	const progress = new ProgressDisplay();

	try {
		ConsoleOutput.section("記事評価ワークフロー開始");
		ConsoleOutput.info(`実行オプション: ${JSON.stringify(options, null, 2)}`);

		const steps: ProgressStep[] = [
			{ step: 1, total: 6, name: "記事情報の確認・取得", description: "記事の存在確認と情報取得" },
			{
				step: 2,
				total: 6,
				name: "記事内容の抽出",
				description: "Web ページから記事内容を抽出",
			},
			{
				step: 3,
				total: 6,
				name: "評価プロンプトの生成",
				description: "Claude 用の評価プロンプトを準備",
			},
			{
				step: 4,
				total: 6,
				name: "Claude による記事評価",
				description: "AI による記事の総合評価",
			},
			{
				step: 5,
				total: 6,
				name: "評価結果の保存",
				description: "データベースへの評価結果保存",
			},
			{
				step: 6,
				total: 6,
				name: "結果サマリーの表示",
				description: "評価結果の整理と表示",
			},
		];

		// Step 1: 記事情報の確認・取得
		progress.startStep(steps[0]);
		const articleInfo = await getOrCreateArticle(options);
		progress.succeedStep(
			`記事ID: ${articleInfo.id}, タイトル: "${articleInfo.title.substring(0, 50)}..."`
		);
		ConsoleOutput.info(`URL: ${articleInfo.url}`);

		// Step 2: 記事内容の抽出
		progress.startStep(steps[1]);
		const content = await extractArticleContent(articleInfo.url);
		progress.succeedStep(`内容抽出完了 (${content.wordCount}語)`);
		ConsoleOutput.info(`要約: ${content.summary?.substring(0, 100)}...`);

		// Step 3: 評価プロンプトの生成
		progress.startStep(steps[2]);
		await new Promise((resolve) => setTimeout(resolve, 500)); // UI のため少し待機
		progress.succeedStep("プロンプト生成完了");

		// Step 4: Claude による記事評価
		progress.startStep(steps[3]);
		if (!options.autoEvaluate && !options.skipConfirmation) {
			const shouldProceed = await confirmEvaluation(content);
			if (!shouldProceed) {
				progress.warnStep("評価をキャンセルしました");
				return;
			}
		}

		const evaluation = await articleEvaluator.evaluateArticle(content);
		progress.succeedStep("評価完了");
		displayEvaluationPreview(evaluation);

		// Step 5: 評価結果の保存
		progress.startStep(steps[4]);
		const savedRating = await saveRating(articleInfo.id, evaluation);
		progress.succeedStep(`保存完了 (ID: ${savedRating.id})`);

		// Step 6: 結果サマリーの表示
		progress.startStep(steps[5]);
		await new Promise((resolve) => setTimeout(resolve, 200));
		progress.succeedStep("サマリー表示完了");

		displayFinalSummary(savedRating, options.outputFormat, timer);

		ConsoleOutput.success(`記事評価が完了しました (${timer.elapsedFormatted()})`);
	} catch (error) {
		progress.failStep(`エラーが発生しました: ${error instanceof Error ? error.message : error}`);
		await handleError(error, options);
		throw error;
	} finally {
		progress.stop();
	}
}

/**
 * 記事情報の取得・作成
 */
async function getOrCreateArticle(options: RateArticleOptions): Promise<ArticleInfo> {
	if (options.articleId) {
		// 既存記事の取得
		try {
			return await apiClient.getBookmark(options.articleId);
		} catch (error) {
			throw new Error(`記事ID ${options.articleId} が見つかりません: ${error}`);
		}
	} else if (options.url) {
		// URL の検証
		if (!UrlUtils.isValidUrl(options.url)) {
			throw new Error(`無効なURLです: ${options.url}`);
		}

		// 既存ブックマークをチェック
		const existing = await apiClient.checkExistingBookmark(options.url);
		if (existing) {
			ConsoleOutput.info("既存のブックマークが見つかりました");
			return existing;
		}

		// 新規ブックマークの作成
		const title = UrlUtils.extractTitleFromUrl(options.url);
		return await apiClient.createBookmark({
			url: options.url,
			title,
		});
	} else {
		throw new Error("--url または --article-id のいずれかを指定してください");
	}
}

/**
 * 記事内容の抽出
 */
async function extractArticleContent(url: string): Promise<ArticleContent> {
	try {
		return await contentExtractor.extractContent(url);
	} catch (error) {
		throw new Error(`記事内容の抽出に失敗しました: ${error}`);
	}
}

/**
 * ユーザー確認
 */
async function confirmEvaluation(content: ArticleContent): Promise<boolean> {
	ConsoleOutput.subsection("記事内容プレビュー");
	console.log(`タイトル: ${content.title}`);
	console.log(`文字数: ${content.wordCount}語`);
	console.log(`内容: ${content.content.substring(0, 200)}...\n`);

	const answers = await inquirer.prompt([
		{
			type: "confirm",
			name: "proceed",
			message: "この記事を評価しますか？",
			default: true,
		},
	]);

	return answers.proceed;
}

/**
 * 評価結果の保存
 */
async function saveRating(articleId: number, evaluation: any): Promise<SavedRating> {
	try {
		return await apiClient.saveRating({
			articleId,
			practicalValue: evaluation.practicalValue,
			technicalDepth: evaluation.technicalDepth,
			understanding: evaluation.understanding,
			novelty: evaluation.novelty,
			importance: evaluation.importance,
			comment: evaluation.comment,
		});
	} catch (error) {
		throw new Error(`評価結果の保存に失敗しました: ${error}`);
	}
}

/**
 * 評価プレビュー表示
 */
function displayEvaluationPreview(evaluation: any): void {
	ConsoleOutput.subsection("評価結果プレビュー");
	console.log(`   実用性: ${evaluation.practicalValue}/10`);
	console.log(`   技術深度: ${evaluation.technicalDepth}/10`);
	console.log(`   理解度: ${evaluation.understanding}/10`);
	console.log(`   新規性: ${evaluation.novelty}/10`);
	console.log(`   重要度: ${evaluation.importance}/10`);
	console.log(`   総合スコア: ${evaluation.totalScore.toFixed(1)}/10`);
	if (evaluation.comment) {
		console.log(`   コメント: ${evaluation.comment}`);
	}
	console.log();
}

/**
 * 最終サマリー表示
 */
function displayFinalSummary(rating: SavedRating, format: string, timer: Timer): void {
	switch (format) {
		case "json":
			console.log(JSON.stringify(rating, null, 2));
			break;
		case "summary":
			console.log(`評価完了: ${rating.totalScore.toFixed(1)}/10 (ID: ${rating.id})`);
			break;
		default: {
			ConsoleOutput.section("記事評価が完了しました！");
			ConsoleOutput.summary({
				総合スコア: `⭐ ${rating.totalScore.toFixed(1)}/10`,
				評価ID: rating.id,
				記事ID: rating.articleId,
				処理時間: timer.elapsedFormatted(),
				保存日時: new Date(rating.createdAt).toLocaleString("ja-JP"),
			});

			const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
			ConsoleOutput.info(`詳細: ${frontendUrl}/ratings?articleId=${rating.articleId}`);
			break;
		}
	}
}

/**
 * エラーハンドリング
 */
async function handleError(error: unknown, options: RateArticleOptions): Promise<void> {
	const errorMessage = error instanceof Error ? error.message : String(error);

	ConsoleOutput.error(`エラーが発生しました: ${errorMessage}`);
	ConsoleOutput.subsection("エラー対処法");

	if (errorMessage.includes("記事が見つかりません")) {
		ConsoleOutput.info("💡 記事URLを確認してください");
		ConsoleOutput.info("💡 記事が非公開の可能性があります");
	} else if (errorMessage.includes("ANTHROPIC_API_KEY")) {
		ConsoleOutput.info("💡 ANTHROPIC_API_KEY 環境変数を設定してください");
		ConsoleOutput.info("💡 Claude API キーが必要です");
	} else if (errorMessage.includes("記事内容の抽出")) {
		ConsoleOutput.info("💡 ネットワーク接続を確認してください");
		ConsoleOutput.info("💡 記事が存在するかURLを確認してください");
	} else if (errorMessage.includes("評価")) {
		ConsoleOutput.info("💡 --auto-evaluate オプションを試してください");
		ConsoleOutput.info("💡 記事内容が長すぎる可能性があります");
	}

	if (!options.skipConfirmation) {
		const answers = await inquirer.prompt([
			{
				type: "confirm",
				name: "retry",
				message: "再試行しますか？",
				default: false,
			},
		]);

		if (answers.retry) {
			ConsoleOutput.info("再試行します...");
			await rateArticleCommand({ ...options, skipConfirmation: true });
		}
	}
}

if (import.meta.vitest) {
	const { test, expect, vi } = import.meta.vitest;

	// 依存関係のモック
	vi.mock("../lib/apiClient.js");
	vi.mock("../lib/contentExtractor.js");
	vi.mock("../lib/evaluator.js");
	vi.mock("inquirer");

	test("getOrCreateArticle が記事IDで既存記事を取得する", async () => {
		const mockArticle = {
			id: 1,
			title: "テスト記事",
			url: "https://example.com/article",
			createdAt: "2023-01-01T00:00:00Z",
		};

		(apiClient.getBookmark as any) = vi.fn().mockResolvedValue(mockArticle);

		const result = await getOrCreateArticle({
			articleId: 1,
			autoEvaluate: false,
			skipConfirmation: false,
			outputFormat: "text" as const,
		});
		expect(result).toEqual(mockArticle);
		expect(apiClient.getBookmark).toHaveBeenCalledWith(1);
	});

	test("getOrCreateArticle がURLで新規記事を作成する", async () => {
		const mockArticle = {
			id: 2,
			title: "新規記事",
			url: "https://example.com/new-article",
			createdAt: "2023-01-01T00:00:00Z",
		};

		(apiClient.checkExistingBookmark as any) = vi.fn().mockResolvedValue(null);
		(apiClient.createBookmark as any) = vi.fn().mockResolvedValue(mockArticle);

		const result = await getOrCreateArticle({
			url: "https://example.com/new-article",
			autoEvaluate: false,
			skipConfirmation: false,
			outputFormat: "text" as const,
		});
		expect(result).toEqual(mockArticle);
		expect(apiClient.createBookmark).toHaveBeenCalled();
	});

	test("getOrCreateArticle が無効なURLでエラーを投げる", async () => {
		await expect(
			getOrCreateArticle({
				url: "invalid-url",
				autoEvaluate: false,
				skipConfirmation: false,
				outputFormat: "text" as const,
			})
		).rejects.toThrow("無効なURLです");
	});

	test("extractArticleContent が正しく動作する", async () => {
		const mockContent = {
			title: "テスト記事",
			content: "記事の内容",
			wordCount: 100,
			url: "https://example.com/article",
		};

		(contentExtractor.extractContent as any) = vi.fn().mockResolvedValue(mockContent);

		const result = await extractArticleContent("https://example.com/article");
		expect(result).toEqual(mockContent);
	});

	test("confirmEvaluation がユーザー入力を正しく処理する", async () => {
		const mockContent = {
			title: "テスト記事",
			content: "記事の内容",
			wordCount: 100,
			url: "https://example.com/article",
		};

		(inquirer.prompt as any) = vi.fn().mockResolvedValue({ proceed: true });

		const result = await confirmEvaluation(mockContent);
		expect(result).toBe(true);
		expect(inquirer.prompt).toHaveBeenCalled();
	});

	test("saveRating が正しく評価を保存する", async () => {
		const mockEvaluation = {
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			totalScore: 7.6,
			comment: "良い記事です",
		};

		const mockSavedRating = {
			id: 1,
			articleId: 1,
			...mockEvaluation,
			createdAt: "2023-01-01T00:00:00Z",
		};

		(apiClient.saveRating as any) = vi.fn().mockResolvedValue(mockSavedRating);

		const result = await saveRating(1, mockEvaluation);
		expect(result).toEqual(mockSavedRating);
		expect(apiClient.saveRating).toHaveBeenCalledWith({
			articleId: 1,
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			comment: "良い記事です",
		});
	});
}
