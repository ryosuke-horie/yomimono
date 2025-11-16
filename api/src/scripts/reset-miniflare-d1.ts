import fs from "node:fs";
import path from "node:path";

const MINIFLARE_DB_DIR = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";

async function removeMiniflareDatabases(): Promise<void> {
	const targetDir = path.resolve(process.cwd(), MINIFLARE_DB_DIR);

	if (!fs.existsSync(targetDir)) {
		console.log(
			`Miniflare D1ローカルDBディレクトリ (${MINIFLARE_DB_DIR}) は存在しません。スキップします。`,
		);
		return;
	}

	console.log(
		`Miniflare D1ローカルDBを削除しています... (${path.relative(process.cwd(), targetDir)})`,
	);

	await fs.promises.rm(targetDir, { recursive: true, force: true });

	console.log("✅ Miniflare D1ローカルDBを削除しました");
}

removeMiniflareDatabases().catch((error) => {
	console.error("Miniflare D1ローカルDB削除に失敗しました", error);
	process.exitCode = 1;
});
