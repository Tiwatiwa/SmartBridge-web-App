import { useState, useEffect, useRef } from "react";
import { ChatMessage, User } from "../types";
import { apiFetch } from "../utils/api";
import { MessageSquare, Send, Sparkles, Store, MapPin, Search, AlertCircle, RefreshCw } from "lucide-react";

interface ChatSectionProps {
  currentUser: User;
  preSelectedTraderId?: string | null;
}

export default function ChatSection({ currentUser, preSelectedTraderId }: ChatSectionProps) {
  const [traders, setTraders] = useState<User[]>([]);
  const [selectedTrader, setSelectedTrader] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTraders = async () => {
    try {
      const res = await apiFetch("/api/products"); // Retrieves current traders
      const uniqueTradersMap = new Map<string, User>();
      
      // Extract unique traders from product list
      res.products.forEach((p: any) => {
        if (!uniqueTradersMap.has(p.userId)) {
          uniqueTradersMap.set(p.userId, {
            id: p.userId,
            name: p.traderName,
            businessName: p.businessName,
            role: "trader",
            location: p.location
          } as User);
        }
      });

      // Default back to preseeded merchant users if feed list has no entries
      const list = Array.from(uniqueTradersMap.values());
      if (list.length === 0) {
        setTraders([
          { id: "trader_1", email: "muyembe@farm.com", name: "Muyembe Organic Farms", role: "trader", location: "Lusaka" },
          { id: "trader_2", email: "bake@shop.com", name: "Kalingalinga Bakers", role: "trader", location: "Lusaka" },
          { id: "trader_3", email: "tech@repair.com", name: "Kabwata Solar & Repair Solutions", role: "trader", location: "Kitwe" }
        ]);
      } else {
        setTraders(list);
      }
    } catch {
      // Graceful fallback
      setTraders([
        { id: "trader_1", email: "muyembe@farm.com", name: "Muyembe Organic Farms", role: "trader", location: "Lusaka" },
        { id: "trader_2", email: "bake@shop.com", name: "Kalingalinga Bakers", role: "trader", location: "Lusaka" },
        { id: "trader_3", email: "tech@repair.com", name: "Kabwata Solar & Repair Solutions", role: "trader", location: "Kitwe" }
      ]);
    }
  };

  const fetchMessages = async (traderId: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/chats/${traderId}`);
      setMessages(res.messages || []);
    } catch (err) {
      setError("Unable to sync messages list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraders();
  }, []);

  // Sync if preSelectedTraderId changes
  useEffect(() => {
    if (preSelectedTraderId && traders.length > 0) {
      const found = traders.find(t => t.id === preSelectedTraderId);
      if (found) {
        setSelectedTrader(found);
        fetchMessages(found.id);
      }
    }
  }, [preSelectedTraderId, traders]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectTrader = (t: User) => {
    setSelectedTrader(t);
    fetchMessages(t.id);
  };

  const handleSendMessage = async (customText?: string) => {
    const messageToSend = customText || text;
    if (!selectedTrader || !messageToSend.trim()) return;

    setSending(true);
    setError(null);
    if (!customText) setText(""); // Clear input

    try {
      const res = await apiFetch(`/api/chats/${selectedTrader.id}/message`, {
        method: "POST",
        body: JSON.stringify({ text: messageToSend })
      });

      // Optimistically append client message and trader chatbot response
      setMessages(prev => {
        const withClient = [...prev, res.clientMessage];
        if (res.traderResponse) {
          return [...withClient, res.traderResponse];
        }
        return withClient;
      });
    } catch (err: any) {
      setError("Message transmission error.");
    } finally {
      setSending(false);
    }
  };

  // Curated suggested questions based on merchant profiles
  const SUGGESTIONS = [
    "Is the Sourdough Country Loaf available right now?",
    "Do you have organic strawberries in stock today?",
    "How much does it cost to replace a battery?",
    "Where is your pickup store located precisely?"
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-sm" id="chat_threads_container">
      {/* Sidebar: Traders Directory */}
      <div className="w-80 border-r border-zinc-200 flex flex-col justify-start bg-zinc-50" id="chat_merchants_list">
        <div className="p-4 border-b border-zinc-200 bg-white">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Trader Contacts</p>
          <p className="text-xs text-zinc-500 mt-1">Click on any local merchant to chat about availability.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {traders.map((t) => {
            const isSelected = selectedTrader?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTrader(t)}
                className={`w-full text-left p-3.5 rounded-xl transition flex items-start gap-3 outline-none border ${
                  isSelected
                    ? "bg-white text-zinc-900 border-blue-200 shadow-sm"
                    : "border-transparent text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#1e2127] text-white flex items-center justify-center font-bold shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-800 truncate">{t.name}</p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    <span>{t.location} Area</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Room */}
      <div className="flex-1 flex flex-col justify-between bg-white relative" id="active_chat_room">
        {selectedTrader ? (
          <>
            {/* Room Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70" id="active_room_header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                  {selectedTrader.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">{selectedTrader.name}</h3>
                  <p className="text-[11px] text-blue-600 font-mono mt-0.5">
                    Trader Assistant Online
                  </p>
                </div>
              </div>

              <button
                onClick={() => fetchMessages(selectedTrader.id)}
                className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition"
                title="Sync thread"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Message Feed anchor */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" id="message_feed_list">
              {loading ? (
                <div className="p-12 text-center text-zinc-400 text-xs">
                  Syncing previous dialogue records...
                </div>
              ) : messages.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 max-w-sm mx-auto space-y-2 py-20" id="empty_room_greetings">
                  <MessageSquare className="w-10 h-10 text-zinc-300 mx-auto" />
                  <p className="font-medium text-zinc-600 text-sm">Start a Conversation</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Ask about specific product availability, delivery times, price questions, or current neighborhood pick-up schedules.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCurrentUser = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      id={`chat_msg_${msg.id}`}
                    >
                      <div className={`max-w-md rounded-2xl px-4 py-3 text-sm relative ${
                        isCurrentUser
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-zinc-100 text-zinc-800 rounded-bl-none"
                      }`}>
                        {!isCurrentUser && (
                          <p className="text-[10px] font-bold text-blue-700 tracking-wide mb-1 uppercase">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        {msg.isAiResponse && (
                          <div className="absolute -top-2.5 -right-2 border border-zinc-200 rounded-full p-1 bg-white shadow-sm flex items-center gap-0.5" title="AI Assisted availability responder">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                        )}
                        <span className="block text-[9px] text-right mt-1.5 opacity-60 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Dialogue Suggested prompts section */}
            {messages.length < 3 && (
              <div className="px-6 py-2.5 bg-zinc-50 border-t border-zinc-200 flex flex-wrap gap-2" id="chat_suggested_pills">
                {SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    disabled={sending}
                    onClick={() => handleSendMessage(sug)}
                    className="text-xs text-blue-700 bg-white hover:bg-blue-50 border border-zinc-200 hover:border-blue-300 px-3 py-1.5 rounded-full transition shadow-xs outline-none disabled:opacity-50"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input form */}
            <div className="p-4 border-t border-zinc-200 bg-white" id="chat_footer_form">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Write a message to ${selectedTrader.name}...`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={sending}
                  className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition text-sm text-zinc-800 disabled:bg-zinc-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={sending || !text.trim()}
                  className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow transition disabled:opacity-60 disabled:hover:bg-blue-600"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-400 py-20" id="chat_no_thread_fallback">
            <MessageSquare className="w-16 h-16 text-zinc-200 mb-4" />
            <h3 className="text-lg font-bold text-zinc-700">No Chat Thread Selected</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
              Select a neighborhood merchant card to inquire about product availability, local pickup, or delivery schedules.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
