import type { SeedDataOptions } from "../interfaces/service/seed";
import { clearDatabase, runSeedData } from "./seed";

function parsePresetName(): string {
	return process.env.SEED_PRESET?.trim() || process.argv[2] || "default";
}

function parseAdditionalOptions(): SeedDataOptions | undefined {
	const rawOptions = process.env.SEED_OPTIONS;
	if (!rawOptions) return undefined;

	try {
		const parsed = JSON.parse(rawOptions) as SeedDataOptions;
		return parsed;
	} catch (error) {
		throw new Error(
			"SEED_OPTIONSのJSONパースに失敗しました。正しいJSON文字列を指定してください。",
			{ cause: error },
		);
	}
}

async function main(): Promise<void> {
	const presetName = parsePresetName();
	const extraOptions = parseAdditionalOptions();

	if (presetName === "clear") {
		console.log("シードプリセット: clear (データクリア)");
		await clearDatabase();
		return;
	}

	if (!extraOptions || Object.keys(extraOptions).length === 0) {
		console.log("シードプリセット: default");
		await runSeedData();
		return;
	}

	console.log(
		`シードプリセット: custom (${JSON.stringify(extraOptions)})`,
	);
	await runSeedData(extraOptions);
}

main().catch((error) => {
	console.error("シードスクリプトの実行に失敗しました", error);
	process.exit(1);
});
