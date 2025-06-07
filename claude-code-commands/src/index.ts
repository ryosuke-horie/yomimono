#!/usr/bin/env node

import chalk from "chalk";
/**
 * Claude Code カスタムコマンドのメインエントリーポイント
 */
import { Command } from "commander";
import { rateArticleCommand } from "./commands/rateArticle.js";
import { rateArticlesBatchCommand } from "./commands/rateArticlesBatch.js";
import { apiClient } from "./lib/apiClient.js";
import { ConsoleOutput } from "./lib/utils.js";
import {
	type BatchRateOptions,
	BatchRateOptionsSchema,
	type RateArticleOptions,
	RateArticleOptionsSchema,
} from "./types/index.js";

const program = new Command();

// プログラム基本情報
program
	.name("yomimono-commands")
	.description("Claude Code custom commands for article rating workflow automation")
	.version("0.1.0");

/**
 * rate-article コマンド
 */
program
	.command("rate-article")
	.description("記事を評価します")
	.option("-u, --url <url>", "評価する記事のURL")
	.option("-i, --article-id <id>", "既存記事のID", (value) => Number.parseInt(value, 10))
	.option("-a, --auto-evaluate", "確認をスキップして自動実行", false)
	.option("-s, --skip-confirmation", "確認プロンプトをスキップ", false)
	.option("-f, --output-format <format>", "出力形式 (text, json, summary)", "text")
	.action(async (options) => {
		try {
			// オプションの検証
			const validatedOptions = RateArticleOptionsSchema.parse(options);

			// API ヘルスチェック
			const isHealthy = await apiClient.healthCheck();
			if (!isHealthy) {
				ConsoleOutput.warn(
					"API サーバーに接続できません。サーバーが起動しているか確認してください。"
				);
			}

			// コマンド実行
			await rateArticleCommand(validatedOptions);
		} catch (error) {
			handleError(error);
			process.exit(1);
		}
	});

/**
 * rate-articles-batch コマンド
 */
program
	.command("rate-articles-batch")
	.description("URLリストから複数記事を一括評価します")
	.requiredOption("-f, --urls-file <file>", "URLリストファイルのパス")
	.option("-c, --concurrency <number>", "並行実行数", (value) => Number.parseInt(value, 10), 3)
	.option("-s, --skip-existing", "既に評価済みの記事をスキップ", false)
	.option("-o, --output-file <file>", "結果出力ファイルのパス")
	.action(async (options) => {
		try {
			// オプションの検証
			const validatedOptions = BatchRateOptionsSchema.parse(options);

			// API ヘルスチェック
			const isHealthy = await apiClient.healthCheck();
			if (!isHealthy) {
				ConsoleOutput.warn(
					"API サーバーに接続できません。サーバーが起動しているか確認してください。"
				);
			}

			// コマンド実行
			await rateArticlesBatchCommand(validatedOptions);
		} catch (error) {
			handleError(error);
			process.exit(1);
		}
	});

/**
 * health コマンド（ヘルスチェック）
 */
program
	.command("health")
	.description("システムヘルスチェックを実行します")
	.action(async () => {
		try {
			ConsoleOutput.section("システムヘルスチェック");

			// API サーバーチェック
			const isApiHealthy = await apiClient.healthCheck();
			if (isApiHealthy) {
				ConsoleOutput.success("API サーバー: 接続OK");
			} else {
				ConsoleOutput.error("API サーバー: 接続エラー");
			}

			// 環境変数チェック
			const requiredEnvVars = [
				{ name: "ANTHROPIC_API_KEY", description: "Claude API キー" },
				{ name: "API_BASE_URL", description: "API ベースURL (オプション)" },
				{ name: "FRONTEND_URL", description: "フロントエンドURL (オプション)" },
			];

			ConsoleOutput.subsection("環境変数チェック");
			for (const envVar of requiredEnvVars) {
				const value = process.env[envVar.name];
				if (value) {
					if (envVar.name === "ANTHROPIC_API_KEY") {
						ConsoleOutput.success(`${envVar.name}: 設定済み (${value.substring(0, 8)}...)`);
					} else {
						ConsoleOutput.success(`${envVar.name}: ${value}`);
					}
				} else {
					if (envVar.name === "ANTHROPIC_API_KEY") {
						ConsoleOutput.error(`${envVar.name}: 未設定 - ${envVar.description}`);
					} else {
						ConsoleOutput.info(`${envVar.name}: 未設定 - ${envVar.description}`);
					}
				}
			}

			// 依存関係チェック
			ConsoleOutput.subsection("依存関係チェック");
			ConsoleOutput.success(`Node.js: ${process.version}`);
			ConsoleOutput.success(`Platform: ${process.platform}`);
		} catch (error) {
			handleError(error);
			process.exit(1);
		}
	});

