/**
 * Claude Code カスタムコマンドのユーティリティ関数
 */
import chalk from "chalk";
import ora from "ora";
import type { ProgressStep } from "../types/index.js";

/**
 * プログレス表示クラス
 */
export class ProgressDisplay {
	private spinner = ora();

	/**
	 * ステップ開始
	 */
	startStep(step: ProgressStep): void {
		const message = `[${step.step}/${step.total}] ${step.name}`;
		this.spinner.start(chalk.blue(message));
	}

	/**
	 * ステップ成功
	 */
	succeedStep(message?: string): void {
		if (message) {
			this.spinner.succeed(chalk.green(message));
		} else {
			this.spinner.succeed();
		}
	}

	/**
	 * ステップ失敗
	 */
	failStep(message?: string): void {
		if (message) {
			this.spinner.fail(chalk.red(message));
		} else {
			this.spinner.fail();
		}
	}

	/**
	 * ステップ警告
	 */
	warnStep(message: string): void {
		this.spinner.warn(chalk.yellow(message));
	}

	/**
	 * 情報表示
	 */
	info(message: string): void {
		this.spinner.info(chalk.cyan(message));
	}

	/**
	 * スピナー停止
	 */
	stop(): void {
		this.spinner.stop();
	}
}

/**
 * コンソール出力ユーティリティ
 */
export class ConsoleOutput {
	/**
	 * 成功メッセージ
	 */
	static success(message: string): void {
		console.log(chalk.green(`✅ ${message}`));
	}

	/**
	 * エラーメッセージ
	 */
	static error(message: string): void {
		console.log(chalk.red(`❌ ${message}`));
	}

	/**
	 * 警告メッセージ
	 */
	static warn(message: string): void {
		console.log(chalk.yellow(`⚠️  ${message}`));
	}

	/**
	 * 情報メッセージ
	 */
	static info(message: string): void {
		console.log(chalk.cyan(`ℹ️  ${message}`));
	}

	/**
	 * セクションヘッダー
	 */
	static section(title: string): void {
		console.log(chalk.bold.blue(`\n🚀 ${title}`));
	}

	/**
	 * サブセクション
	 */
	static subsection(title: string): void {
		console.log(chalk.bold(`\n📋 ${title}`));
	}

	/**
	 * 区切り線
	 */
	static separator(): void {
		console.log(chalk.gray("─".repeat(50)));
	}

	/**
	 * 結果サマリー
	 */
	static summary(items: Record<string, string | number>): void {
		console.log(chalk.bold("\n📊 結果サマリー:"));
		for (const [key, value] of Object.entries(items)) {
			console.log(`   ${chalk.cyan(key)}: ${chalk.white(value)}`);
		}
	}
}

/**
 * ファイル読み込みユーティリティ
 */
export class FileUtils {
	/**
	 * URLリストファイルを読み込む
	 */
	static async readUrlsFromFile(filePath: string): Promise<string[]> {
		const fs = await import("node:fs/promises");
		try {
			const content = await fs.readFile(filePath, "utf-8");
			const urls = content
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line && !line.startsWith("#"));
			return urls;
		} catch (error) {
			throw new Error(`URLファイルの読み込みに失敗しました: ${error}`);
		}
	}

	/**
	 * 結果をファイルに書き込む
	 */
	static async writeResultsToFile(filePath: string, data: any): Promise<void> {
		const fs = await import("node:fs/promises");
		try {
			const jsonData = JSON.stringify(data, null, 2);
			await fs.writeFile(filePath, jsonData, "utf-8");
		} catch (error) {
			throw new Error(`結果ファイルの書き込みに失敗しました: ${error}`);
		}
	}
}

/**
 * 時間計測ユーティリティ
 */
export class Timer {
	private startTime: number;

	constructor() {
		this.startTime = Date.now();
	}

	/**
	 * 経過時間を取得（ミリ秒）
	 */
	elapsed(): number {
		return Date.now() - this.startTime;
	}

	/**
	 * 経過時間を取得（秒）
	 */
	elapsedSeconds(): number {
		return Math.round(this.elapsed() / 1000);
	}

	/**
	 * 人間が読みやすい形式で経過時間を取得
	 */
	elapsedFormatted(): string {
		const seconds = this.elapsedSeconds();
		if (seconds < 60) {
			return `${seconds}秒`;
		}
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}分${remainingSeconds}秒`;
	}
}

/**
 * 並行処理制御（セマフォ）
 */
export class Semaphore {
	private permits: number;
	private waiting: (() => void)[] = [];

	constructor(permits: number) {
		this.permits = permits;
	}

	/**
	 * セマフォを取得
	 */
	async acquire(): Promise<void> {
		if (this.permits > 0) {
			this.permits--;
			return;
		}

		return new Promise((resolve) => {
			this.waiting.push(resolve);
		});
	}

	/**
	 * セマフォを解放
	 */
	release(): void {
		this.permits++;
		const next = this.waiting.shift();
		if (next) {
			this.permits--;
			next();
		}
	}
}

/**
 * URL検証ユーティリティ
 */
export class UrlUtils {
	/**
	 * URLが有効かチェック
	 */
	static isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * URLからタイトルを抽出（簡易版）
	 */
	static extractTitleFromUrl(url: string): string {
		try {
			const urlObj = new URL(url);
			const path = urlObj.pathname;
			const segments = path.split("/").filter(Boolean);
			const lastSegment = segments[segments.length - 1];

			// ファイル拡張子を除去
			const title = lastSegment.replace(/\.[^/.]+$/, "");

			// ハイフンやアンダースコアをスペースに変換
			return title.replace(/[-_]/g, " ").trim() || url;
		} catch {
			return url;
		}
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("ProgressDisplayが正しく動作する", () => {
		const progress = new ProgressDisplay();
		expect(progress).toBeInstanceOf(ProgressDisplay);
	});

	test("Timerが正しく時間を計測する", async () => {
		const timer = new Timer();
		await new Promise((resolve) => setTimeout(resolve, 10));
		const elapsed = timer.elapsed();
		expect(elapsed).toBeGreaterThan(0);
		expect(elapsed).toBeLessThan(100);
	});

	test("Semaphoreが正しく並行処理を制御する", async () => {
		const semaphore = new Semaphore(2);
		let runningCount = 0;
		let maxRunning = 0;

		const tasks = Array(5)
			.fill(0)
			.map(async () => {
				await semaphore.acquire();
				runningCount++;
				maxRunning = Math.max(maxRunning, runningCount);
				await new Promise((resolve) => setTimeout(resolve, 10));
				runningCount--;
				semaphore.release();
			});

		await Promise.all(tasks);
		expect(maxRunning).toBeLessThanOrEqual(2);
	});

	test("UrlUtilsがURLを正しく検証する", () => {
		expect(UrlUtils.isValidUrl("https://example.com")).toBe(true);
		expect(UrlUtils.isValidUrl("http://example.com")).toBe(true);
		expect(UrlUtils.isValidUrl("invalid-url")).toBe(false);
		expect(UrlUtils.isValidUrl("")).toBe(false);
	});

	test("UrlUtilsがタイトルを正しく抽出する", () => {
		const title = UrlUtils.extractTitleFromUrl("https://example.com/my-awesome-article");
		expect(title).toBe("my awesome article");
	});
}
