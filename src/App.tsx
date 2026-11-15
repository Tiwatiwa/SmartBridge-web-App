import { useState, useEffect, useCallback } from "react";
import { User, Order, OrderItem, Product, UserRewards } from "./types";
import { getSessionUser, clearSession, apiFetch } from "./utils/api";
import {
  getForcedOfflineMode,
  setForcedOfflineMode,
  getOfflineOrderQueue,
  removeQueuedOfflineOrder
} from "./utils/offline";
import Login from "./components/Login";
import { auth } from "./utils/firebase";
import Sidebar from "./components/Sidebar";
import Discovery from "./components/Discovery";
import GroupBuyingSection from "./components/GroupBuyingSection";
import LiveSellingSection from "./components/LiveSellingSection";
import ChatSection from "./components/ChatSection";
import FileUploadSection from "./components/FileUploadSection";
import ShoppingCart from "./components/ShoppingCart";
import CustomerDashboard from "./components/CustomerDashboard";
import TraderDashboard from "./components/TraderDashboard";
import UserProfileSection from "./components/UserProfileSection";
import ChaloBot from "./components/ChaloBot";

const REWARDS_CACHE_KEY = "sb_cached_rewards";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("discovery");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [preSelectedTraderId, setPreSelectedTraderId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<UserRewards | null>(() => {
    try {
      const raw = localStorage.getItem(REWARDS_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [browserOffline, setBrowserOffline] = useState(!navigator.onLine);
  const [forcedOffline, setForcedOffline] = useState(getForcedOfflineMode());
  const [queuedCount, setQueuedCount] = useState(getOfflineOrderQueue().length);
  const [syncing, setSyncing] = useState(false);

  const offlineMode = browserOffline || forcedOffline;

  const refreshRewards = useCallback(async () => {
    if (!user || offlineMode) return;
    try {
      const res = await apiFetch("/api/rewards");
      if (res.rewards) {
        setRewards(res.rewards);
        try {
          localStorage.setItem(REWARDS_CACHE_KEY, JSON.stringify(res.rewards));
        } catch {
          // ignore storage quota errors
        }
      }
    } catch {
      // keep existing cached rewards
    }
  }, [user, offlineMode]);

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (sessionUser) {
      setUser(sessionUser);
      setActiveTab(sessionUser.role === "trader" ? "shop" : "discovery");
    }

    const onOnline = () => setBrowserOffline(false);
    const onOffline = () => setBrowserOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (user && !offlineMode) {
      refreshRewards();
    }
  }, [user, offlineMode, refreshRewards]);

  const syncOfflineOrders = async () => {
    const queue = getOfflineOrderQueue();
    if (queue.length === 0 || offlineMode || !user) return;
    setSyncing(true);
    for (const q of queue) {
      try {
        await apiFetch("/api/orders", {
          method: "POST",
          body: JSON.stringify(q)
        });
        removeQueuedOfflineOrder(q.localId);
      } catch {
        // leave in queue for next retry
      }
    }
    setQueuedCount(getOfflineOrderQueue().length);
    setSyncing(false);
    await refreshRewards();
  };

  useEffect(() => {
    if (!offlineMode && user && queuedCount > 0) {
      syncOfflineOrders();
    }
  }, [offlineMode, user]);

  const handleToggleOffline = () => {
    const next = !forcedOffline;
    setForcedOffline(next);
    setForcedOfflineMode(next);
  };

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setActiveTab(authenticatedUser.role === "trader" ? "shop" : "discovery");
  };

  const handleSignOut = () => {
    auth.signOut().catch(() => {});
    clearSession();
    try {
      localStorage.removeItem(REWARDS_CACHE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
    setRewards(null);
    setCart([]);
    setPreSelectedTraderId(null);
    setActiveTab("discovery");
  };

  const handleAddToCart = (product: Product, overridePrice?: number) => {
    const effectivePrice = overridePrice !== undefined ? overridePrice : product.price;
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id && item.price === effectivePrice);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.price === effectivePrice
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      const newItem: OrderItem = {
        id: "item_" + Date.now(),
        productId: product.id,
        productName: product.name,
        traderId: product.userId,
        businessName: product.businessName,
        price: effectivePrice,
        quantity: 1,
        productImageUrl: product.imageUrl,
        listingType: product.listingType
      };
      return [...prev, newItem];
    });
  };

  const handleReorderOrder = (order: Order) => {
    setCart((prev) => {
      const updated = [...prev];
      for (const item of order.items) {
        const idx = updated.findIndex(
          (c) => c.productId === item.productId && c.price === item.price
        );
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + item.quantity
          };
        } else {
          updated.push({
            id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            productId: item.productId,
            productName: item.productName,
            traderId: item.traderId || order.traderId,
            businessName: item.businessName || order.businessName,
            price: item.price,
            quantity: item.quantity,
            productImageUrl: item.productImageUrl,
            listingType: item.listingType
          });
        }
      }
      return updated;
    });
  };

  const handleUpdateQuantity = (productId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      return prev.map((item) =>
        item.productId === productId ? { ...item, quantity: qty } : item
      );
    });
  };

  const handleOpenChatWithTrader = (traderId: string) => {
    setPreSelectedTraderId(traderId);
    setActiveTab("chats");
  };

  if (!user) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen flex bg-[#f4f5f7]" id="smartbridge_root_layout">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "chats") setPreSelectedTraderId(null);
        }}
        cartCount={cartCount}
        rewards={rewards}
        offlineMode={offlineMode}
        onToggleOffline={handleToggleOffline}
        queuedCount={queuedCount}
        onSyncOffline={syncOfflineOrders}
        syncing={syncing}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 overflow-y-auto min-h-screen pt-16 md:pt-0 p-6 md:p-8 bg-[#f4f5f7]" id="main_content_view">
        <div className="max-w-6xl mx-auto space-y-6" id="bento_content_canvas">
          {/* Clean Top Info Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4 text-xs text-zinc-500" id="view_header_info">
            <div>
              <span className="font-bold text-zinc-900">SmartBridge Market</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>{user.name} ({user.email})</span>
            </div>
            <div>
              <span>District Hub: <span className="font-semibold text-zinc-800">{user.location}</span></span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>{offlineMode ? "Offline Cached Mode" : "Live Connected"}</span>
            </div>
          </div>

          <div id="tab_contents_container">
            {activeTab === "discovery" && user.role === "customer" && (
              <Discovery
                customerLocation={user.location}
                onAddToCart={(p) => handleAddToCart(p)}
                onOpenChat={handleOpenChatWithTrader}
                offlineMode={offlineMode}
                cartTotal={cartTotal}
              />
            )}

            {activeTab === "groups" && user.role === "customer" && (
              <GroupBuyingSection
                currentUserId={user.id}
                offlineMode={offlineMode}
                onAddGroupDealToCart={(p, groupPrice) => {
                  handleAddToCart(p, groupPrice);
                  setActiveTab("cart");
                }}
              />
            )}

            {activeTab === "live" && (
              <LiveSellingSection
                currentUser={user}
                onAddToCart={(p) => handleAddToCart(p)}
              />
            )}

            {activeTab === "cart" && user.role === "customer" && (
              <ShoppingCart
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onClearCart={() => setCart([])}
                onOrderPlaced={() => {
                  refreshRewards();
                  setActiveTab("orders");
                }}
                customerLocation={user.location}
                offlineMode={offlineMode}
                onOfflineQueued={() => setQueuedCount(getOfflineOrderQueue().length)}
                onRewardsChanged={refreshRewards}
              />
            )}

            {activeTab === "orders" && user.role === "customer" && (
              <CustomerDashboard
                offlineMode={offlineMode}
                onAddNegotiatedToCart={(p) => {
                  handleAddToCart(p);
                  setActiveTab("cart");
                }}
                onReorderOrder={handleReorderOrder}
                onOpenCart={() => setActiveTab("cart")}
                onRewardsChanged={refreshRewards}
              />
            )}

            {activeTab === "profile" && (
              <UserProfileSection
                user={user}
                rewards={rewards}
                offlineMode={offlineMode}
                onRefreshRewards={refreshRewards}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === "chats" && (
              <ChatSection
                currentUser={user}
                preSelectedTraderId={preSelectedTraderId}
              />
            )}

            {activeTab === "files" && (
              <FileUploadSection />
            )}

            {(activeTab === "shop" || activeTab === "orders") && user.role === "trader" && (
              <TraderDashboard />
            )}
          </div>
        </div>
      </main>

      {user.role === "customer" && (
        <ChaloBot onAddToCart={(p) => handleAddToCart(p)} />
      )}
    </div>
  );
}
