const input = "../api/openapi.yaml";

const config = {
	browser: {
		input,
		output: {
			target: "src/lib/openapi/browser/index.ts",
			schemas: "src/lib/openapi/browser/schemas",
			client: "react-query",
			httpClient: "fetch",
			clean: true,
		},
	},
	bff: {
		input,
		output: {
			target: "src/lib/openapi/server/index.ts",
			schemas: "src/lib/openapi/server/schemas",
			client: "fetch",
			httpClient: "fetch",
			clean: true,
		},
	},
	apiTypes: {
		input,
		output: {
			target: "../api/src/generated/openapi-client.ts",
			schemas: "../api/src/generated/openapi-schemas",
			client: "fetch",
			httpClient: "fetch",
			clean: true,
		},
	},
};

export default config;
