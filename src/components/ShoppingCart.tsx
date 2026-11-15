import React, { useState, useEffect } from "react";
import { OrderItem, DeliveryRider, UserRewards } from "../types";
import { apiFetch } from "../utils/api";
import { resolveProductImage } from "../utils/productImages";
import { queueOfflineOrder, getBudgetSettings } from "../utils/offline";
import {
  ShoppingCart as CartIcon,
  Trash2,
  MapPin,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Ticket,
  Smartphone,
  Wallet,
  Truck,
  Award,
  WifiOff,
  AlertTriangle
} from "lucide-react";

interface ShoppingCartProps {
  cart: OrderItem[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onClearCart: () => void;
  onOrderPlaced: () => void;
  customerLocation: string;
  offlineMode: boolean;
  onOfflineQueued: () => void;
  onRewardsChanged?: () => void;
}

export default function ShoppingCart({
  cart,
  onUpdateQuantity,
  onClearCart,
  onOrderPlaced,
  customerLocation,
  offlineMode,
  onOfflineQueued,
  onRewardsChanged
}: ShoppingCartProps) {
  const [paymentMethod, setPaymentMethod] = useState<"MTN MoMo" | "Airtel Money" | "Card" | "Cash on Delivery">("MTN MoMo");
  const [fulfillmentMode, setFulfillmentMode] = useState<"delivery" | "pickup">("delivery");
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");
  const [consolidatedAvailable, setConsolidatedAvailable] = useState(false);

  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(false);

  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [queuedNotice, setQueuedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [momoName, setMomoName] = useState("");
  const [ussdPin, setUssdPin] = useState("");
  const [showUssdPrompt, setShowUssdPrompt] = useState(false);

  useEffect(() => {
    if (offlineMode) return;
    Promise.all([
      apiFetch(`/api/delivery/match?location=${encodeURIComponent(customerLocation)}`),
      apiFetch("/api/rewards")
    ])
      .then(([delRes, rewRes]) => {
        const matched: DeliveryRider[] = delRes.riders || [];
        setRiders(matched);
        if (matched.length > 0 && !selectedRiderId) setSelectedRiderId(matched[0].id);
        setConsolidatedAvailable(!!delRes.consolidationAvailable);
        if (rewRes.rewards) setRewards(rewRes.rewards);
      })
      .catch(() => {});
  }, [customerLocation, offlineMode]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const selectedRider = riders.find(r => r.id === selectedRiderId) || riders[0];
  const deliveryFee = fulfillmentMode === "pickup"
    ? 0
    : Math.max(10, (selectedRider?.baseFee || 25) - (consolidatedAvailable ? (selectedRider?.consolidatedDiscount || 10) : 0));

  const redeemablePts = rewards && rewards.points >= 50 ? Math.min(rewards.points, Math.floor(subtotal * 5)) : 0;
  const pointsDiscount = redeemPoints ? Math.floor(redeemablePts / 10) : 0;
  const finalTotal = Math.max(1, subtotal + deliveryFee - pointsDiscount);
  const budget = getBudgetSettings();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!privacyConsent) {
      setError("Please check the privacy consent box to authorize order routing.");
      return;
    }

    // Handle Offline Queuing seamlessly
    if (offlineMode) {
      queueOfflineOrder({
        localId: "offline_" + Date.now(),
        traderId: cart[0].traderId,
        businessName: cart[0].businessName || "Local SmartBridge Seller",
        items: cart,
        totalAmount: subtotal,
        paymentMethod,
        privacyConsent,
        customerLocation,
        fulfillmentMode,
        riderId: selectedRiderId,
        createdAt: new Date().toISOString()
      });
      onClearCart();
      onOfflineQueued();
      setQueuedNotice(true);
      return;
    }

    if (paymentMethod === "Card" && (!cardNumber || !cardHolder || !cardExpiry || !cardCvv)) {
      setError("Please enter all card details.");
      return;
    }
    if ((paymentMethod === "MTN MoMo" || paymentMethod === "Airtel Money") && (!momoNumber || !momoName)) {
      setError("Please enter your Mobile Money number and registered name.");
      return;
    }
    if ((paymentMethod === "MTN MoMo" || paymentMethod === "Airtel Money") && !showUssdPrompt) {
      setError(null);
      setShowUssdPrompt(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          traderId: cart[0].traderId,
          businessName: cart[0].businessName || "SmartBridge Local Shop",
          items: cart,
          totalAmount: subtotal,
          paymentMethod: `${paymentMethod}`,
          privacyConsent,
          riderId: selectedRiderId,
          fulfillmentMode,
          redeemPoints: redeemPoints ? redeemablePts : 0
        })
      });

