import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.{test,spec}.{js,ts}"],
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
