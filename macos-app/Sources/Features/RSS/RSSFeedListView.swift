/**
 * RSSフィード管理・記事一覧画面
 * フィードの登録・削除、記事取得、yomimono への一括登録を提供する
 */
import SwiftUI

struct RSSFeedListView: View {
    @StateObject private var viewModel = RSSFeedViewModel()
    @State private var showAddFeed = false
    @State private var selectedItems = Set<String>()

    var body: some View {
        HSplitView {
            // 左ペイン: フィード設定リスト
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("フィード")
                        .font(.headline)
                    Spacer()
                    Button {
                        showAddFeed = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)

                Divider()

                List {
                    ForEach(viewModel.feeds) { feed in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(feed.title)
                                    .font(.subheadline)
                                Text(feed.url)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                                    .truncationMode(.middle)
                                if let lastFetched = feed.lastFetchedAt {
                                    Text("最終取得: \(lastFetched, style: .relative)前")
                                        .font(.caption2)
                                        .foregroundStyle(.tertiary)
                                }
                            }
                            Spacer()
                        }
                    }
                    .onDelete { offsets in
                        viewModel.removeFeed(at: offsets)
                    }
                }
                .listStyle(.sidebar)

                Divider()

                Button("記事を取得") {
                    Task { await viewModel.fetchAll() }
                }
                .disabled(viewModel.isLoading || viewModel.feeds.isEmpty)
                .padding(12)
                .frame(maxWidth: .infinity)
            }
            .frame(minWidth: 200, maxWidth: 260)

            // 右ペイン: 取得した記事一覧
            VStack(spacing: 0) {
                // ツールバー
                HStack {
                    if !selectedItems.isEmpty {
                        Button("選択した \(selectedItems.count) 件を登録") {
                            let items = viewModel.feedItems.filter { selectedItems.contains($0.id) }
                            Task {
                                await viewModel.register(items: items)
                                selectedItems.removeAll()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.small)
                    } else {
                        Button("全件登録") {
                            let unregistered = viewModel.feedItems.filter { !$0.isRegistered }
                            Task { await viewModel.register(items: unregistered) }
                        }
                        .disabled(viewModel.feedItems.isEmpty || viewModel.isLoading)
                        .controlSize(.small)
                    }
                    Spacer()
                    if let success = viewModel.successMessage {
                        Text(success)
                            .font(.caption)
                            .foregroundStyle(.green)
                    }
                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .lineLimit(1)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color(NSColor.windowBackgroundColor))

                Divider()

                if viewModel.isLoading {
                    ProgressView("記事を取得中...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.feedItems.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "dot.radiowaves.left.and.right")
                            .font(.system(size: 48))
                            .foregroundStyle(.secondary)
                        Text(viewModel.feeds.isEmpty ? "フィードを追加してください" : "「記事を取得」を押してください")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(viewModel.feedItems, selection: $selectedItems) { item in
                        RSSFeedItemRow(item: item)
                    }
                    .listStyle(.plain)
                }
            }
        }
        .navigationTitle("RSSフィード")
        .sheet(isPresented: $showAddFeed) {
            AddFeedSheet { url, title in
                viewModel.addFeed(url: url, title: title)
            }
        }
    }
}

// MARK: - 記事行

struct RSSFeedItemRow: View {
    let item: RSSFeedItem

    var body: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(.subheadline)
                    .lineLimit(2)
                    .foregroundStyle(item.isRegistered ? .secondary : .primary)

                HStack(spacing: 8) {
                    Text(item.feedTitle)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    if let date = item.publishedAt {
                        Text(date, style: .date)
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
            }

            Spacer()

            if item.isRegistered {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                    .font(.caption)
            }
        }
        .padding(.vertical, 4)
        .opacity(item.isRegistered ? 0.6 : 1.0)
    }
}

// MARK: - フィード追加シート

struct AddFeedSheet: View {
    let onAdd: (String, String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var url = ""
    @State private var title = ""

    var body: some View {
        VStack(spacing: 20) {
            Text("RSSフィードを追加")
                .font(.headline)

            Form {
                LabeledContent("フィードURL") {
                    TextField("https://example.com/feed.xml", text: $url)
                        .textFieldStyle(.roundedBorder)
                }
                LabeledContent("フィード名") {
                    TextField("Tech Blog", text: $title)
                        .textFieldStyle(.roundedBorder)
                }
            }
            .formStyle(.grouped)

            HStack {
                Button("キャンセル") { dismiss() }
                    .keyboardShortcut(.escape)

                Button("追加") {
                    onAdd(url, title.isEmpty ? url : title)
                    dismiss()
                }
                .keyboardShortcut(.return)
                .disabled(url.isEmpty)
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(24)
        .frame(width: 480, height: 280)
    }
}
