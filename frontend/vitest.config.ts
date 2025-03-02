import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "json-summary", "json"],
			exclude: [
				"node_modules/**",
				"**/*.config.{js,ts}",
				"test/**",
				"**/__tests__/**",
				".next/**",
				".open-next/**",
			],
			include: ["src/components/**", "src/lib/**"],
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
});
