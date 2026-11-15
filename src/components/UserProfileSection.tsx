import { useState, useEffect } from "react";
import { User, UserRewards, Order } from "../types";
import { apiFetch } from "../utils/api";
import {
  Award,
  MapPin,
  Mail,
  Calculator,
  Receipt,
  Ticket,
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  RefreshCw
} from "lucide-react";

interface UserProfileSectionProps {
  user: User;
  rewards: UserRewards | null;
  offlineMode: boolean;
  onRefreshRewards: () => Promise<void> | void;
  onNavigate: (tab: string) => void;
}

export default function UserProfileSection({
  user,
  rewards,
  offlineMode,
  onRefreshRewards,
  onNavigate
}: UserProfileSectionProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [simTotal, setSimTotal] = useState<string>("650");
  const [notice, setNotice] = useState<string | null>(null);

  const loadProfileData = async () => {
    if (offlineMode) return;
    setLoading(true);
    try {
      const [ordRes, rewRes] = await Promise.all([
        apiFetch("/api/orders"),
        apiFetch("/api/rewards")
      ]);
      const sortedOrders = (ordRes.orders || []).sort(
        (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sortedOrders);
      if (rewRes.challenges) setChallenges(rewRes.challenges);
      await onRefreshRewards();
    } catch {
      // keep cached rewards state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [offlineMode, user.id]);

  const activeRewards: UserRewards = rewards || {
    points: 120,
    tier: "Seedling",
    completedChallenges: [],
    redeemedPoints: 0
  };

  const points = activeRewards.points || 0;
  const redeemableDiscountZk = activeRewards.redeemableDiscountZk ?? Math.floor(points / 10);
  const canRedeemAtCheckout = points >= 50;

  // Client-side fallback calculation aligned identically with backend formula
  const computedOrderBreakdown =
    activeRewards.orderBreakdown && activeRewards.orderBreakdown.length > 0
      ? activeRewards.orderBreakdown
      : orders.map((o) => {
          const basePts =
            typeof o.pointsEarned === "number"
              ? o.pointsEarned
              : Math.max(10, Math.round(Number(o.totalAmount || 0) / 25));
          const pinBonusAwarded = o.status === "Delivered";
          return {
            orderId: o.id,
            businessName: o.businessName || "SmartBridge Local Shop",
            createdAt: o.createdAt,
            totalAmount: Number(o.totalAmount || 0),
            pointsEarned: basePts + (pinBonusAwarded ? 15 : 0),
            pinBonusAwarded,
            discountApplied: Number(o.discountApplied || 0),
            status: o.status
          };
        });

  const orderPointsTotal =
    activeRewards.orderPointsTotal ??
    computedOrderBreakdown.reduce((acc, item) => acc + item.pointsEarned, 0);
  const totalOrderSpend =
    activeRewards.totalOrderSpend ??
    computedOrderBreakdown.reduce((acc, item) => acc + item.totalAmount, 0);

  const tierMin = activeRewards.tier === "Bridge Champion" ? 600 : activeRewards.tier === "Connector" ? 250 : 0;
  const tierMax = activeRewards.tier === "Bridge Champion" ? 600 : activeRewards.tier === "Connector" ? 600 : 250;
  const tierProgressPct =
    activeRewards.tier === "Bridge Champion"
      ? 100
      : Math.min(100, Math.max(4, Math.round(((points - tierMin) / (tierMax - tierMin)) * 100)));

  const parsedSimAmount = Math.max(0, Number(simTotal) || 0);
  const simBasePoints = parsedSimAmount > 0 ? Math.max(10, Math.round(parsedSimAmount / 25)) : 0;
  const simPinBonus = parsedSimAmount > 0 ? 15 : 0;
  const simTotalPoints = simBasePoints + simPinBonus;
  const simDiscountValue = simTotalPoints / 10;

  const discountTiers = [
    { pts: 50, zk: 5, label: "Starter Voucher" },
    { pts: 100, zk: 10, label: "Neighborhood Saver" },
    { pts: 250, zk: 25, label: "Connector Discount" },
    { pts: 500, zk: 50, label: "Bulk Market Rebate" }
  ];

  const handleClaimChallenge = async (challenge: any) => {
    if (offlineMode) return;
    try {
      const res = await apiFetch("/api/rewards/claim", {
        method: "POST",
        body: JSON.stringify({ challengeId: challenge.id, points: challenge.points })
      });
      if (res.rewards) {
        setChallenges((prev) => prev.map((c) => (c.id === challenge.id ? { ...c, claimed: true } : c)));
        await onRefreshRewards();
        setNotice(`Added +${challenge.points} Bridge Points to your balance.`);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 pb-12" id="user_profile_rewards_view">
      {/* Page Title & Sync Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">User Profile & Reward Points Tracker</h2>
          <p className="text-sm text-zinc-600 mt-1">
            Track Bridge Points calculated from your order totals and unlock instant Kwacha discounts at checkout.
          </p>
        </div>
        {!offlineMode && (
          <button
            type="button"
            onClick={loadProfileData}
            disabled={loading}
            className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-semibold text-zinc-700 flex items-center gap-2 self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh Points"}
          </button>
        )}
      </div>

      {notice && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-bold text-blue-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Profile Header + Tier Progress */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5" id="profile_identity_card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1e2127] text-white flex items-center justify-center text-xl font-bold uppercase shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-zinc-900">{user.name}</h3>
                <span className="text-xs text-zinc-400">·</span>
                <span className="text-xs font-semibold text-blue-700">{activeRewards.tier} Member</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  {user.email}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {user.location} Hub
                </span>
                <span>·</span>
                <span>{user.role === "trader" ? user.businessName || "Local Trader" : "Verified Buyer"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === "customer" && (
              <button
                type="button"
                onClick={() => onNavigate("cart")}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition"
              >
                <ShoppingCart className="w-4 h-4" />
                Redeem in Cart
              </button>
            )}
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="pt-4 border-t border-zinc-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-700">
              Tier Status: {activeRewards.tier}
            </span>
            <span className="text-zinc-500 font-mono tabular-nums">
              {activeRewards.tier === "Bridge Champion"
                ? "Maximum tier reached (600+ pts)"
                : `${activeRewards.pointsToNextTier ?? Math.max(0, tierMax - points)} pts to ${
                    activeRewards.nextTier || (points < 250 ? "Connector" : "Bridge Champion")
                  }`}
            </span>
          </div>
          <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${tierProgressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400 font-mono tabular-nums">
            <span>0 pts · Seedling</span>
            <span>250 pts · Connector</span>
            <span>600 pts · Bridge Champion</span>
          </div>
        </div>
      </div>

      {/* 3-Column Reward Balance & Discount Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="reward_kpi_strip">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Current Points Balance</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 font-mono tabular-nums">{points} pts</p>
          <p className="text-xs text-zinc-500 font-mono tabular-nums">
            {activeRewards.redeemedPoints} pts redeemed lifetime
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Redeemable Discount Value</span>
            <Ticket className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-blue-700 font-mono tabular-nums">
            ZK {redeemableDiscountZk.toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500">
            {canRedeemAtCheckout
              ? "Ready to apply at checkout (10 pts = ZK 1)"
              : `Earn ${50 - points} more pts to unlock ZK 5 checkout redemption`}
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Order-Earned Points</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 font-mono tabular-nums">+{orderPointsTotal} pts</p>
          <p className="text-xs text-zinc-500 font-mono tabular-nums">
            Across {computedOrderBreakdown.length} order{computedOrderBreakdown.length === 1 ? "" : "s"} · ZK{" "}
            {totalOrderSpend.toFixed(2)} spent
          </p>
        </div>
      </div>

      {/* Interactive Calculator & Redeemable Discount Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Points Calculator */}
        <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
            <Calculator className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-zinc-900">Order Points Calculator</h3>
              <p className="text-xs text-zinc-500">
                Earn 1 pt per ZK 25 spent (min 10 pts/order) + 15 pts on PIN delivery confirmation
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-700 block">
              Estimate Points from Order Total (ZK)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={25}
                value={simTotal}
                onChange={(e) => setSimTotal(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-zinc-200 rounded-xl font-mono text-sm font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-blue-600"
              />
              {[250, 650, 1500, 3000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSimTotal(String(preset))}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold border transition ${
                    Number(simTotal) === preset
                      ? "border-blue-600 bg-blue-50 text-blue-800"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  K{preset}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Order Total Points (max(10, round(ZK {parsedSimAmount} / 25)))</span>
              <span className="font-mono font-bold text-zinc-900 tabular-nums">+{simBasePoints} pts</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>4-Digit PIN Delivery Verification Bonus</span>
              <span className="font-mono font-bold text-zinc-900 tabular-nums">+{simPinBonus} pts</span>
            </div>
            <div className="border-t border-zinc-200 pt-2 flex justify-between items-center">
              <span className="font-bold text-zinc-900">Estimated Total Earned</span>
              <span className="font-mono text-sm font-extrabold text-blue-700 tabular-nums">
                +{simTotalPoints} pts (ZK {simDiscountValue.toFixed(2)} value)
              </span>
            </div>
          </div>
        </div>

        {/* Redeemable Discount Tiers */}
        <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Ticket className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-zinc-900">Redeemable Checkout Discounts</h3>
                <p className="text-xs text-zinc-500">10 Bridge Points = ZK 1.00 instant savings</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {discountTiers.map((tier) => {
              const unlocked = points >= tier.pts;
              return (
                <div
                  key={tier.pts}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                    unlocked ? "border-blue-200 bg-blue-50/50" : "border-zinc-200 bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">{tier.label}</span>
                    <span className="font-mono text-xs font-bold text-blue-700 tabular-nums">ZK {tier.zk} off</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-zinc-500 tabular-nums">{tier.pts} pts required</span>
                    {unlocked ? (
                      <span className="font-semibold text-blue-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-mono tabular-nums">
                        {tier.pts - points} pts left
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {user.role === "customer" && (
            <button
              type="button"
              onClick={() => onNavigate("discovery")}
              className="w-full py-2.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-semibold text-zinc-700 flex items-center justify-center gap-1.5 transition"
            >
              Browse Marketplace to Earn & Redeem
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Order-by-Order Points Ledger */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden" id="order_points_ledger">
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Points Earned by Order</h3>
            <p className="text-xs text-zinc-500">
              Itemized calculation of points earned from each order total and delivery verification
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-blue-700 tabular-nums">
            +{orderPointsTotal} pts total
          </span>
        </div>

        {computedOrderBreakdown.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Receipt className="w-9 h-9 mx-auto text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-700">No orders recorded yet</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {user.role === "trader"
                ? "Trader accounts track customer sales on My Shop & AI, while personal purchases placed as a buyer appear here."
                : "Place your first order in the Marketplace to automatically earn 1 pt per ZK 25 spent (minimum 10 pts) plus 15 bonus pts on Delivery PIN confirmation."}
            </p>
            {user.role === "customer" && (
              <button
                type="button"
                onClick={() => onNavigate("discovery")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Explore Products
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {computedOrderBreakdown.map((entry) => (
              <div
                  key={entry.orderId}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-zinc-800">{entry.orderId}</span>
                      <span className="text-zinc-400">·</span>
                      <span className="font-semibold text-zinc-900">{entry.businessName}</span>
                      <span className="text-zinc-400">·</span>
                      <span className="text-zinc-500">{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-zinc-500 font-mono tabular-nums">
                      Order Total ZK {entry.totalAmount.toFixed(2)} → +{entry.pinBonusAwarded ? entry.pointsEarned - 15 : entry.pointsEarned} base pts
                      {entry.pinBonusAwarded ? " + 15 PIN bonus" : ` (${entry.status} · +15 pts on PIN confirmation)`}
                      {entry.discountApplied > 0 ? ` · Discount applied: -ZK ${entry.discountApplied}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {entry.pinBonusAwarded && (
                      <span className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" />
                        PIN Verified
                      </span>
                    )}
                    <span className="font-mono text-sm font-extrabold text-blue-700 tabular-nums">
                      +{entry.pointsEarned} pts
                    </span>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Bonus Point Challenges</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map((ch) => {
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
      )}
    </div>
  );
}
