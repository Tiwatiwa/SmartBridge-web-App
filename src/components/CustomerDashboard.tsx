import { useState, useEffect } from "react";
import { Order, NegotiationOffer, UserRewards, Product } from "../types";
import { apiFetch } from "../utils/api";
import { getOfflineOrderQueue, OfflineQueuedOrder } from "../utils/offline";
import PastOrdersHistory from "./PastOrdersHistory";
import {
  Clock,
  Truck,
  CheckCircle,
  Sparkles,
  Award,
  Scale,
  ShoppingCart,
  WifiOff,
  KeyRound,
  Copy,
  Check
} from "lucide-react";

interface CustomerDashboardProps {
  offlineMode: boolean;
  onAddNegotiatedToCart: (product: Product) => void;
  onReorderOrder: (order: Order) => void;
  onOpenCart?: () => void;
  onRewardsChanged?: () => void;
}

export default function CustomerDashboard({
  offlineMode,
  onAddNegotiatedToCart,
  onReorderOrder,
  onOpenCart,
  onRewardsChanged
}: CustomerDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [negotiations, setNegotiations] = useState<NegotiationOffer[]>([]);
  const [rewards, setRewards] = useState<UserRewards>({ points: 120, tier: "Seedling", completedChallenges: [], redeemedPoints: 0 });
  const [challenges, setChallenges] = useState<any[]>([]);
  const [queuedOrders, setQueuedOrders] = useState<OfflineQueuedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchAll = async () => {
    setQueuedOrders(getOfflineOrderQueue());
    if (offlineMode) return;
    setLoading(true);
    try {
      const [ordRes, negRes, rewRes] = await Promise.all([
        apiFetch("/api/orders"),
        apiFetch("/api/negotiations"),
        apiFetch("/api/rewards")
      ]);
      const sorted = (ordRes.orders || []).sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
      setNegotiations(negRes.negotiations || []);
      if (rewRes.rewards) setRewards(rewRes.rewards);
      if (rewRes.challenges) setChallenges(rewRes.challenges);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [offlineMode]);

  const getStatusStep = (status: Order["status"]) => {
    switch (status) {
      case "Pending": return 1;
      case "Preparing": return 2;
      case "Out for Delivery": return 3;
      case "Delivered": return 4;
      default: return 1;
    }
  };

  const STAGES = [
    { title: "Pending", desc: "Order placed", icon: Clock },
    { title: "Preparing", desc: "Seller packing", icon: Sparkles },
    { title: "Out for Delivery", desc: "Rider en route", icon: Truck },
    { title: "Delivered", desc: "PIN verified", icon: CheckCircle }
  ];

  const handleAcceptCounter = async (neg: NegotiationOffer) => {
    try {
      const res = await apiFetch(`/api/negotiations/${neg.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "accept" })
      });
      if (res.negotiation) {
        setNegotiations(prev => prev.map(n => (n.id === neg.id ? res.negotiation : n)));
        setNotice(`Accepted ZK ${res.negotiation.offerPrice} for ${neg.productName}.`);
      }
    } catch {
      // ignore
    }
  };

  const handleClaimChallenge = async (challenge: any) => {
    try {
      const res = await apiFetch("/api/rewards/claim", {
        method: "POST",
        body: JSON.stringify({ challengeId: challenge.id, points: challenge.points })
      });
      if (res.rewards) {
        setRewards(res.rewards);
        setChallenges(prev => prev.map(c => (c.id === challenge.id ? { ...c, claimed: true } : c)));
        setNotice(`Claimed +${challenge.points} Bridge Points!`);
        onRewardsChanged?.();
      }
    } catch {
      // ignore
    }
  };

  const handleCopyShare = (order: Order) => {
    navigator.clipboard?.writeText(`Supported ${order.businessName} on SmartBridge Market (ZK ${order.totalAmount.toFixed(2)}).`);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReorder = (order: Order) => {
    onReorderOrder(order);
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    setNotice(
      `Added ${totalItems} ${totalItems === 1 ? "item" : "items"} from order ${order.id} (${order.businessName}) back to your cart.`
    );
  };

  return (
    <div className="space-y-8 pb-12" id="customer_dashboard_view">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Orders, Negotiations & Bridge Rewards</h2>
        <p className="text-sm text-zinc-600 mt-1">
          Track live rider deliveries with your 4-digit PIN, manage price offers, and redeem Bridge Points.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium flex items-center justify-between gap-3">
          <span>{notice}</span>
          <div className="flex items-center gap-3 shrink-0">
            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Open Cart
              </button>
            )}
            <button type="button" onClick={() => setNotice(null)} className="font-bold text-blue-700">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Shopping Rewards & Challenges */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">SmartBridge Rewards & Challenges</h3>
              <p className="text-xs text-zinc-500">
                Tier: {rewards.tier} · Redeem 10 pts = ZK 1 discount at checkout
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">{rewards.points} pts</span>
            <span className="text-xs text-zinc-500 block tabular-nums">
              Worth ZK {Math.floor(rewards.points / 10)} in discounts
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {challenges.map(ch => {
            const ready = ch.progress >= ch.target && !ch.claimed;
            return (
              <div key={ch.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900">{ch.title}</span>
                    <span className="font-mono font-bold text-blue-700 tabular-nums">+{ch.points} pts</span>
                  </div>
                  <p className="text-xs text-zinc-600">{ch.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/70 text-xs">
                  <span className="font-mono text-zinc-500 tabular-nums">
                    Progress: {ch.progress}/{ch.target}
                  </span>
                  {ch.claimed ? (
                    <span className="text-blue-700 font-semibold">Claimed</span>
                  ) : ready ? (
                    <button
                      type="button"
                      onClick={() => handleClaimChallenge(ch)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                    >
                      Claim Points
                    </button>
                  ) : (
                    <span className="text-zinc-400">In Progress</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline Queued Orders */}
      {queuedOrders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <WifiOff className="w-4 h-4" />
            <span>Offline Queued Orders ({queuedOrders.length})</span>
          </div>
          <div className="space-y-2">
            {queuedOrders.map(q => (
              <div key={q.localId} className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-zinc-900">{q.items.map(i => `${i.productName} x${i.quantity}`).join(", ")}</p>
                  <p className="text-zinc-500">{q.customerLocation} · {q.paymentMethod}</p>
                </div>
                <span className="font-mono font-bold text-amber-800 tabular-nums">ZK {q.totalAmount.toFixed(2)} (Waiting Sync)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Price Negotiations */}
      {negotiations.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-zinc-900">My Price Negotiations ({negotiations.length})</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {negotiations.map(neg => (
              <div key={neg.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-zinc-900">{neg.productName}</p>
                  <p className="text-zinc-500">
                    {neg.businessName} · Listed ZK {neg.listedPrice} · Your Offer ZK {neg.offerPrice}
                    {neg.counterPrice ? ` · Counter ZK ${neg.counterPrice}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`font-semibold ${
                    neg.status === "Accepted" ? "text-blue-700" :
                    neg.status === "Countered" ? "text-amber-700" :
                    neg.status === "Declined" ? "text-rose-600" : "text-zinc-600"
                  }`}>
                    {neg.status}
                  </span>
                  {neg.status === "Countered" && (
                    <button
                      type="button"
                      onClick={() => handleAcceptCounter(neg)}
                      className="px-3 py-1.5 bg-[#1e2127] hover:bg-[#2a2e37] text-white rounded-lg font-semibold"
                    >
                      Accept ZK {neg.counterPrice}
                    </button>
                  )}
                  {neg.status === "Accepted" && (
                    <button
                      type="button"
                      onClick={() => onAddNegotiatedToCart({
                        id: neg.productId,
                        userId: neg.traderId,
                        traderName: neg.businessName,
                        businessName: neg.businessName,
                        location: "Lusaka",
                        name: neg.productName,
                        price: neg.offerPrice,
                        description: "Negotiated offer price",
                        category: "Negotiated"
                      })}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Buy at ZK {neg.offerPrice}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Delivery Tracking */}
      {!loading && orders.some(o => o.status !== "Delivered") && (
        <div className="space-y-4" id="orders_list_wrapper">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900">Active Delivery Tracking</h3>
            <span className="text-xs text-zinc-500">Live rider status & 4-digit delivery PIN</span>
          </div>
          {orders.filter(o => o.status !== "Delivered").map(order => {
            const currentStep = getStatusStep(order.status);
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden" id={`customer_order_${order.id}`}>
                <div className="p-5 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
                      <span className="font-mono font-bold text-zinc-700">{order.id}</span>
                      <span>·</span>
                      <span className="font-semibold text-zinc-900">{order.businessName}</span>
                      <span>·</span>
                      <span>ETA {order.predictedDeliveryMins || 22} mins</span>
                      {order.riderName && (
                        <>
                          <span>·</span>
                          <span>{order.riderName} ({order.riderVehicle})</span>
                        </>
                      )}
                    </div>
                    <p className="text-lg font-bold text-zinc-900 font-mono tabular-nums">
                      Total: ZK {order.totalAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {order.deliveryPin && (
                      <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-1.5 text-xs">
                        <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                        <span className="text-blue-800 font-semibold">PIN:</span>
                        <span className="font-mono font-extrabold text-blue-950 tabular-nums">{order.deliveryPin}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyShare(order)}
                      className="px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl text-xs font-semibold text-zinc-700 flex items-center gap-1.5"
                    >
                      {copiedId === order.id ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === order.id ? "Copied" : "Share"}
                    </button>
                    <span className="px-3 py-1.5 bg-[#1e2127] text-white font-mono text-xs font-semibold rounded-lg">
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {STAGES.map((stg, index) => {
                      const stepNum = index + 1;
                      const isComplete = currentStep >= stepNum;
                      const StageIcon = stg.icon;
                      return (
                        <div key={stg.title} className="flex md:flex-col items-center gap-3 md:gap-2 md:text-center flex-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                            isComplete ? "bg-blue-600 border-blue-200 text-white" : "bg-white border-zinc-200 text-zinc-400"
                          }`}>
                            <StageIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${isComplete ? "text-zinc-900" : "text-zinc-400"}`}>{stg.title}</p>
                            <p className="text-[11px] text-zinc-500">{stg.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-zinc-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-800 truncate">{item.productName}</span>
                        <span className="font-mono text-zinc-500 tabular-nums shrink-0">Qty {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Past Orders History & Reorder Sub-Component */}
      <PastOrdersHistory
        orders={orders}
        loading={loading}
        onReorder={handleReorder}
        onOpenCart={onOpenCart}
      />
    </div>
  );
}
