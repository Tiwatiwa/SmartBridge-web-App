import React, { useState, useEffect, useRef } from "react";
import { Product, SellerTrustProfile, LocalLanguage, ListingType } from "../types";
import { apiFetch } from "../utils/api";
import { resolveProductImage } from "../utils/productImages";
import {
  cacheProductsOffline,
  getCachedProductsOffline,
  cacheTrustProfilesOffline,
  getCachedTrustProfilesOffline,
  getBudgetSettings,
  saveBudgetSettings
} from "../utils/offline";
import {
  CompareBargainModal,
  SellerTrustModal,
  VirtualPreviewModal,
  ResellItemModal
} from "./ProductModals";
import {
  Search,
  MapPin,
  MessageSquare,
  ShoppingCart,
  Store,
  Sparkles,
  Mic,
  Camera,
  Heart,
  Star,
  Send,
  X,
  RefreshCw,
  Scale,
  ShieldCheck,
  Eye,
  Upload,
  Wallet,
  Plus,
  AlertTriangle,
  WifiOff
} from "lucide-react";

interface DiscoveryProps {
  onAddToCart: (product: Product) => void;
  onOpenChat: (traderId: string) => void;
  customerLocation: string;
  offlineMode: boolean;
  cartTotal: number;
}

const LANGUAGE_OPTIONS: { code: LocalLanguage; label: string; sample: string }[] = [
  { code: "en", label: "English", sample: "Smartphone with good camera under K2,500" },
  { code: "bem", label: "Bemba", sample: "Ndefwaya feteleza na chisamba strawberries" },
  { code: "nya", label: "Nyanja", sample: "Nifuna chimanga na mafuta yabwino" },
  { code: "ton", label: "Tonga", sample: "Ndiyanda mapopwe na foni mbotu" },
  { code: "loz", label: "Lozi", sample: "Nibata buhobe ni feteleza ya mbonyi" }
];

