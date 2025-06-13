/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
	define: {
		"import.meta.vitest": "undefined",
	},
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./tests/setup.ts"],
		includeSource: ["src/**/*.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "json-summary"],
			exclude: [
				"node_modules/",
				"dist/",
				"coverage/",
				"**/*.d.ts",
				"**/*.config.ts",
				"src/index.ts", // index.tsをカバレッジから除外
				"src/interfaces/**", // インターフェースはカバレッジに含めない
				"src/routes/**", // ルートハンドラーはモックテストのため正確なカバレッジが取れない
			],
			thresholds: {
				lines: 76,
				functions: 80,
				branches: 80,
				statements: 76,
			},
		},
	},
});
