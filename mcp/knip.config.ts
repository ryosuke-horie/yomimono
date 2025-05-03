import type { KnipConfig } from "knip";

const config: KnipConfig = {
	// No specific ignores needed for MCP server initially
	ignore: [],
	entry: {
		// tscはtypescriptコンパイラバイナリとして使用
		bin: ["tsc"]
	}
};

export default config;
