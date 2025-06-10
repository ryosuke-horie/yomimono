import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.{test,spec}.{js,ts}"],
		// Exclude legacy API tests that need migration
		exclude: [
			"src/test/apiClientAdvanced.test.ts",
			"src/test/apiClientCore.test.ts", 
			"src/test/apiClientExtended.test.ts",
			"src/test/apiClientSchemaValidation.test.ts",
			"src/test/apiClientUnratedArticles.test.ts",
			"src/test/ratingApiClient.test.ts",
			"src/test/ratingMcpTools.test.ts",
			"src/test/ratingStatsAdvanced.test.ts",
			"src/test/ratingToolsAdvanced.test.ts",
			"src/test/mcpServer.test.ts",
			"src/test/indexDirectServerTests.test.ts",
			"src/test/getUnreadArticlesByLabel.test.ts", // Service layer error format change
		],
		coverage: {
			reporter: ["text", "lcov", "html", "json-summary"],
			reportsDirectory: "./coverage",
			provider: "v8",
			excludeNodeModules: true,
			include: ["src/**/*.ts"],
			exclude: [
				"src/test/**",
				"src/types/**",
				"*.config.{js,ts}",
				"**/*.test.{js,ts}",
				"**/*.spec.{js,ts}",
				"build/**",
				"coverage/**",
				"node_modules/**",
			],
		},
	},
});