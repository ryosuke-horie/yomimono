/**
 * ブックマークカードコンポーネント
 * タイトル・URL・登録日・各種アクションボタンを表示する
 */
import SwiftUI

struct BookmarkCardView: View {
    let bookmark: BookmarkWithFavorite
    let onMarkAsRead: () async -> Void
    let onMarkAsUnread: () async -> Void
    let onToggleFavorite: () async -> Void

    @State private var isTogglingFavorite = false
    @State private var isMarkingRead = false
    @State private var isMarkingUnread = false
    @State private var showSummary = false

    // DateFormatter は高コストなため static でキャッシュする
    private static let iso8601Formatter = ISO8601DateFormatter()
    private static let displayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.locale = Locale(identifier: "ja_JP")
        return formatter
    }()

    private var displayTitle: String {
        bookmark.title ?? "タイトルなし"
    }

    private var formattedDate: String {
        if let date = Self.iso8601Formatter.date(from: bookmark.createdAt) {
            return Self.displayFormatter.string(from: date)
        }
        return bookmark.createdAt
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // タイトル（クリックでブラウザを開く）
            Button {
                openInBrowser()
            } label: {
                Text(displayTitle)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                    .lineLimit(3)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            .pointingHandCursor()

            // URL
            Text(bookmark.url)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .truncationMode(.middle)

            // 日付 + アクションボタン
            HStack {
                Text(formattedDate)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)

                Spacer()

                // 概要生成ボタン（CLI連携）
                Button {
                    showSummary = true
                } label: {
                    Image(systemName: "sparkles")
                        .foregroundStyle(.purple)
                }
                .buttonStyle(.plain)
                .frame(width: 24, height: 24)
                .sheet(isPresented: $showSummary) {
                    ArticleSummaryView(url: bookmark.url, title: displayTitle)
                }

                // お気に入りボタン
                actionButton(
                    isLoading: isTogglingFavorite,
                    icon: bookmark.isFavorite ? "star.fill" : "star",
                    color: bookmark.isFavorite ? .yellow : .secondary
                ) {
                    isTogglingFavorite = true
                    await onToggleFavorite()
                    isTogglingFavorite = false
                }

                // 既読/未読ボタン
                if bookmark.isRead {
                    actionButton(
                        isLoading: isMarkingUnread,
                        icon: "arrow.uturn.left.circle",
                        color: .blue
                    ) {
                        isMarkingUnread = true
                        await onMarkAsUnread()
                        isMarkingUnread = false
                    }
                } else {
                    actionButton(
                        isLoading: isMarkingRead,
                        icon: "checkmark.circle",
                        color: .green
                    ) {
                        isMarkingRead = true
                        await onMarkAsRead()
                        isMarkingRead = false
                    }
                }
            }
        }
        .padding(12)
        .background(bookmark.isRead
            ? Color(NSColor.controlBackgroundColor).opacity(0.5)
            : Color(NSColor.controlBackgroundColor))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color(NSColor.separatorColor), lineWidth: 0.5)
        )
    }

    @ViewBuilder
    private func actionButton(
        isLoading: Bool,
        icon: String,
        color: Color,
        action: @escaping () async -> Void
    ) -> some View {
        Button {
            Task { await action() }
        } label: {
            if isLoading {
                ProgressView()
                    .controlSize(.mini)
                    .frame(width: 16, height: 16)
            } else {
                Image(systemName: icon)
                    .foregroundStyle(color)
            }
        }
        .buttonStyle(.plain)
        .disabled(isLoading)
        .frame(width: 24, height: 24)
    }

    private func openInBrowser() {
        guard let url = URL(string: bookmark.url) else { return }
        NSWorkspace.shared.open(url)
        if !bookmark.isRead {
            Task {
                isMarkingRead = true
                await onMarkAsRead()
                isMarkingRead = false
            }
        }
    }
}

// カーソルスタイル用の拡張
// NSCursor.push()/pop() はスタックが崩れる危険があるため cursor.set() を使用する
extension View {
    func pointingHandCursor() -> some View {
        self.onHover { inside in
            if inside {
                NSCursor.pointingHand.set()
            } else {
                NSCursor.arrow.set()
            }
        }
    }
}
