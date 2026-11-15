import { useState, useEffect, useRef, FormEvent } from "react";
import { LiveStream, Product, User } from "../types";
import { apiFetch } from "../utils/api";
import { resolveProductImage } from "../utils/productImages";
import { Video, Users, Send, ShoppingCart, Share2, Radio, Plus, Check } from "lucide-react";

interface LiveSellingSectionProps {
  currentUser: User;
  onAddToCart: (product: Product) => void;
}

export default function LiveSellingSection({ currentUser, onAddToCart }: LiveSellingSectionProps) {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGoLive, setShowGoLive] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDiscount, setNewDiscount] = useState(10);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const loadStreams = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        apiFetch("/api/live-streams"),
        apiFetch("/api/products")
      ]);
      const list: LiveStream[] = sRes.streams || [];
      setStreams(list);
      setProducts(pRes.products || []);
      if (list.length > 0 && !activeStreamId) {
        setActiveStreamId(list[0].id);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStreams();
  }, []);

  useEffect(() => {
    let streamObj: MediaStream | null = null;
    if (useCamera && videoRef.current) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
        .then((media) => {
          streamObj = media;
          if (videoRef.current) videoRef.current.srcObject = media;
        })
        .catch(() => setUseCamera(false));
    }
    return () => {
      streamObj?.getTracks().forEach(t => t.stop());
    };
  }, [useCamera]);

  const activeStream = streams.find(s => s.id === activeStreamId) || streams[0] || null;
  const featuredProducts = activeStream
    ? products.filter(p => activeStream.featuredProductIds.includes(p.id) || p.userId === activeStream.traderId).slice(0, 3)
    : [];

  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeStream || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    try {
      const res = await apiFetch(`/api/live-streams/${activeStream.id}/message`, {
        method: "POST",
        body: JSON.stringify({ text })
      });
      if (res.stream) {
        setStreams(prev => prev.map(s => (s.id === activeStream.id ? res.stream : s)));
      }
    } catch {
      // ignore
    }
  };

  const handleStartLive = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const myProds = products.filter(p => p.userId === currentUser.id).map(p => p.id);
      const res = await apiFetch("/api/live-streams", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          featuredProductIds: myProds.slice(0, 3),
          liveDiscountPct: newDiscount
        })
      });
      if (res.stream) {
        setStreams(prev => [res.stream, ...prev]);
        setActiveStreamId(res.stream.id);
        setShowGoLive(false);
        setNewTitle("");
        setNewDesc("");
      }
    } catch {
      // ignore
    }
  };

  const handleShare = (stream: LiveStream) => {
    navigator.clipboard?.writeText(`Join ${stream.businessName} live on SmartBridge Market: "${stream.title}" (${stream.liveDiscountPct}% live promo!)`);
    setCopiedId(stream.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6" id="live_selling_view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Social Shopping & Live Selling</h2>
          <p className="text-sm text-zinc-600 mt-1">
            Watch live local product demonstrations, ask sellers questions in real time, and claim stream discounts.
          </p>
        </div>

        {currentUser.role === "trader" && (
          <button
            type="button"
            onClick={() => setShowGoLive(!showGoLive)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Start Live Demo
          </button>
        )}
      </div>

      {showGoLive && currentUser.role === "trader" && (
        <form onSubmit={handleStartLive} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Launch Live Product Showcase</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Stream Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Fresh Harvest Unpacking & Quality Check"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Live Promo Discount (%)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={newDiscount}
                onChange={(e) => setNewDiscount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm font-mono tabular-nums outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Stream Description</label>
            <input
              type="text"
              placeholder="Describe what you're demonstrating live..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
              <input type="checkbox" checked={useCamera} onChange={(e) => setUseCamera(e.target.checked)} className="accent-blue-600" />
              Enable device webcam preview
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowGoLive(false)} className="px-4 py-2 text-sm text-zinc-600 font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl">
                Go Live Now
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Channel selector */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {streams.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveStreamId(s.id)}
            className={`px-4 py-2.5 rounded-xl border text-left shrink-0 transition ${
              activeStream?.id === s.id
                ? "bg-[#1e2127] text-white border-[#1e2127]"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Radio className={`w-3.5 h-3.5 ${activeStream?.id === s.id ? "text-blue-400" : "text-rose-600"}`} />
              <span className="whitespace-nowrap">{s.businessName}</span>
            </div>
            <p className={`text-xs mt-0.5 truncate max-w-[220px] ${activeStream?.id === s.id ? "text-zinc-300" : "text-zinc-500"}`}>
              {s.title}
            </p>
          </button>
        ))}
      </div>

      {activeStream && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stream Video Stage & Featured Products */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-[#16181d] rounded-2xl overflow-hidden border border-[#2e333d] relative aspect-video flex flex-col justify-between">
              {useCamera && activeStream.traderId === currentUser.id ? (
                <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <img
                  src={resolveProductImage(featuredProducts[0]?.imageUrl, featuredProducts[0]?.category)}
                  alt={activeStream.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/50" />

              {/* Top Overlay */}
              <div className="relative z-10 p-5 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-rose-600 rounded-md font-semibold uppercase tracking-wider">
                    Live Stream
                  </span>
                  <span className="flex items-center gap-1.5 font-mono tabular-nums">
                    <Users className="w-3.5 h-3.5" />
                    {activeStream.viewerCount} watching
                  </span>
                  <span>{activeStream.location}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleShare(activeStream)}
                  className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg flex items-center gap-1.5 font-semibold backdrop-blur-xs transition"
                >
                  {copiedId === activeStream.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copiedId === activeStream.id ? "Link Copied" : "Share"}
                </button>
              </div>

              {/* Bottom Overlay */}
              <div className="relative z-10 p-6 text-white space-y-1.5">
                <p className="text-xs font-semibold text-blue-300">
                  {activeStream.businessName} · {activeStream.liveDiscountPct}% Live Promo Active
                </p>
                <h3 className="text-xl font-bold">{activeStream.title}</h3>
                <p className="text-sm text-zinc-200 max-w-2xl">{activeStream.description}</p>
              </div>
            </div>

            {/* Pinned Products in Stream */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-zinc-900">Featured in This Livestream</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {featuredProducts.map(prod => {
                  const discountedPrice = Number((prod.price * (1 - activeStream.liveDiscountPct / 100)).toFixed(2));
                  return (
                    <div key={prod.id} className="border border-zinc-200 rounded-xl p-3 flex flex-col justify-between space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveProductImage(prod.imageUrl, prod.category)}
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 truncate">{prod.name}</p>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-sm font-bold text-blue-700 font-mono tabular-nums">
                              ZK {discountedPrice.toFixed(0)}
                            </span>
                            <span className="text-[11px] text-zinc-400 line-through font-mono tabular-nums">
                              ZK {prod.price.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddToCart({ ...prod, price: discountedPrice })}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Buy Live
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Q&A Chat Panel */}
          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-2xl flex flex-col h-[520px] overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-zinc-900">Live Q&A</span>
              </div>
              <span className="text-xs text-zinc-500 tabular-nums">{activeStream.messages.length} comments</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeStream.messages.map(m => (
                <div key={m.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-800">{m.senderName}</span>
                    <span className="text-zinc-400 font-mono">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t border-zinc-200 flex gap-2 bg-zinc-50">
              <input
                type="text"
                placeholder="Ask the seller a live question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
