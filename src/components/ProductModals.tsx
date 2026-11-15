import { useState, useEffect, useRef, FormEvent } from "react";
import { Product, SellerTrustProfile } from "../types";
import { apiFetch } from "../utils/api";
import { resolveProductImage } from "../utils/productImages";
import {
  X,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Camera,
  CheckCircle2,
  Star,
  Clock,
  Sparkles,
  Plus
} from "lucide-react";

interface CompareBargainModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onNegotiated: (msg: string) => void;
}

export function CompareBargainModal({
  product,
  onClose,
  onAddToCart,
  onNegotiated
}: CompareBargainModalProps) {
  const [offers, setOffers] = useState<any[]>([]);
  const [cheapestId, setCheapestId] = useState<string>(product.id);
  const [savings, setSavings] = useState(0);
  const [loading, setLoading] = useState(true);

  const [aiTip, setAiTip] = useState("");
  const [offerPrice, setOfferPrice] = useState(String(Math.round(product.price * 0.9)));
  const [offerNote, setOfferNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [negResult, setNegResult] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/products/${product.id}/compare`),
      apiFetch("/api/negotiations/suggest", {
        method: "POST",
        body: JSON.stringify({ productId: product.id })
      })
    ])
      .then(([cmp, sug]) => {
        setOffers(cmp.offers || [product]);
        setCheapestId(cmp.cheapestOfferId || product.id);
        setSavings(cmp.potentialSavings || 0);
        setAiTip(sug.advice || `AI suggests offering between ZK ${sug.minFair} and ZK ${sug.maxFair}.`);
        if (sug.minFair && sug.maxFair) {
          setOfferPrice(String(Math.round((sug.minFair + sug.maxFair) / 2)));
        }
      })
      .catch(() => {
        setOffers([product]);
      })
      .finally(() => setLoading(false));
  }, [product.id]);

  const handleBargainSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!offerPrice || isNaN(Number(offerPrice))) return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/negotiations", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          offerPrice: Number(offerPrice),
          message: offerNote
        })
      });
      setNegResult(res.negotiation);
      if (res.negotiation?.status === "Accepted") {
        onNegotiated(`Offer accepted! You can add "${product.name}" at ZK ${res.negotiation.offerPrice}.`);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1e2127]/65 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Smart Price Comparison & AI Bargaining</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Seller Price Comparison */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900">Compare Seller Offers ({offers.length})</h4>
              {savings > 0 && (
                <span className="text-xs font-semibold text-blue-700 tabular-nums">
                  Save up to ZK {savings.toFixed(2)} by picking the lowest offer
                </span>
              )}
            </div>

            {loading ? (
              <p className="text-xs text-zinc-500 py-4">Comparing local seller offers...</p>
            ) : (
              <div className="space-y-2.5">
                {offers.map(off => {
                  const isCheapest = off.id === cheapestId;
                  return (
                    <div
                      key={off.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCheapest ? "border-blue-500 bg-blue-50/40" : "border-zinc-200 bg-white"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-zinc-900">{off.businessName}</span>
                          {isCheapest && (
                            <span className="text-blue-700 font-bold">· Best Price</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>{off.location}</span>
                          <span>·</span>
                          <span>Trust Score: {off.trustScore || 92}/100</span>
                          {off.verifiedBusiness && (
                            <>
                              <span>·</span>
                              <span className="text-blue-700 font-medium">Verified</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-zinc-900 font-mono tabular-nums">
                          ZK {off.price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(off);
                            onClose();
                          }}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Select Offer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Bargaining Form */}
          <div className="border-t border-zinc-200 pt-5 space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-zinc-900">Negotiate Price with {product.businessName}</h4>
            </div>

            {aiTip && (
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{aiTip}</span>
              </div>
            )}

            {negResult ? (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-900">Offer Status: {negResult.status}</span>
                  <span className="font-mono font-bold tabular-nums">
                    Your Offer: ZK {negResult.offerPrice.toFixed(2)}
                  </span>
                </div>
                {negResult.status === "Accepted" && (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-xs text-blue-700 font-medium">
                      Seller accepted your price! Add to cart at the negotiated rate.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart({ ...product, price: negResult.offerPrice });
                        onClose();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                    >
                      Add at ZK {negResult.offerPrice.toFixed(0)}
                    </button>
                  </div>
                )}
                {negResult.status === "Countered" && negResult.counterPrice && (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-xs text-amber-800 font-medium">
                      Seller countered at ZK {negResult.counterPrice.toFixed(2)}.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart({ ...product, price: negResult.counterPrice });
                        onClose();
                      }}
                      className="px-4 py-2 bg-[#1e2127] hover:bg-[#2a2e37] text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                    >
                      Accept ZK {negResult.counterPrice.toFixed(0)}
                    </button>
                  </div>
                )}
                {negResult.status === "Pending" && (
                  <p className="text-xs text-zinc-600">
                    Your offer has been sent to {product.businessName}'s bargaining inbox. Track responses in Orders & Rewards.
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleBargainSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Your Offer (ZK)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm font-mono tabular-nums outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Message (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Buying 2 today"
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-[#1e2127] hover:bg-[#2a2e37] text-white text-xs font-semibold rounded-xl transition"
                  >
                    {submitting ? "Sending..." : "Send Offer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TrustModalProps {
  profile: SellerTrustProfile;
  onClose: () => void;
}

export function SellerTrustModal({ profile, onClose }: TrustModalProps) {
  return (
    <div className="fixed inset-0 bg-[#1e2127]/65 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full overflow-hidden shadow-xl">
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-zinc-900">Seller Reputation & Trust Score</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-zinc-900">{profile.businessName}</h4>
              <p className="text-xs text-zinc-500">
                {profile.location} · {profile.category} · {profile.verifiedBusiness ? "Verified Business" : "Pending Verification"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-blue-700 font-mono tabular-nums">
                {profile.trustScore}
              </span>
              <span className="text-xs text-zinc-500 block">/ 100 Trust</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-500 block">Successful Deliveries</span>
              <span className="text-base font-bold text-zinc-900 font-mono tabular-nums mt-0.5 block">
                {profile.successfulDeliveriesPct}%
              </span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-500 block">Customer Rating</span>
              <span className="text-base font-bold text-zinc-900 font-mono tabular-nums mt-0.5 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {profile.avgRating} ({profile.reviewCount})
              </span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-500 block">Avg Response Time</span>
              <span className="text-base font-bold text-zinc-900 font-mono tabular-nums mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {profile.responseTimeMins} mins
              </span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-500 block">Cancellation Rate</span>
              <span className="text-base font-bold text-zinc-900 font-mono tabular-nums mt-0.5 block">
                {profile.cancellationRatePct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VirtualPreviewModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function VirtualPreviewModal({ product, onClose, onAddToCart }: VirtualPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scale, setScale] = useState(1);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(55);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((media) => {
        stream = media;
        setCameraActive(true);
        if (videoRef.current) videoRef.current.srcObject = media;
      })
      .catch(() => setCameraActive(false));
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#1e2127]/75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-xl w-full overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-zinc-900">Virtual Product Preview — {product.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative h-80 bg-[#16181d] overflow-hidden select-none">
          {cameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-zinc-200 via-zinc-100 to-zinc-300 flex items-end justify-center p-4">
              <span className="text-[11px] text-zinc-600 bg-white/85 px-3 py-1 rounded-lg">
                Room surface preview (allow camera permission for live AR view)
              </span>
            </div>
          )}

          {/* Positioned Product Overlay */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-100"
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
              transform: `translate(-50%, -50%) scale(${scale})`
            }}
          >
            <img
              src={resolveProductImage(product.imageUrl, product.category)}
              alt={product.name}
              className="w-36 h-28 object-cover rounded-xl shadow-2xl ring-2 ring-white/80"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-zinc-600 font-medium block mb-1">Scale ({Math.round(scale * 100)}%)</label>
              <input type="range" min="0.5" max="1.6" step="0.05" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
            <div>
              <label className="text-zinc-600 font-medium block mb-1">Horizontal</label>
              <input type="range" min="20" max="80" value={posX} onChange={(e) => setPosX(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
            <div>
              <label className="text-zinc-600 font-medium block mb-1">Vertical</label>
              <input type="range" min="25" max="75" value={posY} onChange={(e) => setPosY(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <span className="text-base font-bold text-zinc-900 font-mono tabular-nums">
              ZK {product.price.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ResellItemModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function ResellItemModal({ onClose, onCreated }: ResellItemModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [conditionGrade, setConditionGrade] = useState<"Like New" | "Good" | "Fair">("Good");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !price || isNaN(Number(price))) return;
    setSaving(true);
    try {
      await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          price: Number(price),
          category,
          description,
          listingType: "resell",
          conditionGrade
        })
      });
      onCreated();
      onClose();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1e2127]/65 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-zinc-900">Resell a Pre-Owned Item</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-zinc-700 block mb-1">Item Name</label>
            <input type="text" required placeholder="e.g. Pre-owned Samsung Galaxy A14" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">Price (ZK)</label>
              <input type="number" required min={1} placeholder="1250" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">Condition</label>
              <select value={conditionGrade} onChange={e => setConditionGrade(e.target.value as any)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none">
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>
          <div>
            <label className="font-semibold text-zinc-700 block mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none">
              <option value="Electronics">Electronics</option>
              <option value="Hardware">Hardware</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Groceries">Groceries</option>
              <option value="Handicrafts">Handicrafts</option>
            </select>
          </div>
          <div>
            <label className="font-semibold text-zinc-700 block mb-1">Description</label>
            <textarea rows={2} placeholder="Condition notes and pickup details..." value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-600 font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
              {saving ? "Publishing..." : "List Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
