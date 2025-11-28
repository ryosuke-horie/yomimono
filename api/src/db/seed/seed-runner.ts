import { clearDatabase, runSeedData } from "./seed";

async function main(): Promise<void> {
	const preset =
		process.env.SEED_PRESET?.trim() || process.argv[2] || "default";

	if (preset === "clear") {
		console.log("シードプリセット: clear (データクリア)");
		await clearDatabase();
		return;
	}

	console.log("シードプリセット: default");
	await runSeedData();
}

main().catch((error) => {
	console.error("シードスクリプトの実行に失敗しました", error);
	process.exit(1);
});
