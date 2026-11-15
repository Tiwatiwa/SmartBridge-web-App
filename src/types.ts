export type UserRole = "trader" | "customer";

export type ListingType = "new" | "rent" | "resell" | "farm_direct" | "clearance";

export type LocalLanguage = "en" | "bem" | "nya" | "ton" | "loz";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  location: string;
  businessName?: string;
  category?: string;
  description?: string;
  isFarmer?: boolean;
  verifiedBusiness?: boolean;
}

export interface StorageFile {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  filePath: string;
}

export interface GroupBuyOffer {
  enabled: boolean;
  targetBuyers: number;
  discountedPrice: number;
}

export interface Product {
  id: string;
  userId: string;
  traderName: string;
  businessName: string;
  location: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: string;
  imageUrl?: string;
  fileId?: string;
  listingType?: ListingType;
  compareKey?: string;
  stockQty?: number;
  pickupAvailable?: boolean;
  distanceKm?: number;
  groupBuy?: GroupBuyOffer;
  rentalRatePerDay?: number;
  rentalDeposit?: number;
  conditionGrade?: "Like New" | "Good" | "Fair";
  harvestDate?: string;
  minBulkQty?: number;
  advanceReservation?: boolean;
  expiryDate?: string;
  foodSafetyVerified?: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  traderId: string;
  businessName?: string;
  price: number;
  quantity: number;
  productImageUrl?: string;
  listingType?: ListingType;
  rentalDays?: number;
  isNegotiated?: boolean;
  isGroupBuy?: boolean;
}

export type OrderStatus = "Pending" | "Preparing" | "Out for Delivery" | "Delivered";

export interface ProductReview {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  sentiment?: "Positive" | "Negative" | "Neutral";
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerLocation: string;
  traderId: string;
  businessName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  paymentMethod: string;
  privacyConsent: boolean;
  fraudRisk?: "Low" | "Medium" | "High";
  fraudReason?: string;
  predictedDeliveryMins?: number;
  deliveryPin?: string;
  riderName?: string;
  riderVehicle?: string;
  deliveryFee?: number;
  consolidatedDelivery?: boolean;
  fulfillmentMode?: "delivery" | "pickup";
  discountApplied?: number;
  pointsEarned?: number;
  offlineQueued?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  createdAt: string;
  isAiResponse?: boolean;
}

export interface GroupBuy {
  id: string;
  productId: string;
  productName: string;
  businessName: string;
  traderId: string;
  location: string;
  imageUrl?: string;
  regularPrice: number;
  groupPrice: number;
  targetBuyers: number;
  currentBuyers: number;
  participants: {
    userId: string;
    userName: string;
    qty: number;
    joinedAt: string;
  }[];
  status: "Open" | "Unlocked" | "Completed";
  expiresAt: string;
}

export interface NegotiationOffer {
  id: string;
  productId: string;
  productName: string;
  traderId: string;
  businessName: string;
  customerId: string;
  customerName: string;
  listedPrice: number;
  offerPrice: number;
  counterPrice?: number;
  aiFairRange: string;
  message: string;
  status: "Pending" | "Accepted" | "Countered" | "Declined";
  createdAt: string;
  updatedAt: string;
}

export interface LiveStream {
  id: string;
  traderId: string;
  traderName: string;
  businessName: string;
  location: string;
  title: string;
  description: string;
  status: "Live" | "Upcoming";
  viewerCount: number;
  featuredProductIds: string[];
  liveDiscountPct: number;
  startedAt: string;
  messages: {
    id: string;
    senderName: string;
    text: string;
    createdAt: string;
  }[];
}

export interface DeliveryRider {
  id: string;
  name: string;
  vehicle: "Motorbike" | "Cargo Tricycle" | "Van";
  location: string;
  rating: number;
  etaMins: number;
  baseFee: number;
  consolidatedDiscount: number;
  available: boolean;
}

export interface SellerTrustProfile {
  traderId: string;
  businessName: string;
  location: string;
  category: string;
  verifiedBusiness: boolean;
  trustScore: number;
  successfulDeliveriesPct: number;
  avgRating: number;
  responseTimeMins: number;
  cancellationRatePct: number;
  reviewCount: number;
  isFarmer?: boolean;
}

export interface OrderRewardBreakdown {
  orderId: string;
  businessName: string;
  createdAt: string;
  totalAmount: number;
  pointsEarned: number;
  pinBonusAwarded: boolean;
  discountApplied: number;
  status: OrderStatus;
}

export interface UserRewards {
  points: number;
  tier: "Seedling" | "Connector" | "Bridge Champion";
  completedChallenges: string[];
  redeemedPoints: number;
  redeemableDiscountZk?: number;
  orderPointsTotal?: number;
  totalOrderSpend?: number;
  nextTier?: "Connector" | "Bridge Champion" | null;
  pointsToNextTier?: number;
  orderBreakdown?: OrderRewardBreakdown[];
}

export interface FraudAlert {
  id: string;
  targetType: "Order" | "Listing" | "Review";
  targetId: string;
  title: string;
  riskLevel: "Low" | "Medium" | "High";
  reason: string;
  flaggedAt: string;
  resolved: boolean;
}
