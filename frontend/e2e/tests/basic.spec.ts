/**
 * 基本的なE2Eテスト
 */
import { expect, test } from "@playwright/test";

test("基本テスト - Playwrightが正常に動作する", async ({ page }) => {
	await page.goto("https://www.google.com");
	await expect(page.locator("title")).toHaveText(/Google/);
});
