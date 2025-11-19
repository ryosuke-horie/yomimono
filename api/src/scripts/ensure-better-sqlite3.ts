import { execSync } from "node:child_process";

function tryLoadBetterSqlite3(): boolean {
	try {
		// requireを使うことでバインディングのロードに失敗した際に即座に検知する
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const Database = require("better-sqlite3") as typeof import("better-sqlite3");
		const db = new Database(":memory:");
		db.pragma("journal_mode = WAL");
		db.close();
		return true;
	} catch (error) {
		console.warn("better-sqlite3のローディングに失敗しました", error);
		return false;
	}
}

function ensureBetterSqlite3Binding() {
	console.log("better-sqlite3のネイティブバインディングを確認中...");

	if (tryLoadBetterSqlite3()) {
		console.log("better-sqlite3のバインディング確認OK");
		return;
	}

	console.log(
		"バインディングが見つからないため再ビルドを実行します（pnpm rebuild better-sqlite3）",
	);
	execSync("pnpm rebuild better-sqlite3", { stdio: "inherit" });

	if (!tryLoadBetterSqlite3()) {
		throw new Error(
			"better-sqlite3のバインディング再確認に失敗しました。Node.jsのビルドツールチェーン（Python, make等）の確認をお願いします。",
		);
	}

	console.log("再ビルド後、better-sqlite3のバインディングが正常に読み込まれました");
}

ensureBetterSqlite3Binding();
