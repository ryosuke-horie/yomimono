import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
/**
 * Vitest設定ファイル
 * Next.jsとReactコンポーネントのテスト環境を構築
 */
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths(), react()],
	define: {
		"import.meta.vitest": true,
	},
	test: {
		watch: false,
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		includeSource: ["src/**/*.{js,jsx,ts,tsx}"],
		exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
		env: {
			NEXT_PUBLIC_API_URL: "http://localhost:3001",
		},
		// パフォーマンス最適化設定（MSWのためにforksを使用）
		pool: "forks",

		// カバレッジ設定
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "json-summary", "html", "lcov"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"coverage/**",
				"dist/**",
				"**/*.d.ts",
				"**/.next/**",
				"**/.open-next/**",
				"**/node_modules/**",
				"**/vitest.config.{js,ts}",
				"**/vitest.setup.ts",
				"**/postcss.config.mjs",
				"**/next.config.mjs",
				"**/tailwind.config.{js,ts}",
				"**/*.test.{ts,tsx}",
				"**/*.spec.{ts,tsx}",
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
		},
	},
});
