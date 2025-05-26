/// <reference types="vitest" />

declare module "vitest" {
	interface ImportMeta {
		vitest?: typeof import("vitest");
	}
}

declare global {
	namespace ImportMeta {
		interface Meta {
			vitest?: typeof import("vitest");
		}
	}
}

export {};
