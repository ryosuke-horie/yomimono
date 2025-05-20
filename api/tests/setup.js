import { vi } from "vitest";
import { mockFetch } from "./test-utils";
vi.stubGlobal("fetch", mockFetch);
afterEach(() => {
	vi.clearAllMocks();
});