      setOrderSuccess(res.order);
      onClearCart();
      setShowUssdPrompt(false);
      setUssdPin("");
      onRewardsChanged?.();
    } catch (err: any) {
      setError(err.message || "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (queuedNotice) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-zinc-200 max-w-xl mx-auto text-center space-y-5 py-12">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <WifiOff className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Order Saved in Offline Queue</h2>
        <p className="text-sm text-zinc-600">
          Your order is safely queued on your device. As soon as your connection returns (or you turn off Offline Mode), SmartBridge will sync it automatically.
        </p>
        <button
          onClick={() => {
            setQueuedNotice(false);
            onOrderPlaced();
          }}
          className="px-6 py-2.5 bg-[#1e2127] hover:bg-[#2a2e37] text-white font-semibold rounded-xl text-sm"
        >
          View Orders
        </button>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-zinc-200 max-w-xl mx-auto text-center space-y-6 py-10" id="order_success_box">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-zinc-900">Order Confirmed</h2>
          <p className="text-sm text-zinc-600">
            Routed to {orderSuccess.businessName} with smart delivery matching.
          </p>
        </div>

        {/* 4-Digit Delivery Confirmation PIN */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-blue-800 block">Your Delivery Confirmation PIN</span>
          <span className="text-3xl font-extrabold font-mono tracking-widest text-blue-950 tabular-nums">
            {orderSuccess.deliveryPin}
          </span>
          <span className="text-xs text-blue-700 block">Share this PIN with your rider or seller only upon receiving your items.</span>
        </div>

        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Order Code</span>
            <span className="font-mono font-semibold text-zinc-800">{orderSuccess.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Fulfillment</span>
            <span className="font-semibold text-zinc-800">
              {orderSuccess.riderName} ({orderSuccess.riderVehicle}) · ETA {orderSuccess.predictedDeliveryMins} mins
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Bridge Points Earned</span>
            <span className="font-mono font-bold text-blue-700">+{orderSuccess.pointsEarned || 15} pts</span>
          </div>
          <div className="border-t border-zinc-200 pt-2 flex justify-between text-sm font-bold text-zinc-900">
            <span>Total Paid</span>
            <span className="font-mono tabular-nums">ZK {orderSuccess.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setOrderSuccess(null);
            onOrderPlaced();
          }}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition"
        >
          Track Order Live
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="shopping_cart_panel">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Shopping Cart & Smart Checkout</h2>
        <p className="text-sm text-zinc-600 mt-1">
          Matched with nearby riders, neighborhood delivery pooling, Mobile Money, and offline order support.
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white p-14 rounded-2xl text-center border border-zinc-200 space-y-2" id="cart_empty_state_card">
          <CartIcon className="w-10 h-10 mx-auto text-zinc-300" />
          <p className="text-base font-semibold text-zinc-700">Your shopping cart is empty</p>
          <p className="text-xs text-zinc-500">Browse the Marketplace or Group Buying deals to add items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="cart_active_workflow">
          <div className="lg:col-span-7 space-y-5">
            {/* Cart Items */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                <span className="font-bold text-zinc-900 text-sm">Cart Items ({cart.length})</span>
                <button onClick={onClearCart} className="text-xs font-semibold text-rose-600 hover:underline">
                  Clear Cart
                </button>
              </div>
              <div className="divide-y divide-zinc-100">
                {cart.map(item => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={resolveProductImage(item.productImageUrl, item.productName)}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover border border-zinc-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-900 text-sm truncate">{item.productName}</p>
                        <p className="text-xs text-zinc-500 font-mono tabular-nums">
                          ZK {item.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
                        <button onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)} className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-50 font-bold">-</button>
                        <span className="px-3 py-1 font-mono text-xs font-bold tabular-nums bg-zinc-50 border-x border-zinc-200">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)} className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-50 font-bold">+</button>
                      </div>
                      <button onClick={() => onUpdateQuantity(item.productId, 0)} className="p-1.5 text-zinc-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Delivery Matching */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-zinc-900">Smart Delivery Matching ({customerLocation})</h3>
                </div>
                <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setFulfillmentMode("delivery")}
                    className={`px-3 py-1 rounded-md font-semibold transition ${
                      fulfillmentMode === "delivery" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600"
                    }`}
                  >
                    Rider Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentMode("pickup")}
                    className={`px-3 py-1 rounded-md font-semibold transition ${
                      fulfillmentMode === "pickup" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600"
                    }`}
                  >
                    Self-Pickup (Free)
                  </button>
                </div>
              </div>

              {fulfillmentMode === "delivery" && (
                <div className="space-y-3">
                  {consolidatedAvailable && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                      Neighborhood Route Pooling active in {customerLocation}: delivery fee discounted by combining nearby drop-offs!
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {riders.map(rider => {
                      const active = selectedRiderId === rider.id;
                      const fee = Math.max(10, rider.baseFee - (consolidatedAvailable ? rider.consolidatedDiscount : 0));
                      return (
                        <button
                          key={rider.id}
                          type="button"
                          onClick={() => setSelectedRiderId(rider.id)}
                          className={`p-3.5 rounded-xl border text-left transition ${
                            active ? "border-blue-600 bg-blue-50/60" : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-zinc-900">
                            <span>{rider.name}</span>
                            <span className="font-mono tabular-nums">ZK {fee}</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">
                            {rider.vehicle} · ETA {rider.etaMins} mins · ★ {rider.rating}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Checkout Column */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 space-y-5" id="checkout_terminal_form">
              <h3 className="font-bold text-zinc-900 text-base border-b border-zinc-100 pb-3">Order Summary & Payment</h3>

              {finalTotal > budget.monthlyLimit && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>This checkout exceeds your ZK {budget.monthlyLimit} budget setting.</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">{error}</div>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Items Subtotal</span>
                  <span className="font-mono tabular-nums font-semibold text-zinc-900">ZK {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>{fulfillmentMode === "pickup" ? "Neighborhood Self-Pickup" : "Matched Rider Delivery"}</span>
                  <span className="font-mono tabular-nums font-semibold text-zinc-900">
                    {deliveryFee === 0 ? "FREE" : `ZK ${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>Bridge Points Redeemed</span>
                    <span className="font-mono tabular-nums">-ZK {pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-zinc-200 pt-2.5 flex justify-between text-base font-extrabold text-zinc-900">
                  <span>Total Due</span>
                  <span className="font-mono tabular-nums">ZK {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Bridge Points Redemption */}
              {redeemablePts >= 50 && !offlineMode && (
                <label className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-zinc-800">
                      Redeem {redeemablePts} pts for ZK {Math.floor(redeemablePts / 10)} off
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.checked)}
                    className="accent-blue-600"
                  />
                </label>
              )}

              {/* Payment Options */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-zinc-700 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "MTN MoMo", icon: Smartphone, label: "MTN MoMo" },
                    { id: "Airtel Money", icon: Wallet, label: "Airtel Money" },
                    { id: "Card", icon: CreditCard, label: "Card" },
                    { id: "Cash on Delivery", icon: Ticket, label: "Cash on Delivery" }
                  ].map(pm => {
                    const Icon = pm.icon;
                    const active = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => { setPaymentMethod(pm.id as any); setShowUssdPrompt(false); }}
                        className={`p-3 border rounded-xl flex items-center gap-2 text-xs font-semibold transition ${
                          active ? "border-blue-600 bg-blue-50/60 text-blue-900" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(paymentMethod === "MTN MoMo" || paymentMethod === "Airtel Money") && !showUssdPrompt && !offlineMode && (
                <div className="space-y-2.5 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs">
                  <input
                    type="text"
                    placeholder={paymentMethod === "MTN MoMo" ? "MTN Number (e.g. 0961234567)" : "Airtel Number (e.g. 0971234567)"}
                    maxLength={10}
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white font-mono outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Registered Account Name"
                    value={momoName}
                    onChange={(e) => setMomoName(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white outline-none"
                  />
                </div>
              )}

              {(paymentMethod === "MTN MoMo" || paymentMethod === "Airtel Money") && showUssdPrompt && (
                <div className="p-4 bg-[#1e2127] text-white rounded-xl space-y-3 text-xs">
                  <p className="font-semibold text-blue-400">{paymentMethod} USSD Confirmation</p>
                  <p>Approve ZK {finalTotal.toFixed(2)} to SmartBridge Market ({momoNumber})</p>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={ussdPin}
                    onChange={(e) => setUssdPin(e.target.value)}
                    className="w-full text-center px-3 py-2 bg-[#14161a] border border-[#353a46] rounded-lg font-mono text-base tracking-widest outline-none"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowUssdPrompt(false)} className="flex-1 py-2 bg-[#2e333d] rounded-lg font-semibold">Cancel</button>
                    <button type="button" onClick={handleCheckout} disabled={submitting || ussdPin.length < 4} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-40">
                      {submitting ? "Processing..." : "Approve Pay"}
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === "Card" && !offlineMode && (
                <div className="space-y-2 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs">
                  <input type="text" placeholder="Cardholder Name" value={cardHolder} onChange={e => setCardHolder(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white outline-none" />
                  <input type="text" maxLength={16} placeholder="Card Number" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white font-mono outline-none" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" maxLength={5} placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-lg bg-white font-mono outline-none" />
                    <input type="password" maxLength={3} placeholder="CVV" value={cardCvv} onChange={e => setCardCvv(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-lg bg-white font-mono outline-none" />
                  </div>
                </div>
              )}

              <label className="flex items-start gap-2.5 text-xs text-zinc-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-0.5 accent-blue-600"
                />
                <span>
                  I authorize SmartBridge to share my {customerLocation} delivery details with the merchant and matched rider.
                </span>
              </label>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={submitting || !privacyConsent}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition"
              >
                {offlineMode ? "Queue Order Offline" : submitting ? "Processing..." : "Place Order Securely"}
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Protected by AI Fraud Shield & PIN Delivery</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
