/**
 * 最近読んだブックマーク一覧画面
 * 日付グループ別に既読ブックマークを表示する
 */
import SwiftUI

struct RecentView: View {
    @StateObject private var viewModel = RecentViewModel()

    // DateFormatter は高コストなため static でキャッシュする
    private static let inputFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "ja_JP")
        return f
    }()

    private static let displayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.locale = Locale(identifier: "ja_JP")
        return f
    }()

    var body: some View {
        VStack(spacing: 0) {
            if !viewModel.isLoading && viewModel.loadError == nil {
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

            if let mutationError = viewModel.mutationError {
                HStack {
                    Image(systemName: "exclamationmark.triangle")
                        .foregroundStyle(.orange)
                    Text(mutationError)
                        .font(.caption)
                        .foregroundStyle(.primary)
                    Spacer()
                    Button("閉じる") { viewModel.mutationError = nil }
                        .font(.caption)
                        .buttonStyle(.plain)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 6)
                .background(Color.orange.opacity(0.1))
            }

            if viewModel.isLoading {
                ProgressView("読み込み中...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = viewModel.loadError {
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
        if let date = Self.inputFormatter.date(from: dateStr) {
            return Self.displayFormatter.string(from: date)
        }
        return dateStr
    }
}
