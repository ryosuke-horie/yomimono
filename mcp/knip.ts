import type { KnipConfig } from "knip";

const config: KnipConfig = {
	entry: ["src/index.ts", "src/**/*.test.ts"],
	project: ["src/**/*.ts"],
	ignore: ["build/**"],
};

export default config;
