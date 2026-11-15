import { useState } from "react";
import { Order, OrderStatus } from "../types";
import {
  RotateCcw,
  Check,
  Clock,
  Sparkles,
  Truck,
  CheckCircle2,
  Package,
  ShoppingCart
} from "lucide-react";

interface PastOrdersHistoryProps {
  orders: Order[];
  loading: boolean;
  onReorder: (order: Order) => void;
  onOpenCart?: () => void;
}

type StatusFilter = "all" | "Delivered" | "active";

export default function PastOrdersHistory({
  orders,
  loading,
  onReorder,
  onOpenCart
}: PastOrdersHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reorderedOrderId, setReorderedOrderId] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "Delivered") return order.status === "Delivered";
    if (statusFilter === "active") return order.status !== "Delivered";
    return true;
  });

  const renderStatusMeta = (status: OrderStatus) => {
    switch (status) {
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Delivered
          </span>
        );
      case "Out for Delivery":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            Out for Delivery
          </span>
        );
      case "Preparing":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            Preparing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Pending
          </span>
        );
    }
  };

  const handleReorderClick = (order: Order) => {
    onReorder(order);
    setReorderedOrderId(order.id);
    setTimeout(() => {
      setReorderedOrderId((prev) => (prev === order.id ? null : prev));
    }, 2500);
  };

  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const activeCount = orders.length - deliveredCount;

  return (
    <section
      className="bg-white border border-zinc-200 rounded-2xl overflow-hidden"
      id="past_orders_history_section"
    >
      <div className="p-5 sm:p-6 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="text-base font-bold text-zinc-900">Past Orders & Quick Reorder</h3>
          </div>
          <p className="text-xs text-zinc-500">
            Review order status and add items from previous purchases straight back to your cart.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl self-start sm:self-auto">
          {[
            { id: "all", label: `All (${orders.length})` },
            { id: "Delivered", label: `Delivered (${deliveredCount})` },
            { id: "active", label: `In Progress (${activeCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as StatusFilter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-xs text-zinc-500">Loading past orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center space-y-2">
          <Package className="w-9 h-9 mx-auto text-zinc-300" />
          <p className="text-sm font-semibold text-zinc-700">
            {orders.length === 0 ? "No past orders found" : "No orders match this filter"}
          </p>
          <p className="text-xs text-zinc-500">
            {orders.length === 0
              ? "Completed and active orders will appear here for one-click reordering."
              : "Switch tabs above to view your other orders."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {filteredOrders.map((order) => {
            const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const justAdded = reorderedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="p-5 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-50/60 transition-colors"
                id={`past_order_row_${order.id}`}
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-500">
                    <span className="font-mono font-bold text-zinc-900">{order.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-zinc-800">{order.businessName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{order.paymentMethod}</span>
                    <span aria-hidden="true">·</span>
                    {renderStatusMeta(order.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-700">
                    {order.items.map((item, idx) => (
                      <span key={`${order.id}_${item.productId}_${idx}`} className="inline-flex items-center gap-1">
                        <span className="font-medium text-zinc-900">{item.productName}</span>
                        <span className="font-mono text-zinc-500 tabular-nums">×{item.quantity}</span>
                        {idx < order.items.length - 1 && (
                          <span className="text-zinc-300 pl-1" aria-hidden="true">/</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t border-zinc-100 lg:border-t-0">
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] text-zinc-500 block tabular-nums">
                      {totalUnits} {totalUnits === 1 ? "item" : "items"}
                    </span>
                    <span className="text-sm font-extrabold text-zinc-900 font-mono tabular-nums">
                      ZK {order.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {justAdded && onOpenCart && (
                      <button
                        type="button"
                        onClick={onOpenCart}
                        className="px-3 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                        View Cart
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleReorderClick(order)}
                      disabled={order.items.length === 0}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                        justAdded
                          ? "bg-[#1e2127] text-white"
                          : "bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white"
                      }`}
                    >
                      {justAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                          Added to Cart
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reorder
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
