/**
 * お気に入りブックマーク一覧画面
 * お気に入り登録済みのブックマークを一覧表示する
 */
import SwiftUI

struct FavoritesView: View {
    @StateObject private var viewModel = FavoritesViewModel()

    var body: some View {
        VStack(spacing: 0) {
            if !viewModel.isLoading && viewModel.errorMessage == nil {
                HStack {
                    Text("合計: \(viewModel.total)件")
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
                    Image(systemName: "star")
                        .font(.system(size: 48))
                        .foregroundStyle(.yellow)
                    Text("お気に入りはまだありません")
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
        .navigationTitle("お気に入り")
        .task { await viewModel.load() }
    }
}