export default function Discovery({
  onAddToCart,
  onOpenChat,
  customerLocation,
  offlineMode,
  cartTotal
}: DiscoveryProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [listingFilter, setListingFilter] = useState<"all" | ListingType | "nearby">("all");
  const [nearbyShops, setNearbyShops] = useState<any[]>([]);

  // Voice & Visual Search
  const [voiceLang, setVoiceLang] = useState<LocalLanguage>("en");
  const [isListening, setIsListening] = useState(false);
  const [voiceBanner, setVoiceBanner] = useState<{ intent: string; reply: string } | null>(null);
  const [showVisualSearch, setShowVisualSearch] = useState(false);
  const [visualScanning, setVisualScanning] = useState(false);
  const [visualResultDesc, setVisualResultDesc] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trust Profiles & Wishlist
  const [trustProfiles, setTrustProfiles] = useState<SellerTrustProfile[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Budget Manager
  const [budget, setBudget] = useState(getBudgetSettings());
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(budget.monthlyLimit));
  const [spentOrdersTotal, setSpentOrdersTotal] = useState(0);

  // Modals & Drawers
  const [compareProduct, setCompareProduct] = useState<Product | null>(null);
  const [trustModalProfile, setTrustModalProfile] = useState<SellerTrustProfile | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [showResellModal, setShowResellModal] = useState(false);

  // Reviews Drawer
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<Product | null>(null);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [aiReviewSummary, setAiReviewSummary] = useState<any | null>(null);
  const [analyzingReviews, setAnalyzingReviews] = useState(false);

  const fetchCatalog = async (customQuery = "") => {
    setLoading(true);
    const activeSearch = customQuery || search;

    if (offlineMode) {
      const cached = getCachedProductsOffline();
      let list = cached.items;
      if (filterLocation) list = list.filter(p => p.location.toLowerCase() === filterLocation.toLowerCase());
      if (filterCategory) list = list.filter(p => p.category.toLowerCase() === filterCategory.toLowerCase());
      if (listingFilter !== "all" && listingFilter !== "nearby") {
        list = list.filter(p => (p.listingType || "new") === listingFilter);
      }
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.businessName.toLowerCase().includes(q)
        );
      }
      setProducts(list);
      setTrustProfiles(getCachedTrustProfilesOffline());
      setLoading(false);
      return;
    }

    try {
      if (activeSearch.trim().length > 2) {
        const res = await apiFetch(`/api/ai/smart-search?q=${encodeURIComponent(activeSearch)}`);
        let list: Product[] = res.products || [];
        if (listingFilter !== "all" && listingFilter !== "nearby") {
          list = list.filter(p => (p.listingType || "new") === listingFilter);
        }
        setProducts(list);
      } else {
        const params = new URLSearchParams();
        if (filterLocation) params.append("location", filterLocation);
        if (filterCategory) params.append("category", filterCategory);
        if (listingFilter !== "all" && listingFilter !== "nearby") params.append("listingType", listingFilter);

        const res = await apiFetch(`/api/products?${params.toString()}`);
        const prods: Product[] = res.products || [];
        setProducts(prods);
        if (!filterLocation && !filterCategory && listingFilter === "all") {
          cacheProductsOffline(prods);
        }
      }
    } catch {
      setProducts(getCachedProductsOffline().items);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportingData = async () => {
    if (offlineMode) {
      setTrustProfiles(getCachedTrustProfilesOffline());
      return;
    }
    try {
      const [trustRes, wishRes, ordRes, neighRes] = await Promise.all([
        apiFetch("/api/sellers/trust"),
        apiFetch("/api/wishlist"),
        apiFetch("/api/orders"),
        apiFetch(`/api/neighborhood/availability?location=${encodeURIComponent(filterLocation || customerLocation)}`)
      ]);
      if (trustRes.profiles) {
        setTrustProfiles(trustRes.profiles);
        cacheTrustProfilesOffline(trustRes.profiles);
      }
      if (wishRes.wishlist) {
        setWishlistIds(wishRes.wishlist.map((p: any) => p.id));
      }
      if (ordRes.orders) {
        const total = ordRes.orders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0);
        setSpentOrdersTotal(total);
      }
      if (neighRes.shops) {
        setNearbyShops(neighRes.shops);
      }
    } catch {
      // ignore offline/transient errors
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchSupportingData();
  }, [filterLocation, filterCategory, listingFilter, offlineMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVoiceBanner(null);
    fetchCatalog();
  };

  const runVoiceInterpretation = async (transcript: string, lang: LocalLanguage) => {
    setSearch(transcript);
    if (offlineMode) {
      fetchCatalog(transcript);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/ai/voice-search", {
        method: "POST",
        body: JSON.stringify({ transcript, language: lang })
      });
      setVoiceBanner({
        intent: res.interpretedIntent || transcript,
        reply: res.localizedReply || ""
      });
      setProducts(res.products || []);
    } catch {
      fetchCatalog(transcript);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceSearch = () => {
    if (isListening) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = voiceLang === "en" ? "en-ZM" : "en-US";
        recognition.interimResults = false;
        setIsListening(true);
        recognition.onresult = (event: any) => {
          const spoken = event.results[0][0].transcript;
          setIsListening(false);
          runVoiceInterpretation(spoken, voiceLang);
        };
        recognition.onerror = () => {
          setIsListening(false);
          const fallback = LANGUAGE_OPTIONS.find(l => l.code === voiceLang)?.sample || "Fresh produce";
          runVoiceInterpretation(fallback, voiceLang);
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
        return;
      } catch {
        setIsListening(false);
      }
    }

    // Fallback interactive voice simulation in chosen Zambian language
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const sample = LANGUAGE_OPTIONS.find(l => l.code === voiceLang)?.sample || "Fresh produce";
      runVoiceInterpretation(sample, voiceLang);
    }, 1200);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVisualScanning(true);
    setVisualResultDesc("");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await apiFetch("/api/ai/visual-search", {
          method: "POST",
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type || "image/jpeg" })
        });
        setVisualResultDesc(res.description || "Matched similar items from local sellers.");
        setProducts(res.matches || []);
      } catch {
        setVisualResultDesc("Could not process image right now. Showing popular catalog items.");
      } finally {
        setVisualScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerSampleVisualScan = async (keyword: string) => {
    setVisualScanning(true);
    setVisualResultDesc("");
    try {
      const res = await apiFetch("/api/ai/visual-search", {
        method: "POST",
        body: JSON.stringify({ sampleImageKeyword: keyword })
      });
      setVisualResultDesc(res.description || "");
      setProducts(res.matches || []);
    } finally {
      setVisualScanning(false);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (offlineMode) return;
    const isWished = wishlistIds.includes(productId);
    try {
      if (isWished) {
        await apiFetch(`/api/wishlist/${productId}`, { method: "DELETE" });
        setWishlistIds(prev => prev.filter(id => id !== productId));
      } else {
        await apiFetch("/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId })
        });
        setWishlistIds(prev => [...prev, productId]);
      }
    } catch {
      // ignore
    }
  };

  const openReviews = async (product: Product) => {
    setSelectedProductForReviews(product);
    setReviewsList([]);
    setAiReviewSummary(null);
    if (offlineMode) return;
    try {
      const res = await apiFetch(`/api/products/${product.id}/reviews`);
      setReviewsList(res.reviews || []);
    } catch {
      // ignore
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForReviews || !newComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await apiFetch(`/api/products/${selectedProductForReviews.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: newRating, comment: newComment })
      });
      if (res.success) {
        setReviewsList(prev => [res.review, ...prev]);
        setNewComment("");
        setNewRating(5);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const runAiReviewAnalysis = async () => {
    if (!selectedProductForReviews) return;
    setAnalyzingReviews(true);
    try {
      const res = await apiFetch("/api/ai/analyze-reviews", {
        method: "POST",
        body: JSON.stringify({ productId: selectedProductForReviews.id })
      });
      setAiReviewSummary(res);
    } finally {
      setAnalyzingReviews(false);
    }
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = Math.max(50, Number(budgetInput) || 2500);
    const updated = { ...budget, monthlyLimit: limit };
    setBudget(updated);
    saveBudgetSettings(updated);
    setEditingBudget(false);
  };

  const totalProjectedSpend = spentOrdersTotal + cartTotal;
  const budgetPct = Math.min(100, Math.round((totalProjectedSpend / Math.max(1, budget.monthlyLimit)) * 100));
  const overBudget = totalProjectedSpend > budget.monthlyLimit;
  const nearBudget = !overBudget && budgetPct >= budget.alertThresholdPct;

  const CATEGORIES = ["Fresh Produce", "Bakery", "Agriculture", "Electronics", "Hardware", "Groceries"];
  const LOCATIONS = ["Lusaka", "Kitwe", "Ndola", "Chisamba", "Chongwe"];

  const getTrustForProduct = (traderId: string) =>
    trustProfiles.find(tp => tp.traderId === traderId) || {
      traderId,
      businessName: "Local Seller",
      location: customerLocation,
      category: "Marketplace",
      verifiedBusiness: true,
      trustScore: 92,
      successfulDeliveriesPct: 96,
      avgRating: 4.8,
      responseTimeMins: 12,
      cancellationRatePct: 1.5,
      reviewCount: 4
    };

  const modeLabel = (type?: ListingType) => {
    switch (type) {
      case "farm_direct": return "Farm Direct";
      case "rent": return "Rent";
      case "resell": return "Pre-Owned";
      case "clearance": return "Clearance";
      default: return "Buy New";
    }
  };

  return (
    <div className="space-y-6 pb-16" id="local_discovery_page">
      {/* Offline Banner */}
      {offlineMode && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Offline Shopping Mode active. Browsing locally cached products ({products.length} items) — orders you place in Cart will sync automatically once back online.
            </span>
          </div>
        </div>
      )}

      {statusNotice && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium flex items-center justify-between">
          <span>{statusNotice}</span>
          <button onClick={() => setStatusNotice(null)} className="text-blue-700 font-bold">Dismiss</button>
        </div>
      )}

      {/* Smart Shopping Budget Manager Strip */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-zinc-900">Smart Shopping Budget Manager</h3>
            </div>
            <div className="text-xs font-mono tabular-nums text-zinc-700">
              <span className={overBudget ? "text-rose-600 font-bold" : "font-bold"}>
                ZK {totalProjectedSpend.toFixed(0)}
              </span>
              <span className="text-zinc-400"> / ZK {budget.monthlyLimit.toFixed(0)}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                overBudget ? "bg-rose-600" : nearBudget ? "bg-amber-500" : "bg-blue-600"
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          {overBudget ? (
            <p className="text-xs text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Budget exceeded by ZK {(totalProjectedSpend - budget.monthlyLimit).toFixed(0)}. Consider Clearance deals, Group Buying, or Compare Offers for cheaper sellers.
            </p>
          ) : (
            <p className="text-xs text-zinc-500 tabular-nums">
              ZK {(budget.monthlyLimit - totalProjectedSpend).toFixed(0)} remaining ({cartTotal > 0 ? `includes ZK ${cartTotal.toFixed(0)} in cart` : "on track"})
            </p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {editingBudget ? (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-28 px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono tabular-nums outline-none"
              />
              <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg">
                Save
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setBudgetInput(String(budget.monthlyLimit));
                setEditingBudget(true);
              }}
              className="px-3.5 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-xl transition whitespace-nowrap"
            >
              Set Budget
            </button>
          )}
        </div>
      </div>

      {/* Search, Local-Language Voice & Visual Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-4" id="filters_card_container">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Ask in natural language, e.g. 'smartphone with good camera under K2,500' or 'fertilizer'"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-24 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-zinc-900 text-sm"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`p-2 rounded-lg transition ${
                  isListening ? "bg-rose-600 text-white" : "text-zinc-500 hover:bg-zinc-100"
                }`}
                title="Voice shopping in local Zambian languages"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowVisualSearch(!showVisualSearch)}
                className={`p-2 rounded-lg transition ${
                  showVisualSearch ? "bg-blue-50 text-blue-700" : "text-zinc-500 hover:bg-zinc-100"
                }`}
                title="Search by product photograph"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value as LocalLanguage)}
              className="px-3 py-3 border border-zinc-200 bg-white rounded-xl text-xs font-semibold text-zinc-700 outline-none"
              aria-label="Voice language"
            >
              {LANGUAGE_OPTIONS.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick Local-Language Voice Phrases */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 font-medium">Try voice phrase:</span>
          {LANGUAGE_OPTIONS.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setVoiceLang(l.code);
                runVoiceInterpretation(l.sample, l.code);
              }}
              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium transition whitespace-nowrap"
            >
              {l.label}: "{l.sample.slice(0, 28)}..."
            </button>
          ))}
        </div>

        {voiceBanner && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-bold">Voice Assistant ({LANGUAGE_OPTIONS.find(l => l.code === voiceLang)?.label})</p>
              <p>{voiceBanner.reply} <span className="text-zinc-600">({voiceBanner.intent})</span></p>
            </div>
            <button onClick={() => setVoiceBanner(null)} className="text-zinc-500 hover:text-zinc-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Multimodal Image Search Panel */}
        {showVisualSearch && (
          <div className="bg-[#1e2127] text-zinc-100 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>AI Product Image Search</span>
              </div>
              <button onClick={() => setShowVisualSearch(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 border border-dashed border-[#353a46] rounded-xl flex flex-col items-center justify-center text-center space-y-3 bg-[#16181d]">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {visualScanning ? (
                  <>
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                    <p className="text-xs text-blue-300">Analyzing product photo with AI vision...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-zinc-400" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white">Upload or Take a Product Photo</p>
                      <p className="text-[11px] text-zinc-400">Matches similar products and compares local seller prices</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Choose Photo
                    </button>
                  </>
                )}
                {visualResultDesc && (
                  <p className="text-xs text-blue-300 pt-1">{visualResultDesc}</p>
                )}
              </div>

              <div className="space-y-2.5">
                <p className="text-xs text-zinc-400 font-medium">Or test with a sample photo:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "50kg Fertilizer Bag", kw: "Fertilizer bag maize" },
                    { label: "Fresh Strawberries", kw: "Fresh Strawberries" },
                    { label: "Mirrorless Camera", kw: "Camera tripod" },
                    { label: "Artisan Sourdough", kw: "Sourdough bread" }
                  ].map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => triggerSampleVisualScan(item.kw)}
                      className="p-3 bg-[#242830] hover:bg-[#2d323c] border border-[#353a46] rounded-xl text-left text-xs font-semibold text-zinc-100 transition"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Marketplace Mode Tabs & Location/Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 rounded-xl">
            {[
              { id: "all", label: "All Items" },
              { id: "new", label: "Buy New" },
              { id: "farm_direct", label: "Farm Direct" },
              { id: "rent", label: "Rent" },
              { id: "resell", label: "Resell" },
              { id: "clearance", label: "Expiry & Clearance" },
              { id: "nearby", label: "Nearby Shops" }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListingFilter(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  listingFilter === tab.id
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {listingFilter === "resell" && !offlineMode && (
              <button
                type="button"
                onClick={() => setShowResellModal(true)}
                className="px-3 py-1.5 bg-[#1e2127] hover:bg-[#2a2e37] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                List Pre-Owned Item
              </button>
            )}

            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 bg-white rounded-lg text-xs font-medium text-zinc-700 outline-none"
            >
              <option value="">All Districts</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 bg-white rounded-lg text-xs font-medium text-zinc-700 outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Neighbourhood Product Availability View */}
      {listingFilter === "nearby" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900">
              Nearby Verified Shops in {filterLocation || customerLocation}
            </h3>
            <span className="text-xs text-zinc-500">Pickup ready in 15 mins or local rider delivery</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {nearbyShops.map(shop => (
              <div key={shop.traderId} className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-zinc-900">{shop.businessName}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {shop.location} · {shop.distanceKm} km away · Trust {shop.trustScore}/100
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChat(shop.traderId)}
                    className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Message Shop
                  </button>
                </div>

                <div className="divide-y divide-zinc-100">
                  {(shop.products || []).slice(0, 3).map((p: Product) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-800 truncate">{p.name}</p>
                        <p className="text-zinc-500 tabular-nums">
                          {p.stockQty || 10} in stock · Pickup Ready
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-zinc-900 tabular-nums">ZK {p.price.toFixed(0)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(p);
                            setStatusNotice(`Added "${p.name}" from ${shop.businessName} to cart.`);
                          }}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="p-16 text-center text-zinc-500 text-sm">Loading marketplace listings...</div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-zinc-200 space-y-2">
          <Store className="w-10 h-10 mx-auto text-zinc-300" />
          <p className="text-base font-semibold text-zinc-700">No matching listings found</p>
          <p className="text-xs text-zinc-500">Try clearing filters or switching to All Items.</p>
        </div>
      ) : (
        /* Product Listings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="products_grid_listings">
          {products.map((product) => {
            const isWished = wishlistIds.includes(product.id);
            const trust = getTrustForProduct(product.userId);
            const discountPct = product.originalPrice && product.originalPrice > product.price
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-zinc-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                id={`product_card_${product.id}`}
              >
                <div>
                  <div className="h-48 bg-zinc-100 relative overflow-hidden">
                    <img
                      src={resolveProductImage(product.imageUrl, product.category)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-3 right-3 bg-white/95 hover:bg-white text-zinc-600 hover:text-rose-600 p-2 rounded-full shadow-sm transition"
                      title={isWished ? "Remove from wishlist" : "Save to wishlist"}
                    >
                      <Heart className={`w-4 h-4 ${isWished ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    {/* Unboxed Clean Metadata Line */}
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                      <span className="truncate">
                        {modeLabel(product.listingType)} · {product.category} · {product.location}
                      </span>
                      <button
                        type="button"
                        onClick={() => openReviews(product)}
                        className="flex items-center gap-1 text-zinc-700 hover:text-blue-700 font-semibold shrink-0"
                        title="View reviews & AI sentiment"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="tabular-nums">{trust.avgRating}</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-zinc-900 text-base leading-snug line-clamp-2">
                        {product.name}
                      </h4>

                      <div className="flex items-baseline justify-between pt-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-extrabold text-zinc-900 font-mono tabular-nums">
                            ZK {product.price.toFixed(2)}
                            {product.listingType === "rent" ? "/day" : ""}
                          </span>
                          {discountPct > 0 && (
                            <span className="text-xs text-zinc-400 line-through font-mono tabular-nums">
                              ZK {product.originalPrice?.toFixed(0)}
                            </span>
                          )}
                        </div>
                        {discountPct > 0 && (
                          <span className="text-xs font-semibold text-blue-700 tabular-nums">
                            {discountPct}% off
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>

                    {/* Contextual Mode Details (Clean unboxed text) */}
                    <div className="text-xs text-zinc-500 space-y-1 pt-1 border-t border-zinc-100">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-800 truncate">{product.businessName}</span>
                        <button
                          type="button"
                          onClick={() => setTrustModalProfile(trust)}
                          className="flex items-center gap-1 text-blue-700 hover:underline font-semibold shrink-0"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="tabular-nums">Trust {trust.trustScore}</span>
                        </button>
                      </div>

                      {product.listingType === "farm_direct" && product.harvestDate && (
                        <p className="text-blue-700 font-medium">
                          {product.harvestDate}{product.minBulkQty ? ` · Bulk min ${product.minBulkQty}` : ""}
                        </p>
                      )}
                      {product.listingType === "clearance" && product.expiryDate && (
                        <p className="text-amber-700 font-medium">
                          {product.expiryDate} · Food-safety verified
                        </p>
                      )}
                      {product.listingType === "rent" && product.rentalDeposit && (
                        <p className="text-zinc-600">
                          Refundable deposit: ZK {product.rentalDeposit}
                        </p>
                      )}
                      {product.listingType === "resell" && product.conditionGrade && (
                        <p className="text-zinc-600">
                          Condition: {product.conditionGrade}
                        </p>
                      )}
                      {product.groupBuy?.enabled && (
                        <p className="text-blue-700 font-medium tabular-nums">
                          Group Buy ({product.groupBuy.targetBuyers}+ buyers): ZK {product.groupBuy.discountedPrice}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 pb-5 pt-3 border-t border-zinc-100 space-y-2 bg-zinc-50/50">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCompareProduct(product)}
                      className="py-2 px-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition whitespace-nowrap"
                      title="Compare seller prices & negotiate"
                    >
                      <Scale className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      Compare
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewProduct(product)}
                      className="py-2 px-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition whitespace-nowrap"
                      title="Virtual Camera Preview"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChat(product.userId)}
                      className="py-2 px-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      Chat
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(product);
                      setStatusNotice(`Added "${product.name}" to your cart.`);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {product.listingType === "rent"
                      ? `Rent — ZK ${product.price.toFixed(0)}/day`
                      : product.advanceReservation
                      ? `Reserve / Buy — ZK ${product.price.toFixed(0)}`
                      : `Add to Cart — ZK ${product.price.toFixed(0)}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {compareProduct && (
        <CompareBargainModal
          product={compareProduct}
          onClose={() => setCompareProduct(null)}
          onAddToCart={(p) => {
            onAddToCart(p);
            setStatusNotice(`Added "${p.name}" from ${p.businessName} at ZK ${p.price.toFixed(2)}.`);
          }}
          onNegotiated={(msg) => setStatusNotice(msg)}
        />
      )}

      {trustModalProfile && (
        <SellerTrustModal
          profile={trustModalProfile}
          onClose={() => setTrustModalProfile(null)}
        />
      )}

      {previewProduct && (
        <VirtualPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          onAddToCart={(p) => {
            onAddToCart(p);
            setStatusNotice(`Added "${p.name}" to cart.`);
          }}
        />
      )}

      {showResellModal && (
        <ResellItemModal
          onClose={() => setShowResellModal(false)}
          onCreated={() => {
            fetchCatalog();
            setStatusNotice("Your pre-owned item is now live on the Resell Marketplace.");
          }}
        />
      )}

      {/* Reviews & AI Sentiment Drawer */}
      {selectedProductForReviews && (
        <div className="fixed inset-0 bg-[#1e2127]/65 z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="text-base font-bold text-zinc-900 line-clamp-1">{selectedProductForReviews.name}</h3>
                <p className="text-xs text-zinc-500">Verified buyer reviews & AI sentiment consensus</p>
              </div>
              <button onClick={() => setSelectedProductForReviews(null)} className="p-1.5 text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>AI Review Summary</span>
                  </div>
                  <button
                    onClick={runAiReviewAnalysis}
                    disabled={analyzingReviews}
                    className="text-xs bg-[#1e2127] hover:bg-[#2a2e37] text-white font-semibold py-1.5 px-3 rounded-lg transition disabled:opacity-50"
                  >
                    {analyzingReviews ? "Analyzing..." : "Summarize"}
                  </button>
                </div>

                {aiReviewSummary && (
                  <div className="space-y-3 text-xs">
                    <p className="text-zinc-700 leading-relaxed">{aiReviewSummary.summary}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 bg-white border border-zinc-200 rounded-lg">
                        <p className="font-bold text-blue-700 mb-1">Highlights</p>
                        <ul className="list-disc pl-4 space-y-0.5 text-zinc-600">
                          {aiReviewSummary.pros?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                      <div className="p-2.5 bg-white border border-zinc-200 rounded-lg">
                        <p className="font-bold text-amber-700 mb-1">Watchouts</p>
                        <ul className="list-disc pl-4 space-y-0.5 text-zinc-600">
                          {aiReviewSummary.cons?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-700">Customer Reviews ({reviewsList.length})</h4>
                {reviewsList.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-6">No reviews yet. Share your experience below.</p>
                ) : (
                  reviewsList.map(rev => (
                    <div key={rev.id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900">{rev.customerName}</span>
                        <span className="text-zinc-500">
                          {rev.rating}/5 · {rev.sentiment}
                        </span>
                      </div>
                      <p className="text-zinc-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={submitReview} className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-700">Your Rating</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button" onClick={() => setNewRating(s)} className="p-0.5">
                      <Star className={`w-5 h-5 ${newRating >= s ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Write a review..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="flex-1 bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
