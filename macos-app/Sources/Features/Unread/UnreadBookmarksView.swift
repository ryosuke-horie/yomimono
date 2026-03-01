/**
 * 未読ブックマーク一覧画面
 * ブックマークカードを一覧表示し、既読化・お気に入りトグル操作を提供する
 */
import SwiftUI

struct UnreadBookmarksView: View {
    @StateObject private var viewModel = UnreadBookmarksViewModel()

    var body: some View {
        VStack(spacing: 0) {
            // ヘッダー統計
            if !viewModel.isLoading && viewModel.errorMessage == nil {
                HStack {
                    Text("未読: \(viewModel.totalUnread)件")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("今日読んだ: \(viewModel.todayReadCount)件")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Button("更新") {
                        Task { await viewModel.load() }
                    }
                    .buttonStyle(.plain)
                    .font(.caption)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color(NSColor.windowBackgroundColor))

                Divider()
            }

            if viewModel.isLoading {
                ProgressView("読み込み中...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = viewModel.errorMessage {
                VStack(spacing: 12) {
                    Text("エラーが発生しました")
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Button("再読み込み") {
                        Task { await viewModel.load() }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.bookmarks.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.circle")
                        .font(.system(size: 48))
                        .foregroundStyle(.green)
                    Text("未読記事はありません")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(viewModel.bookmarks) { bookmark in
                            BookmarkCardView(
                                bookmark: bookmark,
                                onMarkAsRead: { await viewModel.markAsRead(bookmark: bookmark) },
                                onMarkAsUnread: { await viewModel.markAsUnread(bookmark: bookmark) },
                                onToggleFavorite: { await viewModel.toggleFavorite(bookmark: bookmark) }
                            )
                        }
                    }
                    .padding(16)
                }
            }
        }
        .navigationTitle("未読")
        .task { await viewModel.load() }
    }
}
