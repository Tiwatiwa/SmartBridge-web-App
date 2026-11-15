import { Product, OrderItem, GroupBuy, SellerTrustProfile } from "../types";

const CACHE_PRODUCTS_KEY = "smartbridge_offline_products_v1";
const CACHE_GROUPS_KEY = "smartbridge_offline_groups_v1";
const CACHE_TRUST_KEY = "smartbridge_offline_trust_v1";
const OFFLINE_ORDERS_KEY = "smartbridge_offline_order_queue_v1";
const OFFLINE_MODE_KEY = "smartbridge_force_offline_v1";
const BUDGET_KEY = "smartbridge_budget_settings_v1";

export interface OfflineQueuedOrder {
  localId: string;
  traderId: string;
  businessName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  privacyConsent: boolean;
  customerLocation: string;
  fulfillmentMode: "delivery" | "pickup";
  riderId?: string;
  createdAt: string;
}

export function getForcedOfflineMode(): boolean {
  return localStorage.getItem(OFFLINE_MODE_KEY) === "true";
}

export function setForcedOfflineMode(val: boolean) {
  localStorage.setItem(OFFLINE_MODE_KEY, val ? "true" : "false");
}

export function cacheProductsOffline(products: Product[]) {
  try {
    localStorage.setItem(CACHE_PRODUCTS_KEY, JSON.stringify({
      updatedAt: new Date().toISOString(),
      items: products
    }));
  } catch {
    // Ignore quota errors
  }
}

export function getCachedProductsOffline(): { updatedAt: string | null; items: Product[] } {
  try {
    const raw = localStorage.getItem(CACHE_PRODUCTS_KEY);
    if (!raw) return { updatedAt: null, items: [] };
    return JSON.parse(raw);
  } catch {
    return { updatedAt: null, items: [] };
  }
}

export function cacheGroupBuysOffline(groups: GroupBuy[]) {
  try {
    localStorage.setItem(CACHE_GROUPS_KEY, JSON.stringify(groups));
  } catch {
    // Ignore quota errors
  }
}

export function getCachedGroupBuysOffline(): GroupBuy[] {
  try {
    const raw = localStorage.getItem(CACHE_GROUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function cacheTrustProfilesOffline(profiles: SellerTrustProfile[]) {
  try {
    localStorage.setItem(CACHE_TRUST_KEY, JSON.stringify(profiles));
  } catch {
    // Ignore quota errors
  }
}

export function getCachedTrustProfilesOffline(): SellerTrustProfile[] {
  try {
    const raw = localStorage.getItem(CACHE_TRUST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getOfflineOrderQueue(): OfflineQueuedOrder[] {
  try {
    const raw = localStorage.getItem(OFFLINE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueOfflineOrder(order: OfflineQueuedOrder): OfflineQueuedOrder[] {
  const queue = getOfflineOrderQueue();
  const next = [order, ...queue];
  localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(next));
  return next;
}

export function removeQueuedOfflineOrder(localId: string): OfflineQueuedOrder[] {
  const queue = getOfflineOrderQueue().filter(o => o.localId !== localId);
  localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(queue));
  return queue;
}

export function getBudgetSettings(): { monthlyLimit: number; alertThresholdPct: number } {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore parse error
  }
  return { monthlyLimit: 2500, alertThresholdPct: 80 };
}

export function saveBudgetSettings(settings: { monthlyLimit: number; alertThresholdPct: number }) {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(settings));
}
