/**
 * 最近読んだブックマーク一覧画面
 * 日付グループ別に既読ブックマークを表示する
 */
import SwiftUI

struct RecentView: View {
    @StateObject private var viewModel = RecentViewModel()

    var body: some View {
        VStack(spacing: 0) {
            if !viewModel.isLoading && viewModel.errorMessage == nil {
                HStack {
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
            } else if viewModel.groupedBookmarks.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "clock")
                        .font(.system(size: 48))
                        .foregroundStyle(.secondary)
                    Text("最近読んだ記事はありません")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 16, pinnedViews: .sectionHeaders) {
                        ForEach(viewModel.groupedBookmarks, id: \.date) { group in
                            Section {
                                ForEach(group.bookmarks) { bookmark in
                                    BookmarkCardView(
                                        bookmark: bookmark,
                                        onMarkAsRead: { await viewModel.markAsRead(bookmark: bookmark) },
                                        onMarkAsUnread: { await viewModel.markAsUnread(bookmark: bookmark) },
                                        onToggleFavorite: { await viewModel.toggleFavorite(bookmark: bookmark) }
                                    )
                                }
                            } header: {
                                Text(formattedDate(group.date))
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 4)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color(NSColor.windowBackgroundColor))
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .navigationTitle("最近読んだ")
        .task { await viewModel.load() }
    }

    private func formattedDate(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "ja_JP")
        if let date = formatter.date(from: dateStr) {
            let display = DateFormatter()
            display.dateStyle = .medium
            display.locale = Locale(identifier: "ja_JP")
            return display.string(from: date)
        }
        return dateStr
    }
}
