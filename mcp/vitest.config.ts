import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.{test,spec}.{js,ts}"],
		coverage: {
			reporter: ["text", "lcov", "html"],
			reportsDirectory: "./coverage",
			provider: "v8",
			excludeNodeModules: true,
			exclude: [
				"src/test/**",
				"src/types/**",
				"*.config.{js,ts}",
			],
		},
	},
});
