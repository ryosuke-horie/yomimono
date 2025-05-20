import type { BookmarkWithLabel } from "@/features/bookmarks/types";
import { useQuery } from "@tanstack/react-query";
import { getReadBookmarks } from "./api";
import { bookmarkKeys } from "./queryKeys";

export const useGetReadBookmarks = () => {
  return useQuery<BookmarkWithLabel[], Error>({
    queryKey: bookmarkKeys.list("read"),
    queryFn: getReadBookmarks,
  });
};