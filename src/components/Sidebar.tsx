import { useState } from "react";
import { User, UserRewards } from "../types";
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  MessageSquare,
  FolderClosed,
  LogOut,
  Store,
  ClipboardList,
  MapPin,
  Users,
  Video,
  Wifi,
  WifiOff,
  RefreshCw,
  Menu,
  X,
  Award,
  UserCheck,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  rewards: UserRewards | null;
  offlineMode: boolean;
  onToggleOffline: () => void;
  queuedCount: number;
  onSyncOffline: () => void;
  syncing: boolean;
  onSignOut: () => void;
}

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  cartCount,
  rewards,
  offlineMode,
  onToggleOffline,
  queuedCount,
  onSyncOffline,
  syncing,
  onSignOut
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isTrader = user.role === "trader";

  const currentPoints = rewards?.points ?? 120;
  const redeemableZk = rewards?.redeemableDiscountZk ?? Math.floor(currentPoints / 10);
  const rewardTier = rewards?.tier ?? "Seedling";

  const menuItems = isTrader
    ? [
        { id: "shop", label: "My Shop & AI", icon: Store },
        { id: "live", label: "Live Selling", icon: Video },
        { id: "orders", label: "Store Orders", icon: ClipboardList },
        { id: "chats", label: "Customer Chats", icon: MessageSquare },
        { id: "files", label: "Uploaded Files", icon: FolderClosed },
        { id: "profile", label: "My Profile & Points", icon: UserCheck },
      ]
    : [
        { id: "discovery", label: "Marketplace", icon: Search },
        { id: "groups", label: "Group Buying", icon: Users },
        { id: "live", label: "Live Market", icon: Video },
        { id: "cart", label: "Shopping Cart", icon: ShoppingCart, badge: cartCount },
        { id: "orders", label: "Orders & Tracking", icon: ClipboardList },
        { id: "profile", label: "Profile & Rewards", icon: UserCheck, badgeText: `${currentPoints} pts` },
        { id: "chats", label: "Trader Chat", icon: MessageSquare },
        { id: "files", label: "Files", icon: FolderClosed },
      ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top toggle bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#1e2127] text-white px-4 py-3 flex items-center justify-between border-b border-[#2e333d]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight whitespace-nowrap">SmartBridge Market</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-zinc-300 hover:bg-[#2a2e36]"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-72 bg-[#1e2127] border-r border-[#2e333d] text-zinc-300 flex flex-col justify-between h-screen transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        id="app_sidebar"
      >
        <div className="overflow-y-auto flex-1">
          {/* Brand */}
          <div className="p-5 border-b border-[#2e333d] flex items-center gap-3" id="sidebar_header_brand">
            <div className="p-2 bg-blue-600 rounded-xl shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-lg font-bold tracking-tight text-white block truncate">SmartBridge Market</span>
              <span className="text-[11px] text-zinc-400 block truncate">Intelligent Local Commerce</span>
            </div>
          </div>

          {/* User Profile & Visual Rewards Badge */}
          <div className="p-5 border-b border-[#2e333d] bg-[#16181d] space-y-3" id="sidebar_user_profile_box">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2a2e36] border border-[#3a404c] flex items-center justify-center text-sm font-bold text-white uppercase shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-zinc-400 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{user.location} Hub · {isTrader ? "Seller" : "Buyer"}</span>
                </div>
              </div>
            </div>

            {/* Visual Reward Points & Discount Badge */}
            <button
              type="button"
              onClick={() => handleNavClick("profile")}
              id="sidebar_rewards_badge"
              className={`w-full text-left p-3 rounded-xl border transition group ${
                activeTab === "profile"
                  ? "bg-blue-950/60 border-blue-500/70"
                  : "bg-[#242830] hover:bg-[#2b303a] border-[#353a46]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-zinc-400 block truncate">{rewardTier} Rewards</span>
                    <span className="text-sm font-bold text-white font-mono tabular-nums block">
                      {currentPoints} pts
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600/20 border border-blue-400/35 text-blue-300 font-mono text-[11px] font-bold tabular-nums">
                    ZK {redeemableZk} off
                  </span>
                  <span className="text-[10px] text-zinc-400 flex items-center justify-end gap-0.5 mt-1 group-hover:text-blue-300 transition">
                    Tracker <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3.5 space-y-1" id="sidebar_menu_navigation">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition text-sm font-medium outline-none ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-zinc-300 hover:bg-[#2a2e37] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-white text-zinc-900 rounded-md text-xs font-mono font-bold tabular-nums shrink-0">
                      {item.badge}
                    </span>
                  )}
                  {"badgeText" in item && item.badgeText && (
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums shrink-0 ${
                      isActive ? "bg-blue-700 text-white" : "bg-[#2a2e37] text-blue-400"
                    }`}>
                      {item.badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Offline Connectivity & Sign Out Footer */}
        <div className="p-3.5 border-t border-[#2e333d] space-y-2.5" id="sidebar_footer_logout">
          <div className="p-3 rounded-xl bg-[#242830] border border-[#353a46] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                {offlineMode ? (
                  <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Wifi className="w-4 h-4 text-blue-400 shrink-0" />
                )}
                <span>{offlineMode ? "Offline Mode" : "Online Sync"}</span>
              </div>
              <button
                type="button"
                onClick={onToggleOffline}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#323743] hover:bg-[#3e4452] text-zinc-100 transition whitespace-nowrap"
              >
                {offlineMode ? "Go Online" : "Test Offline"}
              </button>
            </div>
            {queuedCount > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-[#353a46]">
                <span className="text-[11px] text-amber-300 tabular-nums">
                  {queuedCount} queued order{queuedCount > 1 ? "s" : ""}
                </span>
                {!offlineMode && (
                  <button
                    type="button"
                    onClick={onSyncOffline}
                    disabled={syncing}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing" : "Sync Now"}
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition outline-none"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
