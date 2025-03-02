import { Hono } from "hono";
import type { BookmarkService } from "../services/bookmark";

export const createBookmarksRouter = (bookmarkService: BookmarkService) => {
        const app = new Hono();

        app.get("/unread", async (c) => {
                try {
                        const bookmarks = await bookmarkService.getUnreadBookmarks();
                        return c.json({ success: true, bookmarks });
                } catch (error) {
                        console.error("Failed to fetch unread bookmarks:", error);
                        return c.json(
                                { success: false, message: "未読ブックマークの取得に失敗しました。サーバー内部でエラーが発生しています。" },
                                500,
                        );
                }
        });

        app.post("/bulk", async (c) => {
                try {
                        const { bookmarks } = await c.req.json<{
                                bookmarks: Array<{ url: string; title: string }>;
                        }>();

                        // バリデーション
                        if (!Array.isArray(bookmarks)) {
                                return c.json(
                                        { success: false, message: "ブックマークデータは配列形式で送信してください。" },
                                        400,
                                );
                        }

                        if (bookmarks.length === 0) {
                                return c.json(
                                        { success: false, message: "ブックマークデータが空です。少なくとも1つのブックマークを含めてください。" },
                                        400,
                                );
                        }

                        // URLの形式チェック
                        const isValidUrl = (url: string) => {
                                try {
                                        new URL(url);
                                        return true;
                                } catch {
                                        return false;
                                }
                        };

                        if (!bookmarks.every((b) => isValidUrl(b.url))) {
                                return c.json({ success: false, message: "URLの形式が正しくありません。有効なURLを入力してください。" }, 400);
                        }

                        await bookmarkService.createBookmarksFromData(bookmarks);
                        return c.json({ success: true });
                } catch (error) {
                        console.error("Failed to create bookmarks:", error);
                        return c.json(
                                { success: false, message: "ブックマークの作成に失敗しました。サーバー内部でエラーが発生しています。" },
                                500,
                        );
                }
        });

        return app;
};
