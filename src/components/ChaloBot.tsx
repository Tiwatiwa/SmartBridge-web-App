import { useState, useEffect, useRef } from "react";
import { Product } from "../types";
import { apiFetch } from "../utils/api";
import { getBudgetSettings } from "../utils/offline";
import { resolveProductImage } from "../utils/productImages";
import { Sparkles, X, Send, RefreshCw, ShoppingCart } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: Product[];
  createdAt: string;
}

interface ChaloBotProps {
  onAddToCart: (product: Product) => void;
}

export default function ChaloBot({ onAddToCart }: ChaloBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Muli bwanji! I am Chalo, your SmartBridge Personal Shopping Assistant. Tell me what you need and your budget (for example: 'smartphone with a good camera under K2,500' or 'cheapest fertilizer') and I will compare local sellers for you.",
      createdAt: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim()) return;
    if (!customMessage) setInput("");

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const budget = getBudgetSettings();
      const chatHistory = messages.map(m => ({ role: m.role, text: m.text }));
      const res = await apiFetch("/api/ai/support", {
        method: "POST",
        body: JSON.stringify({
          message: textToSend,
          chatHistory,
          budgetLimit: budget.monthlyLimit
        })
      });

      const assistantMsg: ChatMessage = {
        id: "msg_ai_" + Date.now(),
        role: "assistant",
        text: res.reply || "Here is what I found across local sellers.",
        products: res.recommendedProducts || [],
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: "msg_err_" + Date.now(),
          role: "assistant",
          text: "I could not reach the live assistant right now, but you can browse your cached catalog or check out normally.",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTIONS = [
    { label: "Smartphone under K2,500", prompt: "I need a smartphone with a good camera under K2,500" },
    { label: "Cheapest fertilizer bag", prompt: "Compare prices for 50kg fertilizer and show the cheapest offer" },
    { label: "Affordable groceries", prompt: "Suggest cheaper grocery or clearance alternatives under K150" }
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50" id="chalo_assistant_widget">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#1e2127] hover:bg-[#2a2e37] text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition border border-[#353a46]"
          id="chalo_launcher"
        >
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold whitespace-nowrap">Chalo Shopping AI</span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-80 sm:w-96 h-[540px] flex flex-col justify-between overflow-hidden" id="chalo_chat_container">
          <div className="bg-[#1e2127] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Chalo Shopping Assistant</h3>
                <p className="text-[11px] text-zinc-300">Price comparison & budget guide</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 text-zinc-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} space-y-1.5`}>
                <div className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-none"
                }`}>
                  {msg.text}
                </div>

                {/* Actionable Product Recommendation Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="w-full space-y-2 pt-1">
                    {msg.products.map(p => (
                      <div key={p.id} className="p-2.5 bg-white border border-zinc-200 rounded-xl flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={resolveProductImage(p.imageUrl, p.category)}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 truncate">{p.name}</p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {p.businessName} · <span className="font-mono font-bold text-blue-700 tabular-nums">ZK {p.price.toFixed(0)}</span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddToCart(p)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 shrink-0"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Comparing local sellers...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 border-t border-zinc-100 flex gap-1.5 overflow-x-auto bg-white">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug.prompt)}
                className="py-1 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[11px] font-medium shrink-0 transition"
              >
                {sug.label}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex items-center gap-2">
            <input
              type="text"
              placeholder="Describe what you need & your budget..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-600"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white p-2 rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
