import { useState, useEffect, FormEvent } from "react";
import { GroupBuy, Product } from "../types";
import { apiFetch } from "../utils/api";
import { resolveProductImage } from "../utils/productImages";
import { cacheGroupBuysOffline, getCachedGroupBuysOffline } from "../utils/offline";
import { Users, ShoppingCart, Plus, CheckCircle2, Clock, MapPin } from "lucide-react";

interface GroupBuyingSectionProps {
  currentUserId: string;
  offlineMode: boolean;
  onAddGroupDealToCart: (product: Product, groupPrice: number) => void;
}

export default function GroupBuyingSection({
  currentUserId,
  offlineMode,
  onAddGroupDealToCart
}: GroupBuyingSectionProps) {
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [targetBuyers, setTargetBuyers] = useState(4);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (offlineMode) {
        setGroupBuys(getCachedGroupBuysOffline());
        setLoading(false);
        return;
      }
      const [gbRes, prodRes] = await Promise.all([
        apiFetch("/api/group-buys"),
        apiFetch("/api/products")
      ]);
      const groups = gbRes.groupBuys || [];
      setGroupBuys(groups);
      cacheGroupBuysOffline(groups);
      const eligible = (prodRes.products || []).filter((p: Product) => p.listingType !== "rent");
      setProducts(eligible);
      if (eligible.length > 0 && !selectedProductId) {
        setSelectedProductId(eligible[0].id);
      }
    } catch {
      setGroupBuys(getCachedGroupBuysOffline());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [offlineMode]);

  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || offlineMode) return;
    try {
      const res = await apiFetch("/api/group-buys", {
        method: "POST",
        body: JSON.stringify({ productId: selectedProductId, targetBuyers })
      });
      if (res.groupBuy) {
        setGroupBuys(prev => [res.groupBuy, ...prev]);
        setShowCreate(false);
        setFeedback("Buying group created. Share with neighbors to unlock the bulk discount.");
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      setFeedback(err.message || "Could not create buying group.");
    }
  };

  const handleJoinGroup = async (group: GroupBuy) => {
    if (offlineMode) {
      setFeedback("Joining group buys requires an active connection.");
      return;
    }
    try {
      const res = await apiFetch(`/api/group-buys/${group.id}/join`, {
        method: "POST",
        body: JSON.stringify({ qty: 1 })
      });
      if (res.groupBuy) {
        setGroupBuys(prev => prev.map(g => (g.id === group.id ? res.groupBuy : g)));
        setFeedback(
          res.groupBuy.status === "Unlocked"
            ? `Target reached! Discounted price ZK ${res.groupBuy.groupPrice.toFixed(2)} unlocked (+25 Bridge Points).`
            : `Joined buying group! ${res.groupBuy.targetBuyers - res.groupBuy.currentBuyers} more buyer(s) needed (+25 Bridge Points).`
        );
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      setFeedback(err.message || "Could not join buying group.");
    }
  };

  const handleOrderAtGroupPrice = (group: GroupBuy) => {
    const matchedProd = products.find(p => p.id === group.productId) || {
      id: group.productId,
      userId: group.traderId,
      traderName: group.businessName,
      businessName: group.businessName,
      location: group.location,
      name: group.productName,
      price: group.groupPrice,
      description: "Community group-buy discounted order",
      category: "Group Deal",
      imageUrl: group.imageUrl
    };
    onAddGroupDealToCart(matchedProd, group.groupPrice);
    setFeedback(`Added "${group.productName}" to cart at group price ZK ${group.groupPrice.toFixed(2)}.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-6" id="community_group_buying_view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Community Group Buying</h2>
          <p className="text-sm text-zinc-600 mt-1">
            Combine orders with neighbors, students, or local farmers to unlock wholesale discounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          disabled={offlineMode}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Start Buying Group
        </button>
      </div>

      {feedback && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreateGroup} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Create a Community Buying Group</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-600"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Regular ZK {p.price.toFixed(2)} ({p.businessName})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Required Buyers</label>
              <input
                type="number"
                min={2}
                max={20}
                value={targetBuyers}
                onChange={(e) => setTargetBuyers(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm font-mono tabular-nums outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"
            >
              Launch Group Deal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-12 text-center text-zinc-500 text-sm">Loading active buying groups...</div>
      ) : groupBuys.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-2">
          <Users className="w-10 h-10 text-zinc-300 mx-auto" />
          <p className="text-base font-semibold text-zinc-700">No active buying groups yet</p>
          <p className="text-sm text-zinc-500">Start a group above to pool orders with neighbors for bulk savings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupBuys.map((group) => {
            const pct = Math.min(100, Math.round((group.currentBuyers / group.targetBuyers) * 100));
            const spotsLeft = Math.max(0, group.targetBuyers - group.currentBuyers);
            const hasJoined = group.participants.some(p => p.userId === currentUserId);
            const isUnlocked = group.status === "Unlocked" || spotsLeft === 0;
            const savings = group.regularPrice - group.groupPrice;

            return (
              <div
                key={group.id}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-zinc-100 relative overflow-hidden">
                    <img
                      src={resolveProductImage(group.imageUrl, group.productName)}
                      alt={group.productName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{group.location}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-zinc-700">{group.businessName}</span>
                      </div>
                      <h3 className="text-base font-bold text-zinc-900">{group.productName}</h3>
                    </div>

                    <div className="flex items-baseline justify-between border-y border-zinc-100 py-3">
                      <div>
                        <span className="text-xs text-zinc-500 block">Group Price</span>
                        <span className="text-xl font-bold text-blue-700 font-mono tabular-nums">
                          ZK {group.groupPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-zinc-400 line-through font-mono tabular-nums block">
                          ZK {group.regularPrice.toFixed(2)}
                        </span>
                        <span className="text-xs font-semibold text-blue-700 tabular-nums">
                          Save ZK {savings.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-700 tabular-nums">
                          {group.currentBuyers} / {group.targetBuyers} buyers joined
                        </span>
                        <span className={`font-semibold ${isUnlocked ? "text-blue-700" : "text-amber-700"}`}>
                          {isUnlocked ? "Discount Unlocked" : `${spotsLeft} spot${spotsLeft > 1 ? "s" : ""} left`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${isUnlocked ? "bg-blue-600" : "bg-amber-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                        <span>Members: {group.participants.map(p => p.userName).join(", ")}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(group.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 flex gap-2.5">
                  {!hasJoined && !isUnlocked && (
                    <button
                      type="button"
                      onClick={() => handleJoinGroup(group)}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
                    >
                      Join Group (+25 pts)
                    </button>
                  )}
                  {(hasJoined || isUnlocked) && (
                    <button
                      type="button"
                      onClick={() => handleOrderAtGroupPrice(group)}
                      className="flex-1 py-2.5 bg-[#1e2127] hover:bg-[#2a2e37] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {isUnlocked ? `Order at ZK ${group.groupPrice.toFixed(0)}` : "Reserve Group Spot"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
