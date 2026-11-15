import React, { useState, useEffect } from "react";
import { Product, Order, StorageFile, NegotiationOffer, FraudAlert, SellerTrustProfile, ListingType } from "../types";
import { apiFetch } from "../utils/api";
import { resolveProductImage } from "../utils/productImages";
import {
  Store,
  PlusCircle,
  Trash2,
  ShoppingBag,
  ClipboardList,
  Truck,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Scale,
  Image,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Boxes,
  Calendar,
  RefreshCw,
  X,
  KeyRound
} from "lucide-react";

export default function TraderDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<StorageFile[]>([]);
  const [negotiations, setNegotiations] = useState<NegotiationOffer[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [trustProfile, setTrustProfile] = useState<SellerTrustProfile | null>(null);
  const [seasonalSignals, setSeasonalSignals] = useState<any[]>([]);
  const [inventoryPredictions, setInventoryPredictions] = useState<any[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Enhanced New Product Form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Fresh Produce");
  const [listingType, setListingType] = useState<ListingType>("new");
  const [harvestDate, setHarvestDate] = useState("");
  const [minBulkQty, setMinBulkQty] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [rentalDeposit, setRentalDeposit] = useState("");
  const [conditionGrade, setConditionGrade] = useState<"Like New" | "Good" | "Fair">("Good");
  const [enableGroupBuy, setEnableGroupBuy] = useState(false);
  const [groupTarget, setGroupTarget] = useState("5");
  const [groupPrice, setGroupPrice] = useState("");
  const [selectedFileId, setSelectedFileId] = useState("");
  const [selectedFileUrl, setSelectedFileUrl] = useState("");

  // AI & Modals
  const [writingDescription, setWritingDescription] = useState(false);
  const [optimizeProduct, setOptimizeProduct] = useState<Product | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedReport, setOptimizedReport] = useState<any | null>(null);
  const [marketingProduct, setMarketingProduct] = useState<Product | null>(null);
  const [marketingPlatform, setMarketingPlatform] = useState("WhatsApp");
  const [generatingCampaign, setGeneratingCampaign] = useState(false);
  const [campaignOutput, setCampaignOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [enhancingProductId, setEnhancingProductId] = useState<string | null>(null);

  // Negotiation counter input & PIN verification
  const [counterDrafts, setCounterDrafts] = useState<Record<string, string>>({});
  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({});

  const syncAllTraderData = async () => {
    try {
      const me = JSON.parse(localStorage.getItem("smartbridge_user_info") || "{}");
      const [pRes, oRes, fRes, negRes, fraudRes, trustRes, predRes] = await Promise.all([
        apiFetch("/api/products"),
        apiFetch("/api/orders"),
        apiFetch("/api/files"),
        apiFetch("/api/negotiations"),
        apiFetch("/api/fraud/alerts"),
        apiFetch("/api/sellers/trust"),
        apiFetch("/api/ai/inventory-prediction")
      ]);

      setProducts((pRes.products || []).filter((p: any) => p.userId === me.id));
      setOrders(oRes.orders || []);
      setUploadedFiles(fRes.files || []);
      setNegotiations(negRes.negotiations || []);
      setFraudAlerts((fraudRes.alerts || []).filter((a: FraudAlert) => !a.resolved));
      const myTrust = (trustRes.profiles || []).find((t: SellerTrustProfile) => t.traderId === me.id);
      if (myTrust) setTrustProfile(myTrust);
      if (predRes.predictions) setInventoryPredictions(predRes.predictions);
      if (predRes.seasonalSignals) setSeasonalSignals(predRes.seasonalSignals);
    } catch {
      setError("Failed to sync shop records.");
    }
  };

  useEffect(() => {
    syncAllTraderData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || isNaN(Number(price))) {
      setError("Please provide a valid product name and price.");
      return;
    }
    setError(null);

    try {
      await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          price: Number(price),
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          description,
          category,
          listingType,
          harvestDate: listingType === "farm_direct" ? harvestDate : undefined,
          minBulkQty: listingType === "farm_direct" && minBulkQty ? Number(minBulkQty) : undefined,
          advanceReservation: listingType === "farm_direct",
          expiryDate: listingType === "clearance" ? expiryDate : undefined,
          rentalRatePerDay: listingType === "rent" ? Number(price) : undefined,
          rentalDeposit: listingType === "rent" && rentalDeposit ? Number(rentalDeposit) : undefined,
          conditionGrade: listingType === "resell" ? conditionGrade : undefined,
          groupBuy: enableGroupBuy && groupPrice
            ? { enabled: true, targetBuyers: Number(groupTarget || 5), discountedPrice: Number(groupPrice) }
            : undefined,
          imageUrl: selectedFileUrl || undefined,
          fileId: selectedFileId || undefined
        })
      });

      setName("");
      setPrice("");
      setOriginalPrice("");
      setDescription("");
      setHarvestDate("");
      setMinBulkQty("");
      setExpiryDate("");
      setRentalDeposit("");
      setEnableGroupBuy(false);
      setGroupPrice("");
      setSelectedFileId("");
      setSelectedFileUrl("");
      showToast("Product listing published to SmartBridge Market.");
      syncAllTraderData();
    } catch (err: any) {
      setError(err.message || "Failed to publish listing.");
    }
  };

  const triggerAiDescription = async () => {
    if (!name) {
      setError("Enter a Product Name first so AI can draft the description.");
      return;
    }
    setWritingDescription(true);
    try {
      const res = await apiFetch("/api/ai/generate-description", {
        method: "POST",
        body: JSON.stringify({ name, category })
      });
      if (res.description) setDescription(res.description);
    } finally {
      setWritingDescription(false);
    }
  };

  const triggerImageEnhancement = async (productId: string) => {
    setEnhancingProductId(productId);
    try {
      const res = await apiFetch("/api/ai/enhance-image", {
        method: "POST",
        body: JSON.stringify({ productId })
      });
      if (res.success) {
        setProducts(prev => prev.map(p => (p.id === productId ? { ...p, imageUrl: res.imageUrl } : p)));
        showToast("Product photo upgraded with studio asset.");
      }
    } finally {
      setEnhancingProductId(null);
    }
  };

  const openPriceOptimization = async (product: Product) => {
    setOptimizeProduct(product);
    setOptimizing(true);
    setOptimizedReport(null);
    try {
      const res = await apiFetch("/api/ai/optimize-price", {
        method: "POST",
        body: JSON.stringify({
          name: product.name,
          currentPrice: product.price,
          category: product.category,
          description: product.description
        })
      });
      setOptimizedReport(res);
    } finally {
      setOptimizing(false);
    }
  };

  const applyOptimizedPrice = async () => {
    if (!optimizeProduct || !optimizedReport) return;
    try {
      const res = await apiFetch(`/api/products/${optimizeProduct.id}`, {
        method: "PATCH",
        body: JSON.stringify({ price: Number(optimizedReport.recommendedPrice) })
      });
      if (res.success) {
        setProducts(prev => prev.map(p => (p.id === optimizeProduct.id ? { ...p, price: Number(optimizedReport.recommendedPrice) } : p)));
        setOptimizeProduct(null);
        showToast("Optimized price applied.");
      }
    } catch {
      // ignore
    }
  };

  const generateAdCampaign = async () => {
    if (!marketingProduct) return;
    setGeneratingCampaign(true);
    try {
      const res = await apiFetch("/api/ai/marketing-campaign", {
        method: "POST",
        body: JSON.stringify({
          name: marketingProduct.name,
          category: marketingProduct.category,
          description: marketingProduct.description,
          platform: marketingPlatform
        })
      });
      setCampaignOutput(res.campaign || "");
    } finally {
      setGeneratingCampaign(false);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    try {
      await apiFetch(`/api/products/${prodId}`, { method: "DELETE" });
      setProducts(prev => prev.filter(p => p.id !== prodId));
      showToast("Listing removed.");
    } catch {
      setError("Failed to delete product.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus as any } : o)));
    } catch {
      setError("Could not update order status.");
    }
  };

  const handleVerifyPin = async (orderId: string) => {
    const pin = pinDrafts[orderId] || "";
    if (!pin.trim()) return;
    try {
      const res = await apiFetch(`/api/orders/${orderId}/verify-pin`, {
        method: "POST",
        body: JSON.stringify({ pin })
      });
      if (res.success) {
        setOrders(prev => prev.map(o => (o.id === orderId ? res.order : o)));
        showToast("Delivery PIN verified! Order completed.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid Delivery PIN.");
    }
  };

  const handleRespondNegotiation = async (id: string, action: "accept" | "counter" | "decline") => {
    try {
      const res = await apiFetch(`/api/negotiations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          counterPrice: action === "counter" ? Number(counterDrafts[id] || 0) : undefined
        })
      });
      if (res.negotiation) {
        setNegotiations(prev => prev.map(n => (n.id === id ? res.negotiation : n)));
        showToast(`Offer ${res.negotiation.status.toLowerCase()}.`);
      }
    } catch {
      // ignore
    }
  };

  const handleResolveFraud = async (alertId: string) => {
    await apiFetch(`/api/fraud/alerts/${alertId}/resolve`, { method: "POST" });
    setFraudAlerts(prev => prev.filter(a => a.id !== alertId));
    showToast("Fraud alert marked resolved.");
  };

  const totalRevenue = orders.reduce((sum, o) => (o.status === "Delivered" ? sum + o.totalAmount : sum), 0);
  const pendingOrders = orders.filter(o => o.status !== "Delivered").length;

  return (
    <div className="space-y-8 pb-12" id="trader_dashboard_view">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Seller Hub & AI Demand Intelligence</h2>
          <p className="text-sm text-zinc-600 mt-1">
            Manage retail, rental, farm-direct & clearance listings, respond to bargains, and monitor fraud alerts.
          </p>
        </div>
        {trustProfile && (
          <div className="px-4 py-2.5 bg-white border border-zinc-200 rounded-xl flex items-center gap-3 text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-zinc-700">Trust Score:</span>
            <span className="font-mono font-extrabold text-blue-700 tabular-nums">{trustProfile.trustScore}/100</span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-600">{trustProfile.successfulDeliveriesPct}% On-Time</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold">
            <span>Completed Sales</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-zinc-900 font-mono tabular-nums">ZK {totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-zinc-500">Cleared via MoMo, Card & COD</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold">
            <span>Active Orders Queue</span>
            <ShoppingBag className="w-4 h-4 text-zinc-600" />
          </div>
          <p className="text-2xl font-extrabold text-zinc-900 font-mono tabular-nums">{pendingOrders} Active</p>
          <p className="text-xs text-zinc-500">Verify 4-digit customer PIN on delivery</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold">
            <span>AI Seasonal Demand</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-zinc-700 leading-relaxed">
            {seasonalSignals[0]?.insight || "Fertilizer, school essentials, and weekend fresh produce demand trending upward."}
          </p>
        </div>
      </div>

      {/* Smart Fraud Shield Alerts */}
      {fraudAlerts.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Smart Fraud Detection Alerts ({fraudAlerts.length})</span>
          </div>
          <div className="space-y-2.5">
            {fraudAlerts.map(al => (
              <div key={al.id} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950">{al.title} · {al.riskLevel} Risk</p>
                  <p className="text-amber-900">{al.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResolveFraud(al.id)}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-semibold rounded-lg shrink-0"
                >
                  Mark Reviewed
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Demand Forecasting Table */}
      {inventoryPredictions.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-zinc-900 text-sm">AI Demand Forecasting & Stock Recommendations</h3>
            </div>
            <span className="text-xs text-zinc-500">Seasonal & neighborhood velocity</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inventoryPredictions.map((pred, i) => (
              <div key={pred.productId || i} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-zinc-900 truncate">{pred.productName}</span>
                  <span className={`font-semibold shrink-0 ${pred.alert === "Restock Urgent" ? "text-amber-700" : "text-blue-700"}`}>
                    {pred.alert}
                  </span>
                </div>
                <p className="text-zinc-600">{pred.demandScore}</p>
                <div className="flex items-center justify-between text-zinc-500 pt-1 border-t border-zinc-200/70 tabular-nums">
                  <span>Stock: {pred.stockRemaining} ({pred.daysOfStock}d)</span>
                  <span className="font-mono font-bold text-zinc-900">Reorder +{pred.recommendedReorderQty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Bargaining Inbox */}
      {negotiations.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-zinc-900">Customer Price Offers ({negotiations.length})</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {negotiations.map(neg => (
              <div key={neg.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-zinc-900">{neg.customerName} offered ZK {neg.offerPrice} for {neg.productName}</p>
                  <p className="text-zinc-500">Listed ZK {neg.listedPrice} · {neg.aiFairRange} · Status: {neg.status}</p>
                </div>
                {neg.status === "Pending" && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleRespondNegotiation(neg.id, "accept")} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">Accept</button>
                    <input
                      type="number"
                      placeholder="Counter ZK"
                      value={counterDrafts[neg.id] || ""}
                      onChange={e => setCounterDrafts({ ...counterDrafts, [neg.id]: e.target.value })}
                      className="w-24 px-2 py-1.5 border border-zinc-200 rounded-lg font-mono"
                    />
                    <button onClick={() => handleRespondNegotiation(neg.id, "counter")} className="px-3 py-1.5 bg-[#1e2127] hover:bg-[#2a2e37] text-white rounded-lg font-semibold">Counter</button>
                    <button onClick={() => handleRespondNegotiation(neg.id, "decline")} className="px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-lg font-semibold">Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Add Product Form */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-zinc-900 text-sm">Publish New Listing</h3>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Listing Type</label>
                <select
                  value={listingType}
                  onChange={e => setListingType(e.target.value as ListingType)}
                  className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-xl outline-none"
                >
                  <option value="new">Standard Retail (New)</option>
                  <option value="farm_direct">Agricultural Farm Direct</option>
                  <option value="rent">Product Rental (Per Day)</option>
                  <option value="resell">Pre-Owned / Resell</option>
                  <option value="clearance">Near-Expiry / Clearance Deal</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. D-Compound Fertilizer 50kg"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    {listingType === "rent" ? "Daily Rate (ZK)" : "Price (ZK)"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="580"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-xl outline-none"
                  >
                    {["Fresh Produce", "Bakery", "Agriculture", "Electronics", "Hardware", "Groceries"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {listingType === "farm_direct" && (
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Harvest Date (e.g. Nov 24)" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-xl outline-none" />
                  <input type="number" placeholder="Min Bulk Qty" value={minBulkQty} onChange={e => setMinBulkQty(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-xl font-mono outline-none" />
                </div>
              )}

              {listingType === "clearance" && (
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Original Price ZK" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-xl font-mono outline-none" />
                  <input type="text" placeholder="Best Before Date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-xl outline-none" />
                </div>
              )}

              {listingType === "rent" && (
                <input type="number" placeholder="Refundable Deposit (ZK)" value={rentalDeposit} onChange={e => setRentalDeposit(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-mono outline-none" />
              )}

              {listingType === "resell" && (
                <select value={conditionGrade} onChange={e => setConditionGrade(e.target.value as any)} className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-xl outline-none">
                  <option value="Like New">Condition: Like New</option>
                  <option value="Good">Condition: Good</option>
                  <option value="Fair">Condition: Fair</option>
                </select>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-zinc-700">Description</label>
                  <button type="button" onClick={triggerAiDescription} disabled={writingDescription} className="text-blue-700 font-semibold hover:underline flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {writingDescription ? "Writing..." : "AI Write"}
                  </button>
                </div>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe quality, specs, or pickup..." className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-blue-600" />
              </div>

              <label className="flex items-center gap-2 text-zinc-700 font-medium cursor-pointer">
                <input type="checkbox" checked={enableGroupBuy} onChange={e => setEnableGroupBuy(e.target.checked)} className="accent-blue-600" />
                Enable Community Group Buy Discount
              </label>

              {enableGroupBuy && (
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Group Price ZK" value={groupPrice} onChange={e => setGroupPrice(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-xl font-mono outline-none" />
                  <input type="number" placeholder="Target Buyers" value={groupTarget} onChange={e => setGroupTarget(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-xl font-mono outline-none" />
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <select
                  value={selectedFileId}
                  onChange={e => {
                    const file = uploadedFiles.find(f => f.id === e.target.value);
                    setSelectedFileId(file?.id || "");
                    setSelectedFileUrl(file?.filePath || "");
                  }}
                  className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-xl outline-none"
                >
                  <option value="">Auto-select studio category image</option>
                  {uploadedFiles.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
                </select>
              )}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition">
                Publish Listing
              </button>
            </form>
          </div>
        </div>

        {/* Right: Catalog & Orders */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Store className="w-4 h-4 text-zinc-500" />
              <h3 className="font-bold text-zinc-900 text-sm">Active Catalog ({products.length})</h3>
            </div>
            {products.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No listings published yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(prod => (
                  <div key={prod.id} className="p-4 border border-zinc-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {enhancingProductId === prod.id ? (
                          <div className="w-12 h-12 rounded-lg bg-[#1e2127] flex items-center justify-center shrink-0">
                            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                          </div>
                        ) : (
                          <img
                            src={resolveProductImage(prod.imageUrl, prod.category)}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg object-cover border border-zinc-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 truncate">{prod.name}</p>
                          <p className="font-mono font-bold text-zinc-700 tabular-nums">ZK {prod.price.toFixed(2)}</p>
                          <p className="text-zinc-500">{prod.category} · {prod.listingType || "new"}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteProduct(prod.id)} className="p-1.5 text-zinc-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-zinc-100">
                      <button onClick={() => openPriceOptimization(prod)} className="py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg font-semibold flex items-center justify-center gap-1">
                        <Scale className="w-3 h-3 text-blue-600" /> Optimize
                      </button>
                      <button onClick={() => triggerImageEnhancement(prod.id)} className="py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg font-semibold flex items-center justify-center gap-1">
                        <Image className="w-3 h-3 text-zinc-600" /> Enhance
                      </button>
                      <button onClick={() => { setMarketingProduct(prod); setCampaignOutput(""); }} className="py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg font-semibold flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-600" /> Ad Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders Fulfillment with Delivery PIN */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <ClipboardList className="w-4 h-4 text-zinc-500" />
              <h3 className="font-bold text-zinc-900 text-sm">Inbound Orders ({orders.length})</h3>
            </div>
            {orders.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No customer orders yet.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {orders.map(order => (
                  <div key={order.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-zinc-800">{order.id}</span>
                        <span>·</span>
                        <span className="font-semibold text-zinc-900">{order.customerName} ({order.customerLocation})</span>
                        <span>·</span>
                        <span className={order.fraudRisk === "Low" ? "text-blue-700 font-semibold" : "text-amber-700 font-semibold"}>
                          {order.fraudRisk || "Low"} Fraud Risk
                        </span>
                      </div>
                      <p className="text-zinc-600">{order.items.map(i => `${i.productName} x${i.quantity}`).join(", ")}</p>
                      <p className="font-mono font-bold text-zinc-900 tabular-nums">ZK {order.totalAmount.toFixed(2)} · {order.paymentMethod}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {order.status === "Pending" && (
                        <button onClick={() => handleUpdateOrderStatus(order.id, "Preparing")} className="px-3.5 py-2 bg-[#1e2127] hover:bg-[#2a2e37] text-white rounded-lg font-semibold">
                          Approve & Prepare
                        </button>
                      )}
                      {order.status === "Preparing" && (
                        <button onClick={() => handleUpdateOrderStatus(order.id, "Out for Delivery")} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" /> Dispatch
                        </button>
                      )}
                      {order.status === "Out for Delivery" && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="Customer PIN"
                            value={pinDrafts[order.id] || ""}
                            onChange={e => setPinDrafts({ ...pinDrafts, [order.id]: e.target.value })}
                            className="w-28 px-2.5 py-1.5 border border-zinc-200 rounded-lg font-mono text-xs"
                          />
                          <button onClick={() => handleVerifyPin(order.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5" /> Verify PIN
                          </button>
                        </div>
                      )}
                      {order.status === "Delivered" && (
                        <span className="text-blue-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Delivered
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Optimization Modal */}
      {optimizeProduct && (
        <div className="fixed inset-0 bg-[#1e2127]/65 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <span className="text-sm font-bold text-zinc-900">AI Price Optimizer</span>
              <button onClick={() => setOptimizeProduct(null)} className="text-zinc-400 hover:text-zinc-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="font-bold text-zinc-900">{optimizeProduct.name} (Current: ZK {optimizeProduct.price.toFixed(2)})</p>
              {optimizing ? (
                <p className="text-zinc-500 py-6 text-center">Analyzing district competition...</p>
              ) : optimizedReport && (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-blue-800 block">Recommended Price</span>
                      <span className="text-xl font-extrabold font-mono text-blue-950 tabular-nums">ZK {Number(optimizedReport.recommendedPrice).toFixed(2)}</span>
                    </div>
                    <span className="font-mono font-bold text-blue-700">{optimizedReport.percentageChange}</span>
                  </div>
                  <p className="text-zinc-600 leading-relaxed">{optimizedReport.analysis}</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2 text-xs">
              <button onClick={() => setOptimizeProduct(null)} className="px-4 py-2 font-semibold text-zinc-600">Cancel</button>
              <button onClick={applyOptimizedPrice} disabled={optimizing || !optimizedReport} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">
                Apply Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketing Campaign Modal */}
      {marketingProduct && (
        <div className="fixed inset-0 bg-[#1e2127]/65 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <span className="text-sm font-bold text-zinc-900">AI Campaign Copywriter</span>
              <button onClick={() => setMarketingProduct(null)} className="text-zinc-400 hover:text-zinc-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900">{marketingProduct.name}</span>
                <select value={marketingPlatform} onChange={e => setMarketingPlatform(e.target.value)} className="border border-zinc-200 rounded-lg px-2 py-1 bg-white">
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Facebook">Facebook</option>
                  <option value="SMS">SMS Blast</option>
                </select>
              </div>
              {generatingCampaign ? (
                <p className="text-zinc-500 py-6 text-center">Drafting copy...</p>
              ) : campaignOutput ? (
                <div className="relative">
                  <textarea readOnly rows={6} value={campaignOutput} className="w-full p-3 bg-[#1e2127] text-blue-300 font-mono rounded-xl resize-none outline-none" />
                  <button
                    onClick={() => { navigator.clipboard?.writeText(campaignOutput); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="absolute top-2 right-2 p-1.5 bg-[#242830] text-white rounded-lg"
                  >
                    {copied ? <Check className="w-4 h-4 text-blue-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-4">Click Generate below to write local promo copy.</p>
              )}
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2 text-xs">
              <button onClick={() => setMarketingProduct(null)} className="px-4 py-2 font-semibold text-zinc-600">Close</button>
              <button onClick={generateAdCampaign} disabled={generatingCampaign} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                Generate Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
