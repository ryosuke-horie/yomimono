import { API_BASE_URL } from "@/lib/api/config";
import type { ApiBookmarkResponse } from "@/types/api";
import type { Bookmark } from "@/types/bookmark";
import { useCallback } from "react";

export function useBookmarks() {
  const getUnreadBookmarks = useCallback(async (): Promise<Bookmark[]> => {
    const url = `${API_BASE_URL}/api/bookmarks/unread`;
    console.log("Fetching unread bookmarks from:", url);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const responseText = await response.text();
      console.log("Response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookmarks: ${response.status}`);
      }

      try {
        const data = JSON.parse(responseText) as ApiBookmarkResponse;
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch bookmarks");
        }
        return data.bookmarks || [];
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("API error:", {
        error,
        url,
      });
      throw error;
    }
  }, []);

  const markAsRead = useCallback(async (id: number): Promise<void> => {
    const url = `${API_BASE_URL}/api/bookmarks/${id}/read`;
    console.log("Marking as read:", url);

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const responseText = await response.text();
      console.log("Response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });

      if (!response.ok) {
        throw new Error(`Failed to mark as read: ${response.status}`);
      }

      try {
        const data = JSON.parse(responseText) as ApiBookmarkResponse;
        if (!data.success) {
          throw new Error(data.message || "Failed to mark as read");
        }
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("API error:", {
        error,
        url,
      });
      throw error;
    }
  }, []);

  return {
    getUnreadBookmarks,
    markAsRead,
  };
}