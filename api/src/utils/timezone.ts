/**
 * タイムゾーン処理のユーティリティ関数群
 * 国際化対応と設定可能なタイムゾーン処理を提供
 */
import { TIMEZONE_CONFIG } from "../config/timezone";

/**
 * 指定されたタイムゾーンで日付をフォーマット
 */
export function formatToTimezone(
	date: Date,
	timezone: string = TIMEZONE_CONFIG.default,
): string {
	try {
		return new Intl.DateTimeFormat("ja-JP", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);
	} catch (error) {
		console.warn(`Invalid timezone: ${timezone}, using default`, error);
		return new Intl.DateTimeFormat("ja-JP", {
			timeZone: TIMEZONE_CONFIG.default,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);
	}
}

/**
 * 指定されたタイムゾーンでISO形式の日付文字列を取得（YYYY-MM-DD）
 */
export function formatToISODate(
	date: Date,
	timezone: string = TIMEZONE_CONFIG.default,
): string {
	try {
		// Intl.DateTimeFormatの結果をISO形式に変換
		const formatter = new Intl.DateTimeFormat("sv-SE", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
		return formatter.format(date);
	} catch (error) {
		console.warn(`Invalid timezone: ${timezone}, using default`, error);
		const formatter = new Intl.DateTimeFormat("sv-SE", {
			timeZone: TIMEZONE_CONFIG.default,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
		return formatter.format(date);
	}
}

/**
 * 配列のアイテムを日付でグループ化
 */
export function groupByDate<T extends { updatedAt: Date }>(
	items: T[],
	timezone?: string,
): { [dateStr: string]: T[] } {
	const grouped: { [dateStr: string]: T[] } = {};

	for (const item of items) {
		if (
			!(item.updatedAt instanceof Date) ||
			Number.isNaN(item.updatedAt.getTime())
		) {
			console.warn("Invalid updatedAt value found:", item.updatedAt);
			continue;
		}

		const dateStr = formatToISODate(item.updatedAt, timezone);

		if (!grouped[dateStr]) {
			grouped[dateStr] = [];
		}
		grouped[dateStr].push(item);
	}

	return grouped;
}

/**
 * タイムゾーンが有効かどうかを検証
 */
export function isValidTimezone(timezone: string): boolean {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: timezone });
		return true;
	} catch {
		return false;
	}
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe("Timezone Utils", () => {
		const testDate = new Date("2024-01-15T10:30:00Z");

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
	});
}
