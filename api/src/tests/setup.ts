import { vi } from "vitest";
import { mockFetch } from "../../tests/test-utils";

vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
	vi.clearAllMocks();
});
