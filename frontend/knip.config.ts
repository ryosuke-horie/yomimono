import type { KnipConfig } from "knip";

const config: KnipConfig = {
	ignore: ["open-next.config.ts"],
	ignoreDependencies: [
		// TailwindCSS v4 is not detectable currently
		"tailwindcss",
	],
};

export default config;
