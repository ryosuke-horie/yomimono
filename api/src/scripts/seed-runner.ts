import type { SeedDataOptions } from "../interfaces/service/seed";
import { clearDatabase, runSeedData } from "./seed";

type SeedAction =
	| { type: "run"; name: string; options?: SeedDataOptions }
	| { type: "clear"; name: string };

const PRESETS: Record<string, SeedAction> = {
	default: { type: "run", name: "default" },
	development: { type: "run", name: "development" },
	test: {
		type: "run",
		name: "test",
		options: { bookmarkCount: 5, labelCount: 3, favoriteRatio: 0.2 },
	},
	custom: {
		type: "run",
		name: "custom",
		options: { bookmarkCount: 50, labelCount: 8, favoriteRatio: 0.4 },
	},
	clear: { type: "clear", name: "clear" },
};

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
	const preset = PRESETS[presetName];

	if (!preset) {
		const available = Object.keys(PRESETS).join(", ");
		throw new Error(
			`未知のシードプリセット "${presetName}" が指定されました。利用可能なプリセット: ${available}`,
		);
	}

	if (preset.type === "clear") {
		console.log(`シードプリセット: ${preset.name} (データクリア)`);
		await clearDatabase();
		return;
	}

	const extraOptions = parseAdditionalOptions();
	const seedOptions = {
		...preset.options,
		...extraOptions,
	};

	console.log(
		`シードプリセット: ${preset.name} (${JSON.stringify(seedOptions) || "デフォルト設定"})`,
	);

	await runSeedData(seedOptions);
}

main().catch((error) => {
	console.error("シードスクリプトの実行に失敗しました", error);
	process.exit(1);
});
