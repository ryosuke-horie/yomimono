/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
	define: {
		// in-source testingのためのimport.meta.vitestの定義
		"import.meta.vitest": "undefined",
	},
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./tests/setup.ts"],
		// in-source testingを有効化
		includeSource: ["src/**/*.ts"],
		// typecheck mode for better TypeScript support
		typecheck: {
			include: ["src/**/*.ts", "tests/**/*.ts"],
		},
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
