import { describe, expect, test } from "vitest";
import {
	formatToISODate,
	formatToTimezone,
	groupByDate,
	isValidTimezone,
} from "./timezone";

const testDate = new Date("2024-01-15T10:30:00Z");

describe("Timezone Utils", () => {
	test("formatToTimezoneが正しく日付をフォーマットする", () => {
		const result = formatToTimezone(testDate, "Asia/Tokyo");
		expect(result).toMatch(/2024\/01\/15/);
	});

	test("formatToISODateがISO形式で日付を返す", () => {
		const result = formatToISODate(testDate, "Asia/Tokyo");
		expect(result).toBe("2024-01-15");
	});

	test("無効なタイムゾーンでもエラーにならずデフォルトを使用", () => {
		const result = formatToISODate(testDate, "Invalid/Timezone");
		expect(result).toBe("2024-01-15"); // デフォルトタイムゾーンでの結果
	});

	test("groupByDateが正しく日付でグループ化する", () => {
		const items = [
			{ id: 1, updatedAt: new Date("2024-01-15T02:00:00Z") }, // 11:00 JST (same day)
			{ id: 2, updatedAt: new Date("2024-01-15T10:00:00Z") }, // 19:00 JST (same day)
			{ id: 3, updatedAt: new Date("2024-01-16T10:00:00Z") }, // 19:00 JST next day
		];

		const grouped = groupByDate(items, "Asia/Tokyo");
		expect(Object.keys(grouped)).toHaveLength(2);
		expect(grouped["2024-01-15"]).toHaveLength(2);
		expect(grouped["2024-01-16"]).toHaveLength(1);
	});

	test("無効な日付がある場合はスキップされる", () => {
		const items = [
			{ id: 1, updatedAt: new Date("2024-01-15T10:00:00Z") },
			{ id: 2, updatedAt: new Date("invalid") },
			{ id: 3, updatedAt: new Date("2024-01-16T10:00:00Z") },
		];

		const grouped = groupByDate(items);
		expect(Object.keys(grouped)).toHaveLength(2);
	});

	test("isValidTimezoneが正しくタイムゾーンを検証する", () => {
		expect(isValidTimezone("Asia/Tokyo")).toBe(true);
		expect(isValidTimezone("UTC")).toBe(true);
		expect(isValidTimezone("Invalid/Timezone")).toBe(false);
	});

	test("formatToTimezoneで無効なタイムゾーンの場合デフォルトを使用", () => {
		const result = formatToTimezone(testDate, "Invalid/Timezone");
		// デフォルトタイムゾーンでの結果が返される
		expect(result).toMatch(/2024\/01\/15/);
	});
});
