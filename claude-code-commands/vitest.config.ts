/**
 * Vitest設定ファイル
 * Claude Code カスタムコマンドのテスト環境設定
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: ["node_modules/", "dist/", "**/*.test.ts"],
			thresholds: {
				global: {
					branches: 90,
					functions: 90,
					lines: 90,
					statements: 90,
				},
			},
		},
	},
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test("vitest設定が正しく読み込まれる", () => {
		expect(true).toBe(true);
	});
}
