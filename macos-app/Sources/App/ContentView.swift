/**
 * メインコンテンツビュー
 * NavigationSplitView でサイドバーとコンテンツ領域を構成する
 */
import SwiftUI

enum SidebarItem: String, CaseIterable, Identifiable {
    case unread = "未読"
    case favorites = "お気に入り"
    case recent = "最近読んだ"
    case rss = "RSSフィード"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .unread: return "tray.fill"
        case .favorites: return "star.fill"
        case .recent: return "clock.fill"
        case .rss: return "dot.radiowaves.left.and.right"
        }
    }
}

struct ContentView: View {
    @State private var selectedItem: SidebarItem? = .unread

    var body: some View {
        NavigationSplitView {
            List(SidebarItem.allCases, selection: $selectedItem) { item in
                Label(item.rawValue, systemImage: item.icon)
                    .tag(item)
            }
            .listStyle(.sidebar)
            .navigationTitle("yomimono")
        } detail: {
            switch selectedItem {
            case .unread, .none:
                UnreadBookmarksView()
            case .favorites:
                FavoritesView()
            case .recent:
                RecentView()
            case .rss:
                RSSFeedListView()
            }
        }
        .frame(minWidth: 900, minHeight: 600)
    }
}