/**
 * config コマンド（設定表示）
 */
program
	.command("config")
	.description("現在の設定を表示します")
	.action(() => {
		try {
			ConsoleOutput.section("現在の設定");

			const config = {
				"API Base URL": process.env.API_BASE_URL || "http://localhost:8787 (デフォルト)",
				"Frontend URL": process.env.FRONTEND_URL || "http://localhost:3000 (デフォルト)",
				"Claude API Key": process.env.ANTHROPIC_API_KEY ? "設定済み" : "未設定",
				"Node.js Version": process.version,
				Platform: process.platform,
			};

			ConsoleOutput.summary(config);

			ConsoleOutput.subsection("使用方法");
			console.log("環境変数の設定例:");
			console.log(chalk.gray("export ANTHROPIC_API_KEY=your_api_key_here"));
			console.log(chalk.gray("export API_BASE_URL=https://your-api.example.com"));
			console.log(chalk.gray("export FRONTEND_URL=https://your-frontend.example.com"));
		} catch (error) {
			handleError(error);
			process.exit(1);
		}
	});

/**
 * エラーハンドリング
 */
function handleError(error: unknown): void {
	const errorMessage = error instanceof Error ? error.message : String(error);

	ConsoleOutput.error("コマンド実行中にエラーが発生しました");

	if (errorMessage.includes("ValidationError") || errorMessage.includes("ZodError")) {
		ConsoleOutput.info("💡 コマンドオプションを確認してください");
		ConsoleOutput.info("💡 --help オプションで詳細を確認できます");
	} else if (errorMessage.includes("ENOENT")) {
		ConsoleOutput.info("💡 指定されたファイルが見つかりません");
	} else if (errorMessage.includes("EACCES")) {
		ConsoleOutput.info("💡 ファイルのアクセス権限を確認してください");
	} else {
		console.error(chalk.red(errorMessage));
	}

	if (process.env.DEBUG) {
		console.error(chalk.gray("\nデバッグ情報:"));
		console.error(error);
	}
}

/**
 * グローバルエラーハンドラー
 */
process.on("uncaughtException", (error) => {
	ConsoleOutput.error(`予期しないエラーが発生しました: ${error.message}`);
	if (process.env.DEBUG) {
		console.error(error);
	}
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	ConsoleOutput.error(`未処理のPromise拒否: ${reason}`);
	if (process.env.DEBUG) {
		console.error("Promise:", promise);
		console.error("Reason:", reason);
	}
	process.exit(1);
});

// プログラム実行
program.parse();

if (import.meta.vitest) {
	const { test, expect, vi } = import.meta.vitest;

	test("プログラムが正しく初期化される", () => {
		expect(program.name()).toBe("yomimono-commands");
		expect(program.version()).toBe("0.1.0");
	});

	test("rate-article コマンドが登録されている", () => {
		const rateArticleCmd = program.commands.find((cmd) => cmd.name() === "rate-article");
		expect(rateArticleCmd).toBeDefined();
		expect(rateArticleCmd?.description()).toContain("記事を評価");
	});

	test("rate-articles-batch コマンドが登録されている", () => {
		const batchCmd = program.commands.find((cmd) => cmd.name() === "rate-articles-batch");
		expect(batchCmd).toBeDefined();
		expect(batchCmd?.description()).toContain("一括評価");
	});

	test("health コマンドが登録されている", () => {
		const healthCmd = program.commands.find((cmd) => cmd.name() === "health");
		expect(healthCmd).toBeDefined();
		expect(healthCmd?.description()).toContain("ヘルスチェック");
	});

	test("config コマンドが登録されている", () => {
		const configCmd = program.commands.find((cmd) => cmd.name() === "config");
		expect(configCmd).toBeDefined();
		expect(configCmd?.description()).toContain("設定を表示");
	});

	test("handleError が正しくエラーを処理する", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const testError = new Error("テストエラー");
		handleError(testError);

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
}
