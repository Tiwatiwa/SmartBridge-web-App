import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DB_FILE = path.join(process.cwd(), "db_data.json");

const SEED_TRADERS = [
  {
    id: "trader_1",
    email: "muyembe@farm.com",
    name: "Muyembe Organic Farms",
    role: "trader",
    location: "Lusaka",
    businessName: "Muyembe Organic Farms",
    category: "Fresh Produce",
    isFarmer: true,
    verifiedBusiness: true,
    description: "Direct-from-farm organic vegetables, strawberries, and maize harvested daily in Chisamba and Chongwe."
  },
  {
    id: "trader_2",
    email: "bake@shop.com",
    name: "Kalingalinga Bakers",
    role: "trader",
    location: "Lusaka",
    businessName: "Kalingalinga Bakers",
    category: "Bakery",
    isFarmer: false,
    verifiedBusiness: true,
    description: "Fresh golden country loaves, tea scones, and clearance end-of-day pastry boxes."
  },
  {
    id: "trader_3",
    email: "tech@repair.com",
    name: "Kabwata Solar & Electronics",
    role: "trader",
    location: "Kitwe",
    businessName: "Kabwata Solar & Repair Solutions",
    category: "Hardware",
    isFarmer: false,
    verifiedBusiness: true,
    description: "Smartphones, solar power kits, battery diagnostics, and electronics rentals."
  },
  {
    id: "trader_4",
    email: "chongwe@agri.zm",
    name: "Chongwe Farmers Co-op",
    role: "trader",
    location: "Chongwe",
    businessName: "Chongwe Farmers Co-op",
    category: "Agriculture",
    isFarmer: true,
    verifiedBusiness: true,
    description: "Cooperative wholesale & group-buy agricultural inputs, D-Compound fertilizer, and harvest reservations."
  },
  {
    id: "trader_5",
    email: "lusaka@techhub.zm",
    name: "Cairo Road Mobile & Gear",
    role: "trader",
    location: "Lusaka",
    businessName: "Cairo Road Mobile & Gear",
    category: "Electronics",
    isFarmer: false,
    verifiedBusiness: true,
    description: "Budget Android smartphones, camera equipment rentals, and certified pre-owned laptops."
  },
  {
    id: "trader_6",
    email: "kamwala@freshsave.zm",
    name: "Kamwala FreshSave Market",
    role: "trader",
    location: "Lusaka",
    businessName: "Kamwala FreshSave Market",
    category: "Groceries",
    isFarmer: false,
    verifiedBusiness: true,
    description: "Everyday Zambian pantry staples and food-safety certified near-expiry clearance deals."
  }
];

const SEED_PRODUCTS = [
  {
    id: "prod_1",
    userId: "trader_1",
    traderName: "Muyembe Organic Farms",
    businessName: "Muyembe Organic Farms",
    location: "Lusaka",
    name: "Chisamba Fresh Strawberries Basket (500g)",
    price: 120,
    description: "Sweet, juicy local strawberries grown near Chisamba. Handpicked daily with zero synthetic pesticides.",
    category: "Fresh Produce",
    imageUrl: "asset:produce",
    listingType: "farm_direct",
    compareKey: "strawberries-500g",
    stockQty: 28,
    pickupAvailable: true,
    distanceKm: 3.2,
    harvestDate: "Harvested Today",
    minBulkQty: 5,
    advanceReservation: true,
    groupBuy: { enabled: true, targetBuyers: 4, discountedPrice: 95 }
  },
  {
    id: "prod_2",
    userId: "trader_1",
    traderName: "Muyembe Organic Farms",
    businessName: "Muyembe Organic Farms",
    location: "Lusaka",
    name: "Fresh Local Rape & Tomatoes Farm Bundle",
    price: 35,
    description: "Crisp mineral-rich green rape leaves paired with vine-ripened Lusaka tomatoes straight from the field.",
    category: "Fresh Produce",
    imageUrl: "asset:produce",
    listingType: "farm_direct",
    compareKey: "greens-bundle",
    stockQty: 64,
    pickupAvailable: true,
    distanceKm: 3.2,
    harvestDate: "Harvested Today",
    minBulkQty: 10,
    advanceReservation: false
  },
  {
    id: "prod_3",
    userId: "trader_2",
    traderName: "Kalingalinga Bakers",
    businessName: "Kalingalinga Bakers",
    location: "Lusaka",
    name: "Artisan Sourdough Country Loaf",
    price: 45,
    description: "36-hour slow fermented sourdough baked in our eco-fire brick oven. Crisp golden crust and soft open crumb.",
    category: "Bakery",
    imageUrl: "asset:bakery",
    listingType: "new",
    compareKey: "sourdough-loaf",
    stockQty: 18,
    pickupAvailable: true,
    distanceKm: 1.8,
    groupBuy: { enabled: true, targetBuyers: 5, discountedPrice: 36 }
  },
  {
    id: "prod_4",
    userId: "trader_2",
    traderName: "Kalingalinga Bakers",
    businessName: "Kalingalinga Bakers",
    location: "Lusaka",
    name: "Evening Bakery Surplus Scones Box (6 pcs)",
    price: 42,
    originalPrice: 80,
    description: "Freshly baked morning cardamom scones offered at 48% clearance to prevent food waste. Food-safety inspected.",
    category: "Bakery",
    imageUrl: "asset:bakery",
    listingType: "clearance",
    compareKey: "scones-box",
    stockQty: 9,
    pickupAvailable: true,
    distanceKm: 1.8,
    expiryDate: "Best within 48 hours",
    foodSafetyVerified: true
  },
  {
    id: "prod_5",
    userId: "trader_3",
    traderName: "Kabwata Solar & Electronics",
    businessName: "Kabwata Solar & Repair Solutions",
    location: "Kitwe",
    name: "Solar Inverter & Lithium Backup Kit (1000W)",
    price: 2350,
    description: "Reliable load-shedding backup power station with solar charge controller and USB-C fast charging.",
    category: "Hardware",
    imageUrl: "asset:electronics",
    listingType: "new",
    compareKey: "solar-kit-1000w",
    stockQty: 7,
    pickupAvailable: true,
    distanceKm: 4.5
  },
  {
    id: "prod_6",
    userId: "trader_4",
    traderName: "Chongwe Farmers Co-op",
    businessName: "Chongwe Farmers Co-op",
    location: "Chongwe",
    name: "Agri-Grow D-Compound Fertilizer (50kg Bag)",
    price: 580,
    description: "Co-op direct wholesale price on certified 50kg D-Compound basal fertilizer for maize and vegetable planting.",
    category: "Agriculture",
    imageUrl: "asset:agri",
    listingType: "farm_direct",
    compareKey: "fertilizer-50kg",
    stockQty: 120,
    pickupAvailable: true,
    distanceKm: 14.0,
    harvestDate: "In Depot Now",
    minBulkQty: 5,
    advanceReservation: true,
    groupBuy: { enabled: true, targetBuyers: 5, discountedPrice: 515 }
  },
  {
    id: "prod_7",
    userId: "trader_1",
    traderName: "Muyembe Organic Farms",
    businessName: "Muyembe Organic Farms",
    location: "Lusaka",
    name: "Agri-Grow D-Compound Fertilizer (50kg Bag)",
    price: 650,
    description: "50kg D-Compound fertilizer bag stocked in our Lusaka depot for same-day local neighborhood dispatch.",
    category: "Agriculture",
    imageUrl: "asset:agri",
    listingType: "new",
    compareKey: "fertilizer-50kg",
    stockQty: 34,
    pickupAvailable: true,
    distanceKm: 3.2
  },
  {
    id: "prod_8",
    userId: "trader_5",
    traderName: "Cairo Road Mobile & Gear",
    businessName: "Cairo Road Mobile & Gear",
    location: "Lusaka",
    name: "ZedPhone Spark 50MP Camera Smartphone (128GB)",
    price: 2290,
    description: "Dual-SIM 4G smartphone with 50MP AI night camera, 5000mAh battery, and 1-year local warranty.",
    category: "Electronics",
    imageUrl: "asset:electronics",
    listingType: "new",
    compareKey: "smartphone-50mp",
    stockQty: 12,
    pickupAvailable: true,
    distanceKm: 2.1,
    groupBuy: { enabled: true, targetBuyers: 3, discountedPrice: 2050 }
  },
  {
    id: "prod_9",
    userId: "trader_3",
    traderName: "Kabwata Solar & Electronics",
    businessName: "Kabwata Solar & Repair Solutions",
    location: "Lusaka",
    name: "ZedPhone Spark 50MP Camera Smartphone (128GB)",
    price: 2450,
    description: "50MP camera Android smartphone with free tempered glass screen protector and rapid charger included.",
    category: "Electronics",
    imageUrl: "asset:electronics",
    listingType: "new",
    compareKey: "smartphone-50mp",
    stockQty: 6,
    pickupAvailable: true,
    distanceKm: 3.9
  },
  {
    id: "prod_10",
    userId: "trader_5",
    traderName: "Cairo Road Mobile & Gear",
    businessName: "Cairo Road Mobile & Gear",
    location: "Lusaka",
    name: "Fujifilm X-T5 Mirrorless Camera & Tripod Kit (Rent/Day)",
    price: 185,
    description: "Rent a professional 40MP mirrorless camera with prime lens and tripod for weddings, events, or content shoots.",
    category: "Electronics",
    imageUrl: "asset:camera",
    listingType: "rent",
    compareKey: "camera-rental",
    stockQty: 4,
    pickupAvailable: true,
    distanceKm: 2.1,
    rentalRatePerDay: 185,
    rentalDeposit: 500
  },
  {
    id: "prod_11",
    userId: "trader_5",
    traderName: "Cairo Road Mobile & Gear",
    businessName: "Cairo Road Mobile & Gear",
    location: "Lusaka",
    name: "Pre-Owned Mirrorless Camera Body (Resell)",
    price: 1950,
    originalPrice: 3200,
    description: "Previously owned studio camera, tested and certified with clean sensor and two batteries.",
    category: "Electronics",
    imageUrl: "asset:camera",
    listingType: "resell",
    compareKey: "camera-resell",
    stockQty: 2,
    pickupAvailable: true,
    distanceKm: 2.1,
    conditionGrade: "Like New"
  },
  {
    id: "prod_12",
    userId: "trader_6",
    traderName: "Kamwala FreshSave Market",
    businessName: "Kamwala FreshSave Market",
    location: "Lusaka",
    name: "Golden Harvest Sunflower Oil & Beans Pantry Bundle",
    price: 145,
    originalPrice: 230,
    description: "Near-expiry surplus supermarket pack: 750ml sunflower oil, 1kg whole-grain flour, chickpeas & kidney beans.",
    category: "Groceries",
    imageUrl: "asset:grocery",
    listingType: "clearance",
    compareKey: "pantry-bundle",
    stockQty: 22,
    pickupAvailable: true,
    distanceKm: 2.6,
    expiryDate: "Best Before Next Month",
    foodSafetyVerified: true,
    groupBuy: { enabled: true, targetBuyers: 4, discountedPrice: 120 }
  },
  {
    id: "prod_13",
    userId: "trader_4",
    traderName: "Chongwe Farmers Co-op",
    businessName: "Chongwe Farmers Co-op",
    location: "Chisamba",
    name: "Premium Golden Maize Grain (50kg Sack)",
    price: 310,
    description: "Sun-dried grade-A maize kernels directly from Chongwe & Chisamba smallholders. Reserve upcoming harvest bags.",
    category: "Agriculture",
    imageUrl: "asset:agri",
    listingType: "farm_direct",
    compareKey: "maize-50kg",
    stockQty: 95,
    pickupAvailable: true,
    distanceKm: 11.4,
    harvestDate: "Harvest Ready Nov 24",
    minBulkQty: 3,
    advanceReservation: true
  }
];

const SEED_RIDERS = [
  { id: "rider_1", name: "Mwila Banda", vehicle: "Motorbike", location: "Lusaka", rating: 4.9, etaMins: 18, baseFee: 25, consolidatedDiscount: 12, available: true },
  { id: "rider_2", name: "Chansa Phiri", vehicle: "Cargo Tricycle", location: "Lusaka", rating: 4.8, etaMins: 26, baseFee: 35, consolidatedDiscount: 15, available: true },
  { id: "rider_3", name: "Mutale Zulu", vehicle: "Motorbike", location: "Kitwe", rating: 4.9, etaMins: 20, baseFee: 25, consolidatedDiscount: 10, available: true },
  { id: "rider_4", name: "Luyando Mulenga", vehicle: "Van", location: "Chongwe", rating: 4.7, etaMins: 35, baseFee: 45, consolidatedDiscount: 20, available: true },
  { id: "rider_5", name: "Kabwe Tembo", vehicle: "Motorbike", location: "Ndola", rating: 4.8, etaMins: 22, baseFee: 25, consolidatedDiscount: 10, available: true }
];

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [...SEED_TRADERS],
      products: [...SEED_PRODUCTS],
      files: [],
      orders: [],
      chats: [],
      reviews: [
        {
          id: "rev_1",
          productId: "prod_1",
          customerId: "cust_1",
          customerName: "Tiwonge Nkhoma",
          rating: 5,
          comment: "Super sweet and juicy strawberries. Freshly harvested and delivered extremely quickly within Lusaka!",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          sentiment: "Positive"
        },
        {
          id: "rev_2",
          productId: "prod_6",
          customerId: "cust_2",
          customerName: "Bwalya Mwansa",
          rating: 5,
          comment: "Saved ZK 70 per bag by buying through the Chongwe co-op group deal. Genuine D-Compound stock.",
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          sentiment: "Positive"
        },
        {
          id: "rev_3",
          productId: "prod_3",
          customerId: "cust_1",
          customerName: "Tiwonge Nkhoma",
          rating: 5,
          comment: "Unbelievable crust and soft open crumb. Best sourdough loaf in Kalingalinga!",
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          sentiment: "Positive"
        }
      ],
      wishlists: [],
      groupBuys: [
        {
          id: "gb_1",
          productId: "prod_6",
          productName: "Agri-Grow D-Compound Fertilizer (50kg Bag)",
          businessName: "Chongwe Farmers Co-op",
          traderId: "trader_4",
          location: "Chongwe",
          imageUrl: "asset:agri",
          regularPrice: 580,
          groupPrice: 515,
          targetBuyers: 5,
          currentBuyers: 3,
          participants: [
            { userId: "cust_10", userName: "Mutinta H.", qty: 2, joinedAt: new Date(Date.now() - 7200000).toISOString() },
            { userId: "cust_11", userName: "Chisomo K.", qty: 1, joinedAt: new Date(Date.now() - 5400000).toISOString() },
            { userId: "cust_12", userName: "Kaluba M.", qty: 2, joinedAt: new Date(Date.now() - 1800000).toISOString() }
          ],
          status: "Open",
          expiresAt: new Date(Date.now() + 86400000 * 2).toISOString()
        },
        {
          id: "gb_2",
          productId: "prod_12",
          productName: "Golden Harvest Sunflower Oil & Beans Pantry Bundle",
          businessName: "Kamwala FreshSave Market",
          traderId: "trader_6",
          location: "Lusaka",
          imageUrl: "asset:grocery",
          regularPrice: 145,
          groupPrice: 120,
          targetBuyers: 4,
          currentBuyers: 3,
          participants: [
            { userId: "cust_13", userName: "Natasha C.", qty: 1, joinedAt: new Date(Date.now() - 3600000).toISOString() },
            { userId: "cust_14", userName: "Thandiwe S.", qty: 2, joinedAt: new Date(Date.now() - 2400000).toISOString() },
            { userId: "cust_15", userName: "Mumba L.", qty: 1, joinedAt: new Date(Date.now() - 900000).toISOString() }
          ],
          status: "Open",
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        }
      ],
      negotiations: [],
      liveStreams: [
        {
          id: "live_1",
          traderId: "trader_1",
          traderName: "Muyembe Organic Farms",
          businessName: "Muyembe Organic Farms",
          location: "Lusaka",
          title: "Morning Harvest Walk: Chisamba Strawberries & Greens",
          description: "Watch today's fresh strawberry crates being packed in Chisamba. Ask questions live and claim 10% live-stream discount!",
          status: "Live",
          viewerCount: 47,
          featuredProductIds: ["prod_1", "prod_2"],
          liveDiscountPct: 10,
          startedAt: new Date(Date.now() - 1800000).toISOString(),
          messages: [
            { id: "lm_1", senderName: "Chileshe", text: "Are the strawberries picked this morning?", createdAt: new Date(Date.now() - 600000).toISOString() },
            { id: "lm_2", senderName: "Muyembe Organic Farms", text: "Yes! Picked at 06:00 AM today, ready for Lusaka dispatch.", createdAt: new Date(Date.now() - 480000).toISOString() }
          ]
        },
        {
          id: "live_2",
          traderId: "trader_5",
          traderName: "Cairo Road Mobile & Gear",
          businessName: "Cairo Road Mobile & Gear",
          location: "Lusaka",
          title: "Camera Test: ZedPhone Spark 50MP vs Rental Gear",
          description: "Live hands-on low-light camera test and Q&A on budget phones under K2,500 plus weekend camera rentals.",
          status: "Live",
          viewerCount: 32,
          featuredProductIds: ["prod_8", "prod_10"],
          liveDiscountPct: 5,
          startedAt: new Date(Date.now() - 900000).toISOString(),
          messages: [
            { id: "lm_3", senderName: "Bwalya", text: "Does it support MTN and Airtel dual 4G SIMs?", createdAt: new Date(Date.now() - 300000).toISOString() }
          ]
        }
      ],
      riders: [...SEED_RIDERS],
      rewards: {},
      fraudAlerts: [
        {
          id: "fraud_1",
          targetType: "Listing",
          targetId: "ext_dup_882",
          title: "Duplicate Discount Smartphone Listing Blocked",
          riskLevel: "High",
          reason: "AI detected identical serial metadata and below-cost pricing (ZK 350) from an unverified seller account. Quarantined before checkout.",
          flaggedAt: new Date(Date.now() - 7200000).toISOString(),
          resolved: false
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }

  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  let dirty = false;

  // Ensure all seeded traders exist
  for (const st of SEED_TRADERS) {
    const existing = db.users.find((u: any) => u.id === st.id);
    if (!existing) {
      db.users.push(st);
      dirty = true;
    } else if (existing.verifiedBusiness === undefined) {
      existing.verifiedBusiness = st.verifiedBusiness;
      existing.isFarmer = st.isFarmer;
      dirty = true;
    }
  }

  // Upgrade legacy image paths & merge new seeded products idempotently
  const legacyMap: Record<string, string> = {
    "/uploads/strawberries.jpg": "asset:produce",
    "/uploads/kale.jpg": "asset:produce",
    "/uploads/sourdough.jpg": "asset:bakery",
    "/uploads/croissant.jpg": "asset:bakery",
    "/uploads/repair.jpg": "asset:electronics"
  };

  for (const p of db.products) {
    if (p.imageUrl && legacyMap[p.imageUrl]) {
      p.imageUrl = legacyMap[p.imageUrl];
      dirty = true;
    }
  }

  for (const sp of SEED_PRODUCTS) {
    const existing = db.products.find((p: any) => p.id === sp.id);
    if (!existing) {
      db.products.push(sp);
      dirty = true;
    } else {
      // Backfill enriched metadata fields if missing
      if (!existing.listingType) {
        Object.assign(existing, {
          listingType: sp.listingType,
          compareKey: sp.compareKey,
          stockQty: sp.stockQty,
          pickupAvailable: sp.pickupAvailable,
          distanceKm: sp.distanceKm,
          groupBuy: sp.groupBuy,
          harvestDate: (sp as any).harvestDate,
          minBulkQty: (sp as any).minBulkQty,
          advanceReservation: (sp as any).advanceReservation,
          expiryDate: (sp as any).expiryDate,
          foodSafetyVerified: (sp as any).foodSafetyVerified,
          originalPrice: (sp as any).originalPrice
        });
        dirty = true;
      }
    }
  }

  if (!db.reviews) { db.reviews = []; dirty = true; }
  if (!db.wishlists) { db.wishlists = []; dirty = true; }
  if (!db.groupBuys) {
    db.groupBuys = [
      {
        id: "gb_1",
        productId: "prod_6",
        productName: "Agri-Grow D-Compound Fertilizer (50kg Bag)",
        businessName: "Chongwe Farmers Co-op",
        traderId: "trader_4",
        location: "Chongwe",
        imageUrl: "asset:agri",
        regularPrice: 580,
        groupPrice: 515,
        targetBuyers: 5,
        currentBuyers: 3,
        participants: [
          { userId: "cust_10", userName: "Mutinta H.", qty: 2, joinedAt: new Date(Date.now() - 7200000).toISOString() },
          { userId: "cust_11", userName: "Chisomo K.", qty: 1, joinedAt: new Date(Date.now() - 5400000).toISOString() },
          { userId: "cust_12", userName: "Kaluba M.", qty: 2, joinedAt: new Date(Date.now() - 1800000).toISOString() }
        ],
        status: "Open",
        expiresAt: new Date(Date.now() + 86400000 * 2).toISOString()
      },
      {
        id: "gb_2",
        productId: "prod_12",
        productName: "Golden Harvest Sunflower Oil & Beans Pantry Bundle",
        businessName: "Kamwala FreshSave Market",
        traderId: "trader_6",
        location: "Lusaka",
        imageUrl: "asset:grocery",
        regularPrice: 145,
        groupPrice: 120,
        targetBuyers: 4,
        currentBuyers: 3,
        participants: [
          { userId: "cust_13", userName: "Natasha C.", qty: 1, joinedAt: new Date(Date.now() - 3600000).toISOString() },
          { userId: "cust_14", userName: "Thandiwe S.", qty: 2, joinedAt: new Date(Date.now() - 2400000).toISOString() },
          { userId: "cust_15", userName: "Mumba L.", qty: 1, joinedAt: new Date(Date.now() - 900000).toISOString() }
        ],
        status: "Open",
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      }
    ];
    dirty = true;
  }
  if (!db.negotiations) { db.negotiations = []; dirty = true; }
  if (!db.liveStreams) {
    db.liveStreams = [
      {
        id: "live_1",
        traderId: "trader_1",
        traderName: "Muyembe Organic Farms",
        businessName: "Muyembe Organic Farms",
        location: "Lusaka",
        title: "Morning Harvest Walk: Chisamba Strawberries & Greens",
        description: "Watch today's fresh strawberry crates being packed in Chisamba. Ask questions live and claim 10% live-stream discount!",
        status: "Live",
        viewerCount: 47,
        featuredProductIds: ["prod_1", "prod_2"],
        liveDiscountPct: 10,
        startedAt: new Date(Date.now() - 1800000).toISOString(),
        messages: [
          { id: "lm_1", senderName: "Chileshe", text: "Are the strawberries picked this morning?", createdAt: new Date(Date.now() - 600000).toISOString() },
          { id: "lm_2", senderName: "Muyembe Organic Farms", text: "Yes! Picked at 06:00 AM today, ready for Lusaka dispatch.", createdAt: new Date(Date.now() - 480000).toISOString() }
        ]
      },
      {
        id: "live_2",
        traderId: "trader_5",
        traderName: "Cairo Road Mobile & Gear",
        businessName: "Cairo Road Mobile & Gear",
        location: "Lusaka",
        title: "Camera Test: ZedPhone Spark 50MP vs Rental Gear",
        description: "Live hands-on low-light camera test and Q&A on budget phones under K2,500 plus weekend camera rentals.",
        status: "Live",
        viewerCount: 32,
        featuredProductIds: ["prod_8", "prod_10"],
        liveDiscountPct: 5,
        startedAt: new Date(Date.now() - 900000).toISOString(),
        messages: [
          { id: "lm_3", senderName: "Bwalya", text: "Does it support MTN and Airtel dual 4G SIMs?", createdAt: new Date(Date.now() - 300000).toISOString() }
        ]
      }
    ];
    dirty = true;
  }
  if (!db.riders) { db.riders = [...SEED_RIDERS]; dirty = true; }
  if (!db.rewards) { db.rewards = {}; dirty = true; }
  if (!db.fraudAlerts) {
    db.fraudAlerts = [
      {
        id: "fraud_1",
        targetType: "Listing",
        targetId: "ext_dup_882",
        title: "Duplicate Discount Smartphone Listing Blocked",
        riskLevel: "High",
        reason: "AI detected identical serial metadata and below-cost pricing (ZK 350) from an unverified seller account. Quarantined before checkout.",
        flaggedAt: new Date(Date.now() - 7200000).toISOString(),
        resolved: false
      }
    ];
    dirty = true;
  }

  if (dirty) {
    writeDB(db);
  }
  return db;
}

function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

function extractUserFromHeader(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  const db = readDB();
  const user = db.users.find((u: any) => u.id === token || u.email === token);
  return user || null;
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
}

function computeSellerTrustProfiles(db: any) {
  const traders = db.users.filter((u: any) => u.role === "trader");
  return traders.map((t: any) => {
    const traderProducts = db.products.filter((p: any) => p.userId === t.id);
    const traderProdIds = new Set(traderProducts.map((p: any) => p.id));
    const traderReviews = db.reviews.filter((r: any) => traderProdIds.has(r.productId));
    const traderOrders = db.orders.filter((o: any) => o.traderId === t.id);

    const deliveredCount = traderOrders.filter((o: any) => o.status === "Delivered").length;
    const baseDeliveryPct = traderOrders.length > 0
      ? Math.round((deliveredCount / traderOrders.length) * 100)
      : 96;
    const successfulDeliveriesPct = Math.max(88, Math.min(100, baseDeliveryPct || 96));

    const avgRating = traderReviews.length > 0
      ? Number((traderReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / traderReviews.length).toFixed(1))
      : 4.7;

    const verifiedBusiness = t.verifiedBusiness !== false;
    const responseTimeMins = t.id === "trader_1" ? 8 : t.id === "trader_4" ? 12 : 15;
    const cancellationRatePct = t.id === "trader_1" ? 1.2 : 2.1;

    const scoreRaw =
      (avgRating / 5) * 35 +
      (successfulDeliveriesPct / 100) * 35 +
      (verifiedBusiness ? 15 : 5) +
      Math.max(0, 15 - responseTimeMins * 0.4);

    return {
      traderId: t.id,
      businessName: t.businessName || t.name,
      location: t.location,
      category: t.category || "General Store",
      verifiedBusiness,
      trustScore: Math.min(99, Math.round(scoreRaw)),
      successfulDeliveriesPct,
      avgRating,
      responseTimeMins,
      cancellationRatePct,
      reviewCount: traderReviews.length,
      isFarmer: !!t.isFarmer
    };
  });
}

function ensureUserRewards(db: any, userId: string) {
  if (!db.rewards[userId]) {
    db.rewards[userId] = {
      points: 120,
      tier: "Seedling",
      completedChallenges: [],
      redeemedPoints: 0
    };
  }
  const r = db.rewards[userId];
  r.tier = r.points >= 600 ? "Bridge Champion" : r.points >= 250 ? "Connector" : "Seedling";
  return r;
}

// ============================================================================
// 1. AUTH ENDPOINTS
// ============================================================================
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, role, location, businessName, category, description, isFarmer } = req.body;
  if (!email || !password || !name || !role || !location) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const db = readDB();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "Email already registered." });
  }

  const newUser = {
    id: req.body.uid || "user_" + Date.now(),
    email,
    name,
    role,
    location,
    businessName: role === "trader" ? (businessName || name) : undefined,
    category: role === "trader" ? (category || "General Store") : undefined,
    description: role === "trader" ? (description || "") : undefined,
    isFarmer: role === "trader" ? !!isFarmer : false,
    verifiedBusiness: role === "trader" ? true : undefined
  };

  db.users.push(newUser);
  ensureUserRewards(db, newUser.id);
  writeDB(db);

  res.json({ success: true, token: newUser.id, user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, uid } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() || (uid && u.id === uid));
  if (!user) {
    return res.status(400).json({ error: "User profile not found. Please sign up." });
  }

  res.json({ success: true, token: user.id, user });
});

app.get("/api/auth/me", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized access." });
  res.json({ user });
});

// ============================================================================
// 2. PRODUCTS, COMPARISON, NEIGHBOURHOOD AVAILABILITY & TRUST
// ============================================================================
app.get("/api/products", (req, res) => {
  const db = readDB();
  const { location, category, search, listingType } = req.query;

  let result = [...db.products];

  if (location) {
    result = result.filter(p => p.location.toLowerCase() === (location as string).toLowerCase());
  }
  if (category) {
    result = result.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
  }
  if (listingType && listingType !== "all") {
    result = result.filter(p => (p.listingType || "new") === listingType);
  }
  if (search) {
    const searchStr = (search as string).toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(searchStr) ||
      p.description.toLowerCase().includes(searchStr) ||
      p.businessName.toLowerCase().includes(searchStr) ||
      p.category.toLowerCase().includes(searchStr)
    );
  }

  res.json({ products: result });
});

app.post("/api/products", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const {
    name, price, originalPrice, description, category, imageUrl, fileId,
    listingType, stockQty, pickupAvailable, harvestDate, minBulkQty,
    advanceReservation, expiryDate, rentalRatePerDay, rentalDeposit,
    conditionGrade, groupBuy
  } = req.body;

  // Customers may list pre-owned resell items; traders can list all types
  const targetType = listingType || "new";
  if (user.role !== "trader" && targetType !== "resell") {
    return res.status(401).json({ error: "Only registered traders can create commercial listings. Customers can list pre-owned items under Resell." });
  }

  if (!name || isNaN(price) || !category) {
    return res.status(400).json({ error: "Invalid product information." });
  }

  const db = readDB();

  // Smart Fraud Detection on duplicate or suspiciously priced listings
  const duplicate = db.products.find((p: any) =>
    p.userId === user.id && p.name.toLowerCase().trim() === name.toLowerCase().trim()
  );
  if (duplicate || Number(price) <= 1) {
    db.fraudAlerts.unshift({
      id: "fraud_" + Date.now(),
      targetType: "Listing",
      targetId: user.id,
      title: duplicate ? `Duplicate Listing Detected: ${name}` : `Suspicious Below-Floor Price: ${name}`,
      riskLevel: "Medium",
      reason: duplicate
        ? `Trader ${user.businessName || user.name} attempted duplicate listing of "${name}". Flagged for review.`
        : `Price ZK ${price} is anomalously low for category ${category}. Flagged by AI Fraud Shield.`,
      flaggedAt: new Date().toISOString(),
      resolved: false
    });
  }

  const defaultImg = category.toLowerCase().includes("agri")
    ? "asset:agri"
    : category.toLowerCase().includes("bakery")
    ? "asset:bakery"
    : category.toLowerCase().includes("produce")
    ? "asset:produce"
    : category.toLowerCase().includes("groc")
    ? "asset:grocery"
    : targetType === "rent"
    ? "asset:camera"
    : "asset:electronics";

  const newProduct = {
    id: "prod_" + Date.now(),
    userId: user.id,
    traderName: user.name,
    businessName: user.businessName || user.name,
    location: user.location,
    name,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    description: description || "",
    category,
    imageUrl: imageUrl || defaultImg,
    fileId,
    listingType: targetType,
    compareKey: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32),
    stockQty: stockQty ? Number(stockQty) : 15,
    pickupAvailable: pickupAvailable !== false,
    distanceKm: 2.4,
    harvestDate,
    minBulkQty: minBulkQty ? Number(minBulkQty) : undefined,
    advanceReservation: !!advanceReservation,
    expiryDate,
    foodSafetyVerified: targetType === "clearance" ? true : undefined,
    rentalRatePerDay: rentalRatePerDay ? Number(rentalRatePerDay) : undefined,
    rentalDeposit: rentalDeposit ? Number(rentalDeposit) : undefined,
    conditionGrade,
    groupBuy: groupBuy?.enabled ? groupBuy : undefined
  };

  db.products.push(newProduct);
  writeDB(db);

  res.json({ success: true, product: newProduct });
});

app.patch("/api/products/:id", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const db = readDB();
  const productIndex = db.products.findIndex((p: any) => p.id === req.params.id && p.userId === user.id);
  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found or access denied." });
  }

  const product = db.products[productIndex];
  const { name, price, description, category, imageUrl } = req.body;
  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = Number(price);
  if (description !== undefined) product.description = description;
  if (category !== undefined) product.category = category;
  if (imageUrl !== undefined) product.imageUrl = imageUrl;

  writeDB(db);
  res.json({ success: true, product });
});

app.delete("/api/products/:id", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const db = readDB();
  const productIndex = db.products.findIndex((p: any) => p.id === req.params.id && p.userId === user.id);
  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found or access denied." });
  }

  db.products.splice(productIndex, 1);
  writeDB(db);
  res.json({ success: true });
});

// Smart Price Comparison across sellers
app.get("/api/products/:id/compare", (req, res) => {
  const db = readDB();
  const target = db.products.find((p: any) => p.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Product not found." });

  const trustProfiles = computeSellerTrustProfiles(db);

  let offers = db.products.filter((p: any) => {
    if (target.compareKey && p.compareKey && p.compareKey === target.compareKey) return true;
    const sameCategory = p.category === target.category;
    const targetWords = target.name.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const overlaps = targetWords.some((w: string) => p.name.toLowerCase().includes(w));
    return sameCategory && overlaps;
  });

  if (offers.length === 0) offers = [target];

  const sortedOffers = offers
    .map((o: any) => {
      const trust = trustProfiles.find((tp: any) => tp.traderId === o.userId);
      return {
        ...o,
        trustScore: trust?.trustScore || 88,
        verifiedBusiness: trust?.verifiedBusiness ?? true
      };
    })
    .sort((a: any, b: any) => a.price - b.price);

  const cheapestPrice = sortedOffers[0]?.price || target.price;
  const highestPrice = sortedOffers[sortedOffers.length - 1]?.price || target.price;

  res.json({
    targetProduct: target,
    offers: sortedOffers,
    cheapestOfferId: sortedOffers[0]?.id,
    potentialSavings: Number((highestPrice - cheapestPrice).toFixed(2))
  });
});

// Seller Reputation & Trust Scores
app.get("/api/sellers/trust", (req, res) => {
  const db = readDB();
  const profiles = computeSellerTrustProfiles(db);
  res.json({ profiles });
});

// Neighbourhood Product Availability
app.get("/api/neighborhood/availability", (req, res) => {
  const db = readDB();
  const location = (req.query.location as string) || "";
  const trustProfiles = computeSellerTrustProfiles(db);

  const traders = db.users.filter((u: any) =>
    u.role === "trader" && (!location || u.location.toLowerCase() === location.toLowerCase())
  );

  const shops = traders.map((t: any) => {
    const items = db.products.filter((p: any) => p.userId === t.id);
    const trust = trustProfiles.find((tp: any) => tp.traderId === t.id);
    return {
      traderId: t.id,
      businessName: t.businessName || t.name,
      location: t.location,
      category: t.category,
      isFarmer: !!t.isFarmer,
      trustScore: trust?.trustScore || 90,
      verifiedBusiness: trust?.verifiedBusiness ?? true,
      distanceKm: items[0]?.distanceKm || 2.5,
      pickupReadyMins: 15,
      products: items
    };
  });

  res.json({ shops });
});

// ============================================================================
// 3. SMART BARGAINING & PRICE NEGOTIATION
// ============================================================================
app.get("/api/negotiations", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const db = readDB();
  const list = user.role === "trader"
    ? db.negotiations.filter((n: any) => n.traderId === user.id)
    : db.negotiations.filter((n: any) => n.customerId === user.id);

  res.json({ negotiations: list.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) });
});

app.post("/api/negotiations/suggest", async (req, res) => {
  const { productId } = req.body;
  const db = readDB();
  const product = db.products.find((p: any) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found." });

  const minFair = Math.round(product.price * 0.85);
  const maxFair = Math.round(product.price * 0.94);
  let advice = `AI Fair Bargaining Range: ZK ${minFair} – ZK ${maxFair} (6%–15% below listed ZK ${product.price}).`;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Give a 1-sentence smart bargaining tip in Zambian Kwacha (ZK) for a buyer negotiating on "${product.name}" listed at ZK ${product.price} in ${product.location}. Suggest a fair offer between ZK ${minFair} and ZK ${maxFair}.`,
      });
      if (resp.text) advice = resp.text.trim();
    } catch {
      // keep fallback
    }
  }

  res.json({ minFair, maxFair, advice });
});

app.post("/api/negotiations", async (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { productId, offerPrice, message } = req.body;
  if (!productId || isNaN(offerPrice)) {
    return res.status(400).json({ error: "Product ID and valid offer price required." });
  }

  const db = readDB();
  const product = db.products.find((p: any) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found." });

  const minFair = Math.round(product.price * 0.85);
  const maxFair = Math.round(product.price * 0.95);
  const numericOffer = Number(offerPrice);

  let status: "Pending" | "Accepted" | "Countered" | "Declined" = "Pending";
  let counterPrice: number | undefined;

  // For seeded demo traders, provide smart instant seller negotiation responses
  const isSeedTrader = SEED_TRADERS.some(t => t.id === product.userId);
  if (isSeedTrader) {
    if (numericOffer >= product.price * 0.9) {
      status = "Accepted";
    } else if (numericOffer >= product.price * 0.78) {
      status = "Countered";
      counterPrice = Math.round(product.price * 0.92);
    } else {
      status = "Declined";
    }
  }

  const neg = {
    id: "neg_" + Date.now(),
    productId: product.id,
    productName: product.name,
    traderId: product.userId,
    businessName: product.businessName,
    customerId: user.id,
    customerName: user.name,
    listedPrice: product.price,
    offerPrice: numericOffer,
    counterPrice,
    aiFairRange: `ZK ${minFair} – ZK ${maxFair}`,
    message: message || `Offering ZK ${numericOffer} for ${product.name}`,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.negotiations.push(neg);
  writeDB(db);

  res.json({ success: true, negotiation: neg });
});

app.patch("/api/negotiations/:id", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { action, counterPrice } = req.body;
  const db = readDB();
  const neg = db.negotiations.find((n: any) => n.id === req.params.id);
  if (!neg) return res.status(404).json({ error: "Offer not found." });

  if (neg.traderId !== user.id && neg.customerId !== user.id) {
    return res.status(403).json({ error: "Access denied." });
  }

  if (action === "accept") {
    neg.status = "Accepted";
    if (neg.counterPrice && neg.customerId === user.id) {
      neg.offerPrice = neg.counterPrice;
    }
  } else if (action === "counter" && counterPrice) {
    neg.status = "Countered";
    neg.counterPrice = Number(counterPrice);
  } else if (action === "decline") {
    neg.status = "Declined";
  }
  neg.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, negotiation: neg });
});

// ============================================================================
// 4. COMMUNITY GROUP BUYING
// ============================================================================
app.get("/api/group-buys", (req, res) => {
  const db = readDB();
  res.json({ groupBuys: db.groupBuys || [] });
});

app.post("/api/group-buys", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { productId, targetBuyers } = req.body;
  const db = readDB();
  const product = db.products.find((p: any) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found." });

  const goal = Math.max(2, Number(targetBuyers || product.groupBuy?.targetBuyers || 4));
  const groupPrice = product.groupBuy?.discountedPrice || Math.round(product.price * 0.85);

  const newGroup = {
    id: "gb_" + Date.now(),
    productId: product.id,
    productName: product.name,
    businessName: product.businessName,
    traderId: product.userId,
    location: user.location || product.location,
    imageUrl: product.imageUrl,
    regularPrice: product.price,
    groupPrice,
    targetBuyers: goal,
    currentBuyers: 1,
    participants: [
      { userId: user.id, userName: user.name, qty: 1, joinedAt: new Date().toISOString() }
    ],
    status: "Open",
    expiresAt: new Date(Date.now() + 86400000 * 3).toISOString()
  };

  db.groupBuys.unshift(newGroup);
  writeDB(db);
  res.json({ success: true, groupBuy: newGroup });
});

app.post("/api/group-buys/:id/join", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const db = readDB();
  const gb = db.groupBuys.find((g: any) => g.id === req.params.id);
  if (!gb) return res.status(404).json({ error: "Group buy not found." });

  const already = gb.participants.find((p: any) => p.userId === user.id);
  if (!already) {
    gb.participants.push({
      userId: user.id,
      userName: user.name,
      qty: Number(req.body.qty || 1),
      joinedAt: new Date().toISOString()
    });
    gb.currentBuyers = gb.participants.length;
    if (gb.currentBuyers >= gb.targetBuyers) {
      gb.status = "Unlocked";
    }
    const rewards = ensureUserRewards(db, user.id);
    rewards.points += 25;
    writeDB(db);
  }

  res.json({ success: true, groupBuy: gb });
});

// ============================================================================
// 5. DELIVERY MATCHING, ORDERS & PIN VERIFICATION
// ============================================================================
app.get("/api/delivery/match", (req, res) => {
  const user = extractUserFromHeader(req);
  const location = (req.query.location as string) || user?.location || "Lusaka";
  const db = readDB();

  let matchedRiders = db.riders.filter((r: any) => r.location.toLowerCase() === location.toLowerCase());
  if (matchedRiders.length === 0) matchedRiders = db.riders.slice(0, 2);

  // Check if other recent orders exist in the same district to combine deliveries
  const recentNeighborhoodOrders = db.orders.filter((o: any) =>
    o.customerLocation?.toLowerCase() === location.toLowerCase() && o.status !== "Delivered"
  );
  const consolidationAvailable = recentNeighborhoodOrders.length > 0;

  res.json({
    location,
    consolidationAvailable,
    nearbyActiveDrops: recentNeighborhoodOrders.length,
    riders: matchedRiders
  });
});

app.get("/api/orders", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const db = readDB();
  const userOrders = user.role === "trader"
    ? db.orders.filter((o: any) => o.traderId === user.id)
    : db.orders.filter((o: any) => o.customerId === user.id);

  res.json({ orders: userOrders });
});

app.post("/api/orders", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user || user.role !== "customer") {
    return res.status(401).json({ error: "Unauthorized. Customers only can place orders." });
  }

  const {
    traderId, businessName, items, totalAmount, paymentMethod,
    privacyConsent, riderId, fulfillmentMode, redeemPoints
  } = req.body;

  if (!traderId || !items || items.length === 0 || isNaN(totalAmount)) {
    return res.status(400).json({ error: "Invalid order details." });
  }

  const db = readDB();
  const trader = db.users.find((u: any) => u.id === traderId);
  const resolvedBusinessName = trader?.businessName || trader?.name || businessName || "SmartBridge Local Shop";

  const rider = db.riders.find((r: any) => r.id === riderId) || db.riders[0];
  const sameHubOrders = db.orders.filter((o: any) =>
    o.customerLocation?.toLowerCase() === user.location.toLowerCase() && o.status !== "Delivered"
  );
  const consolidatedDelivery = fulfillmentMode !== "pickup" && sameHubOrders.length > 0;
  const deliveryFee = fulfillmentMode === "pickup"
    ? 0
    : Math.max(10, (rider?.baseFee || 25) - (consolidatedDelivery ? (rider?.consolidatedDiscount || 10) : 0));

  // Rewards redemption (10 points = ZK 1)
  const rewards = ensureUserRewards(db, user.id);
  let discountApplied = 0;
  if (redeemPoints && rewards.points >= 50) {
    const usable = Math.min(rewards.points, Number(redeemPoints));
    discountApplied = Math.floor(usable / 10);
    rewards.points -= usable;
    rewards.redeemedPoints += usable;
  }

  const finalTotal = Math.max(1, Number(totalAmount) + deliveryFee - discountApplied);
  const predictedDeliveryMins = fulfillmentMode === "pickup" ? 15 : (rider?.etaMins || 22);
  const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));

  // Smart Fraud Detection
  let fraudRisk: "Low" | "Medium" | "High" = "Low";
  let fraudReason = "Verified local hub transaction. Payment method and customer location history match.";

  const recentCustomerOrders = db.orders.filter((o: any) =>
    o.customerId === user.id && (Date.now() - new Date(o.createdAt).getTime()) < 60000 * 5
  );

  if (recentCustomerOrders.length >= 3) {
    fraudRisk = "High";
    fraudReason = "Rapid burst of multiple orders within 5 minutes detected. Flagged for velocity verification.";
    db.fraudAlerts.unshift({
      id: "fraud_" + Date.now(),
      targetType: "Order",
      targetId: "pending",
      title: `Velocity Anomaly: ${user.name}`,
      riskLevel: "High",
      reason: fraudReason,
      flaggedAt: new Date().toISOString(),
      resolved: false
    });
  } else if (finalTotal > 3000) {
    fraudRisk = "Medium";
    fraudReason = "High-value transaction (> ZK 3,000). Require 4-digit Delivery PIN & MoMo confirmation.";
  }

  const pointsEarned = Math.max(10, Math.round(finalTotal / 25));
  rewards.points += pointsEarned;
  rewards.tier = rewards.points >= 600 ? "Bridge Champion" : rewards.points >= 250 ? "Connector" : "Seedling";

  const newOrder = {
    id: "order_" + Date.now() + "_" + Math.floor(Math.random() * 100),
    customerId: user.id,
    customerName: user.name,
    customerLocation: user.location,
    traderId,
    businessName: resolvedBusinessName,
    items,
    totalAmount: finalTotal,
    status: "Pending",
    createdAt: new Date().toISOString(),
    paymentMethod: paymentMethod || "MTN MoMo",
    privacyConsent: !!privacyConsent,
    fraudRisk,
    fraudReason,
    predictedDeliveryMins,
    deliveryPin,
    riderName: fulfillmentMode === "pickup" ? "Customer Self-Pickup" : rider?.name,
    riderVehicle: fulfillmentMode === "pickup" ? "In-Store Collection" : rider?.vehicle,
    deliveryFee,
    consolidatedDelivery,
    fulfillmentMode: fulfillmentMode || "delivery",
    discountApplied,
    pointsEarned
  };

  db.orders.push(newOrder);
  writeDB(db);

  res.json({ success: true, order: newOrder, rewards });
});

app.patch("/api/orders/:id/status", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required." });

  const db = readDB();
  const order = db.orders.find((o: any) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (order.traderId !== user.id) {
    return res.status(403).json({ error: "Forbidden. Only the assigned trader can update order status." });
  }

  order.status = status;
  writeDB(db);
  res.json({ success: true, order });
});

app.post("/api/orders/:id/verify-pin", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { pin } = req.body;
  const db = readDB();
  const order = db.orders.find((o: any) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });

  if (order.deliveryPin && order.deliveryPin !== String(pin).trim()) {
    return res.status(400).json({ error: "Invalid 4-digit customer Delivery PIN." });
  }

  order.status = "Delivered";
  const rewards = ensureUserRewards(db, order.customerId);
  rewards.points += 15;
  rewards.tier = rewards.points >= 600 ? "Bridge Champion" : rewards.points >= 250 ? "Connector" : "Seedling";
  writeDB(db);
  res.json({ success: true, order, rewards });
});

// ============================================================================
// 6. SOCIAL SHOPPING & LIVE SELLING
// ============================================================================
app.get("/api/live-streams", (req, res) => {
  const db = readDB();
  res.json({ streams: db.liveStreams || [] });
});

app.post("/api/live-streams", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user || user.role !== "trader") {
    return res.status(401).json({ error: "Only traders can start live selling sessions." });
  }

  const { title, description, featuredProductIds, liveDiscountPct } = req.body;
  if (!title) return res.status(400).json({ error: "Stream title is required." });

  const db = readDB();
  const stream = {
    id: "live_" + Date.now(),
    traderId: user.id,
    traderName: user.name,
    businessName: user.businessName || user.name,
    location: user.location,
    title,
    description: description || "Live product demonstration & Q&A.",
    status: "Live",
    viewerCount: 18,
    featuredProductIds: featuredProductIds || [],
    liveDiscountPct: Number(liveDiscountPct || 10),
    startedAt: new Date().toISOString(),
    messages: [
      { id: "lm_" + Date.now(), senderName: user.businessName || user.name, text: "Welcome everyone! Ask anything about today's live showcase!", createdAt: new Date().toISOString() }
    ]
  };

  db.liveStreams.unshift(stream);
  writeDB(db);
  res.json({ success: true, stream });
});

app.post("/api/live-streams/:id/message", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "Message is required." });

  const db = readDB();
  const stream = db.liveStreams.find((s: any) => s.id === req.params.id);
  if (!stream) return res.status(404).json({ error: "Livestream not found." });

  const msg = {
    id: "lm_" + Date.now(),
    senderName: user.name,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };
  stream.messages.push(msg);
  stream.viewerCount += 1;
  writeDB(db);

  res.json({ success: true, message: msg, stream });
});

// ============================================================================
// 7. REWARDS, CHALLENGES & FRAUD SHIELD
// ============================================================================
app.get("/api/rewards", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const db = readDB();
  const rewards = ensureUserRewards(db, user.id);

  const userOrders = db.orders
    .filter((o: any) => o.customerId === user.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const userReviews = db.reviews.filter((r: any) => r.customerId === user.id);
  const userGroups = db.groupBuys.filter((g: any) => g.participants.some((p: any) => p.userId === user.id));

  const orderBreakdown = userOrders.map((o: any) => {
    const basePts = typeof o.pointsEarned === "number"
      ? o.pointsEarned
      : Math.max(10, Math.round(Number(o.totalAmount || 0) / 25));
    const pinBonusAwarded = o.status === "Delivered";
    return {
      orderId: o.id,
      businessName: o.businessName || "SmartBridge Local Shop",
      createdAt: o.createdAt,
      totalAmount: Number(o.totalAmount || 0),
      pointsEarned: basePts + (pinBonusAwarded ? 15 : 0),
      pinBonusAwarded,
      discountApplied: Number(o.discountApplied || 0),
      status: o.status
    };
  });

  const orderPointsTotal = orderBreakdown.reduce((sum: number, item: any) => sum + item.pointsEarned, 0);
  const totalOrderSpend = orderBreakdown.reduce((sum: number, item: any) => sum + item.totalAmount, 0);
  const nextTier = rewards.points < 250 ? "Connector" : rewards.points < 600 ? "Bridge Champion" : null;
  const pointsToNextTier = rewards.points < 250 ? 250 - rewards.points : rewards.points < 600 ? 600 - rewards.points : 0;

  const enrichedRewards = {
    ...rewards,
    redeemableDiscountZk: Math.floor(rewards.points / 10),
    orderPointsTotal,
    totalOrderSpend,
    nextTier,
    pointsToNextTier,
    orderBreakdown
  };

  const challenges = [
    {
      id: "chal_local_order",
      title: "Support Local Business",
      desc: "Place your first order from a verified SmartBridge trader or farmer",
      points: 50,
      progress: Math.min(1, userOrders.length),
      target: 1,
      claimed: rewards.completedChallenges.includes("chal_local_order")
    },
    {
      id: "chal_group_buy",
      title: "Community Bulk Buyer",
      desc: "Join or start a Community Group Buy to unlock bulk savings",
      points: 75,
      progress: Math.min(1, userGroups.length),
      target: 1,
      claimed: rewards.completedChallenges.includes("chal_group_buy")
    },
    {
      id: "chal_reviewer",
      title: "Trusted Community Voice",
      desc: "Leave an honest review on a local product",
      points: 40,
      progress: Math.min(1, userReviews.length),
      target: 1,
      claimed: rewards.completedChallenges.includes("chal_reviewer")
    }
  ];

  writeDB(db);
  res.json({ rewards: enrichedRewards, challenges });
});

app.post("/api/rewards/claim", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { challengeId, points } = req.body;
  const db = readDB();
  const rewards = ensureUserRewards(db, user.id);

  if (!rewards.completedChallenges.includes(challengeId)) {
    rewards.completedChallenges.push(challengeId);
    rewards.points += Number(points || 50);
    rewards.tier = rewards.points >= 600 ? "Bridge Champion" : rewards.points >= 250 ? "Connector" : "Seedling";
    writeDB(db);
  }

  res.json({ success: true, rewards });
});

app.get("/api/fraud/alerts", (req, res) => {
  const db = readDB();
  res.json({ alerts: db.fraudAlerts || [] });
});

app.post("/api/fraud/alerts/:id/resolve", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const db = readDB();
  const alert = db.fraudAlerts.find((a: any) => a.id === req.params.id);
  if (alert) {
    alert.resolved = true;
    writeDB(db);
  }
  res.json({ success: true });
});

// ============================================================================
// 8. FILE STORAGE & CHATS
// ============================================================================
app.get("/api/files", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const db = readDB();
  res.json({ files: db.files.filter((f: any) => f.userId === user.id) });
});

app.post("/api/files/upload", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { fileName, fileType, fileData, filePath, fileSize } = req.body;
  if (!fileName) return res.status(400).json({ error: "Missing file name parameter." });

  const fileId = "file_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  let finalPath = "";
  let finalSize = 0;

  if (filePath) {
    finalPath = filePath;
    finalSize = fileSize || 0;
  } else if (fileData) {
    const base64Data = fileData.replace(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    finalSize = buffer.length;
    const safeName = fileId + "_" + fileName.replace(/[^a-zA-Z0-9.]/g, "_");
    fs.writeFileSync(path.join(UPLOADS_DIR, safeName), buffer);
    finalPath = `/uploads/${safeName}`;
  } else {
    return res.status(400).json({ error: "Missing file data/path parameters." });
  }

  const db = readDB();
  const newFile = {
    id: fileId,
    userId: user.id,
    fileName,
    fileSize: finalSize,
    fileType: fileType || "application/octet-stream",
    uploadDate: new Date().toISOString(),
    filePath: finalPath
  };

  db.files.push(newFile);
  writeDB(db);
  res.json({ success: true, file: newFile });
});

app.delete("/api/files/:id", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const db = readDB();
  const fileIndex = db.files.findIndex((f: any) => f.id === req.params.id && f.userId === user.id);
  if (fileIndex === -1) return res.status(404).json({ error: "File not found." });

  const fileRecord = db.files[fileIndex];
  const physicalPath = path.join(UPLOADS_DIR, path.basename(fileRecord.filePath));
  if (fs.existsSync(physicalPath)) {
    try { fs.unlinkSync(physicalPath); } catch {}
  }

  db.files.splice(fileIndex, 1);
  writeDB(db);
  res.json({ success: true });
});

app.get("/api/chats/:traderId", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const db = readDB();
  const traderId = req.params.traderId;
  const messages = db.chats.filter((c: any) =>
    (c.senderId === user.id && c.receiverId === traderId) ||
    (c.senderId === traderId && c.receiverId === user.id)
  );
  res.json({ messages });
});

app.post("/api/chats/:traderId/message", async (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { text } = req.body;
  if (!text || text.trim() === "") return res.status(400).json({ error: "Message cannot be empty." });

  const traderId = req.params.traderId;
  const db = readDB();
  const trader = db.users.find((u: any) => u.id === traderId);
  const traderProducts = db.products.filter((p: any) => p.userId === traderId);

  const clientMsg = {
    id: "msg_" + Date.now(),
    senderId: user.id,
    senderName: user.name,
    receiverId: traderId,
    text,
    createdAt: new Date().toISOString()
  };

  db.chats.push(clientMsg);
  writeDB(db);

  if (trader) {
    let aiTextReply = "";
    const ai = getGeminiClient();
    if (ai) {
      try {
        const inventoryList = traderProducts.map((p: any) => `${p.name} (ZK ${p.price.toFixed(2)}) - ${p.description}`).join("\n");
        const systemPrompt = `You are "${trader.name}" running "${trader.businessName || trader.name}" in ${trader.location}, Zambia.
Inventory:\n${inventoryList || "Ask us directly for daily stock."}
Customer "${user.name}" writes: "${text}".
Reply warmly in 1-3 sentences with exact ZK pricing, stock, or pickup details.`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: text,
          config: { systemInstruction: systemPrompt }
        });
        aiTextReply = aiResponse.text?.trim() || "";
      } catch {
        // fallback below
      }
    }

    if (!aiTextReply) {
      const lowerText = text.toLowerCase();
      const shopName = trader.businessName || trader.name;
      const matched = traderProducts.filter((p: any) => lowerText.includes(p.name.toLowerCase().split(" ")[0]));
      if (matched.length > 0) {
        aiTextReply = `Yes! We have ${matched[0].name} in stock at ZK ${matched[0].price.toFixed(2)}. You can order directly, negotiate, or pick up at our ${trader.location} shop.`;
      } else if (traderProducts.length > 0) {
        aiTextReply = `Hello ${user.name}! Welcome to ${shopName} in ${trader.location}. Top items today include ${traderProducts.slice(0, 2).map((p: any) => `${p.name} (ZK ${p.price})`).join(" and ")}.`;
      } else {
        aiTextReply = `Thanks for messaging ${shopName} in ${trader.location}! How can we help with your order today?`;
      }
    }

    const aiMsg = {
      id: "msg_ai_" + Date.now(),
      senderId: traderId,
      senderName: trader.businessName || trader.name,
      receiverId: user.id,
      text: aiTextReply,
      createdAt: new Date().toISOString(),
      isAiResponse: true
    };
    db.chats.push(aiMsg);
    writeDB(db);
    return res.json({ success: true, clientMessage: clientMsg, traderResponse: aiMsg });
  }

  res.json({ success: true, clientMessage: clientMsg });
});

// ============================================================================
// 9. REVIEWS & AI ENDPOINTS (VOICE, VISUAL, SHOPPING ASSISTANT, FORECASTING)
// ============================================================================
app.get("/api/products/:productId/reviews", (req, res) => {
  const db = readDB();
  res.json({ reviews: db.reviews.filter((r: any) => r.productId === req.params.productId) });
});

app.post("/api/products/:productId/reviews", async (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { rating, comment } = req.body;
  if (!rating || !comment) return res.status(400).json({ error: "Rating and comment are required." });

  const db = readDB();
  let sentiment: "Positive" | "Neutral" | "Negative" = "Neutral";

  // Flag suspicious duplicate spam reviews
  const dupReview = db.reviews.find((r: any) => r.customerId === user.id && r.comment.toLowerCase() === comment.toLowerCase());
  if (dupReview) {
    db.fraudAlerts.unshift({
      id: "fraud_rev_" + Date.now(),
      targetType: "Review",
      targetId: req.params.productId,
      title: "Duplicate Review Pattern Flagged",
      riskLevel: "Low",
      reason: `Repeated identical review text detected from ${user.name}.`,
      flaggedAt: new Date().toISOString(),
      resolved: false
    });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Classify the sentiment of this product review with exactly one word (Positive, Neutral, or Negative): "${comment}"`,
      });
      const text = resp.text?.trim();
      if (text && ["Positive", "Neutral", "Negative"].includes(text)) {
        sentiment = text as any;
      }
    } catch {}
  } else {
    const lower = comment.toLowerCase();
    if (/(good|great|best|fresh|sweet|love|excellent|fast)/.test(lower)) sentiment = "Positive";
    else if (/(bad|poor|late|broken|expensive|hate|slow)/.test(lower)) sentiment = "Negative";
  }

  const newReview = {
    id: "rev_" + Date.now(),
    productId: req.params.productId,
    customerId: user.id,
    customerName: user.name,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString(),
    sentiment
  };

  db.reviews.push(newReview);
  const rewards = ensureUserRewards(db, user.id);
  rewards.points += 15;
  writeDB(db);
  res.json({ success: true, review: newReview });
});

app.post("/api/ai/analyze-reviews", async (req, res) => {
  const { productId } = req.body;
  const db = readDB();
  const product = db.products.find((p: any) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const prodReviews = db.reviews.filter((r: any) => r.productId === productId);
  if (prodReviews.length === 0) {
    return res.json({
      summary: "No customer reviews have been logged for this item yet.",
      pros: ["Be the first local buyer to review this listing"],
      cons: ["No drawbacks reported yet"],
      sentimentMetrics: { Positive: 0, Neutral: 0, Negative: 0 }
    });
  }

  const sentimentMetrics = { Positive: 0, Neutral: 0, Negative: 0 };
  prodReviews.forEach((r: any) => {
    if (r.sentiment === "Positive") sentimentMetrics.Positive++;
    else if (r.sentiment === "Negative") sentimentMetrics.Negative++;
    else sentimentMetrics.Neutral++;
  });

  const ai = getGeminiClient();
  if (ai) {
    try {
      const reviewsStr = prodReviews.map((r: any) => `- ${r.rating}/5: ${r.comment}`).join("\n");
      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Analyze reviews for "${product.name}" and return JSON with summary (2 sentences), pros (top 2 strings), cons (top 2 strings):\n${reviewsStr}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "pros", "cons"]
          }
        }
      });
      const data = JSON.parse(resp.text?.trim() || "{}");
      return res.json({ ...data, sentimentMetrics });
    } catch {}
  }

  res.json({
    summary: `Local buyers rate ${product.name} strongly for quality and fast district availability.`,
    pros: ["Verified local quality", "Fair neighborhood pricing"],
    cons: ["High weekend demand may limit stock"],
    sentimentMetrics
  });
});

app.get("/api/ai/recommendations", async (req, res) => {
  const user = extractUserFromHeader(req);
  const userLoc = user ? user.location : "Lusaka";
  const db = readDB();
  const availableProducts = db.products;

  const ai = getGeminiClient();
  if (ai && availableProducts.length > 0) {
    try {
      const prodList = availableProducts.map((p: any) => `ID: ${p.id}, Name: ${p.name}, Price: ZK ${p.price}, Category: ${p.category}, Type: ${p.listingType || "new"}`).join("\n");
      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Pick top 3 recommended products for a shopper in "${userLoc}", Zambia. Return JSON array of { productId, reason }.\n${prodList}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productId: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["productId", "reason"]
            }
          }
        }
      });
      const recs = JSON.parse(resp.text?.trim() || "[]");
      const enriched = recs
        .map((rec: any) => {
          const prod = availableProducts.find((p: any) => p.id === rec.productId);
          return prod ? { ...prod, aiReason: rec.reason } : null;
        })
        .filter(Boolean);
      if (enriched.length > 0) return res.json({ recommendations: enriched });
    } catch {}
  }

  const defaults = availableProducts.slice(0, 3).map((p: any, i: number) => ({
    ...p,
    aiReason: i === 0
      ? "Direct farm harvest with group-buy discount available."
      : i === 1
      ? "Lowest local price verified across neighborhood traders."
      : "High trust score seller with same-day hub dispatch."
  }));
  res.json({ recommendations: defaults });
});

// Upgraded AI Personal Shopping Assistant (natural language, budget-aware, price comparison, cheaper alternatives)
app.post("/api/ai/support", async (req, res) => {
  const user = extractUserFromHeader(req);
  const { message, chatHistory, budgetLimit, language } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const db = readDB();
  const userName = user ? user.name : "Shopper";
  const userLoc = user ? user.location : "Lusaka";
  const prodCatalog = db.products.map((p: any) =>
    `ID:${p.id} | ${p.name} | ZK ${p.price} | Seller:${p.businessName} | Loc:${p.location} | Type:${p.listingType || "new"} | Cat:${p.category} | Desc:${p.description}`
  ).join("\n");

  const ai = getGeminiClient();
  if (ai) {
    try {
      const langNote = language && language !== "en"
        ? `Respond in or include helpful phrases in ${language === "bem" ? "Bemba" : language === "nya" ? "Nyanja" : language === "ton" ? "Tonga" : "Lozi"} alongside clear English.`
        : "";
      const budgetNote = budgetLimit ? `Customer's active budget limit is ZK ${budgetLimit}. Prioritize affordable options and cheaper alternatives.` : "";

      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `User "${userName}" in ${userLoc} asks: "${message}"
Recent context: ${(chatHistory || []).slice(-4).map((h: any) => `${h.role}: ${h.text}`).join(" | ")}
${budgetNote}
${langNote}

Catalog:
${prodCatalog}

Return JSON with:
- "reply": helpful, concise 2-4 sentence shopping assistant response comparing sellers/prices or suggesting cheaper alternatives from the catalog.
- "recommendedProductIds": array of up to 3 matching product IDs from the catalog (empty array if purely a support question).
- "cheaperAlternativeId": optional ID of a more affordable alternative if relevant.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              recommendedProductIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              cheaperAlternativeId: { type: Type.STRING }
            },
            required: ["reply", "recommendedProductIds"]
          }
        }
      });

      const parsed = JSON.parse(resp.text?.trim() || "{}");
      const recommendedProducts = (parsed.recommendedProductIds || [])
        .map((id: string) => db.products.find((p: any) => p.id === id))
        .filter(Boolean);
      return res.json({
        reply: parsed.reply,
        recommendedProducts
      });
    } catch (e) {
      console.error("AI Personal Assistant error:", e);
    }
  }

  // Intelligent rule-based fallback
  const q = message.toLowerCase();
  const budgetMatch = q.match(/(?:under|below|less than|max|k|zk)\s*(\d[\d,]*)/i);
  const maxPrice = budgetMatch ? Number(budgetMatch[1].replace(/,/g, "")) : (budgetLimit || Infinity);

  let matches = db.products.filter((p: any) => p.price <= maxPrice);
  const keywordMatches = matches.filter((p: any) =>
    q.split(/\s+/).some((w: string) => w.length > 2 && (
      p.name.toLowerCase().includes(w) ||
      p.description.toLowerCase().includes(w) ||
      p.category.toLowerCase().includes(w)
    ))
  );
  if (keywordMatches.length > 0) matches = keywordMatches;
  matches = matches.sort((a: any, b: any) => a.price - b.price).slice(0, 3);

  let reply = "";
  if (matches.length > 0) {
    const best = matches[0];
    reply = `I found ${matches.length} great match(es) for you${maxPrice < Infinity ? ` under ZK ${maxPrice}` : ""}! Top value is "${best.name}" at ZK ${best.price.toFixed(2)} from ${best.businessName} (${best.location}). You can add it directly below or compare other sellers.`;
  } else if (q.includes("momo") || q.includes("airtel") || q.includes("pay")) {
    reply = "You can pay securely using MTN MoMo, Airtel Money, Card, or Cash on Delivery in your Shopping Cart, complete with 4-digit PIN delivery verification.";
  } else {
    reply = `Hello ${userName}! Tell me what you're looking for and your budget (for example: "smartphone with good camera under K2,500" or "fertilizer bag") and I'll compare sellers for you.`;
  }

  res.json({ reply, recommendedProducts: matches });
});

// Smart Semantic Search
app.get("/api/ai/smart-search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query is required" });

  const db = readDB();
  const availableProducts = db.products;
  const ai = getGeminiClient();

  if (ai && availableProducts.length > 0) {
    try {
      const prodList = availableProducts.map((p: any) => `ID: ${p.id}, Name: ${p.name}, Price: ZK ${p.price}, Desc: ${p.description}, Category: ${p.category}, Type: ${p.listingType || "new"}`).join("\n");
      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Match products to this natural-language shopping query (may include budget constraints or Zambian terms): "${q}". Return JSON array of { id, score }.\n${prodList}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                score: { type: Type.NUMBER }
              },
              required: ["id", "score"]
            }
          }
        }
      });

      const ranks = JSON.parse(resp.text?.trim() || "[]");
      const matched = ranks
        .filter((r: any) => r.score > 0.2)
        .map((r: any) => {
          const prod = availableProducts.find((p: any) => p.id === r.id);
          return prod ? { ...prod, searchScore: r.score } : null;
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.searchScore - a.searchScore);
      if (matched.length > 0) return res.json({ products: matched });
    } catch {}
  }

  const queryStr = (q as string).toLowerCase();
  const results = availableProducts.filter((p: any) =>
    p.name.toLowerCase().includes(queryStr) ||
    p.description.toLowerCase().includes(queryStr) ||
    p.category.toLowerCase().includes(queryStr) ||
    p.businessName.toLowerCase().includes(queryStr)
  );
  res.json({ products: results });
});

// Local-Language Voice Shopping (Bemba, Nyanja, Tonga, Lozi, English)
app.post("/api/ai/voice-search", async (req, res) => {
  const { transcript, language } = req.body;
  if (!transcript) return res.status(400).json({ error: "Voice transcript is required." });

  const db = readDB();
  const langNames: Record<string, string> = {
    en: "English",
    bem: "Bemba (Icibemba)",
    nya: "Nyanja (Cinyanja)",
    ton: "Tonga (Chitonga)",
    loz: "Lozi (Silozi)"
  };
  const langLabel = langNames[language || "en"] || "English";

  const ai = getGeminiClient();
  if (ai && db.products.length > 0) {
    try {
      const prodList = db.products.map((p: any) => `ID: ${p.id} | ${p.name} | ZK ${p.price} | Cat: ${p.category} | Desc: ${p.description}`).join("\n");
      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `A Zambian shopper spoke in ${langLabel}: "${transcript}".
Translate/understand their request (e.g., Bemba "feteleza/umupunga/ubunga/ifisabo/foni", Nyanja "chimanga/feteleza/masamba/mkate/foni", Tonga "mapopwe/mubisi/foni", Lozi "mbonyi/feteleza/buhobe"), match relevant products from the catalog, and return JSON:
- "interpretedIntent": short English summary of what the user asked for
- "localizedReply": friendly 1-2 sentence confirmation in ${langLabel}
- "matchedProductIds": array of matching product IDs`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interpretedIntent: { type: Type.STRING },
              localizedReply: { type: Type.STRING },
              matchedProductIds: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["interpretedIntent", "localizedReply", "matchedProductIds"]
          }
        }
      });
      const parsed = JSON.parse(resp.text?.trim() || "{}");
      const products = (parsed.matchedProductIds || [])
        .map((id: string) => db.products.find((p: any) => p.id === id))
        .filter(Boolean);
      return res.json({
        interpretedIntent: parsed.interpretedIntent,
        localizedReply: parsed.localizedReply,
        products: products.length > 0 ? products : db.products.slice(0, 3)
      });
    } catch (e) {
      console.error("Voice search AI error:", e);
    }
  }

  // Zambian multilingual local dictionary fallback
  const lower = transcript.toLowerCase();
  let matched = db.products.filter((p: any) =>
    lower.includes("feteleza") || lower.includes("fertiliz") ? p.category === "Agriculture" :
    lower.includes("chimanga") || lower.includes("mapopwe") || lower.includes("mbonyi") || lower.includes("maize") ? p.name.toLowerCase().includes("maize") || p.category === "Agriculture" :
    lower.includes("masamba") || lower.includes("chibwabwa") || lower.includes("strawberr") || lower.includes("tomato") || lower.includes("greens") ? p.category === "Fresh Produce" :
    lower.includes("mkate") || lower.includes("buhobe") || lower.includes("bread") || lower.includes("scone") ? p.category === "Bakery" :
    lower.includes("foni") || lower.includes("phone") || lower.includes("camera") || lower.includes("solar") ? (p.category === "Electronics" || p.category === "Hardware") :
    lower.includes("mafuta") || lower.includes("oil") || lower.includes("beans") ? p.category === "Groceries" :
    p.name.toLowerCase().includes(lower)
  );
  if (matched.length === 0) matched = db.products.slice(0, 3);

  const greetingMap: Record<string, string> = {
    bem: `Natotela! Twasanga ifintu ${matched.length} ifyo mulefwaya pa SmartBridge.`,
    nya: `Zikomo! Tapeza zinthu ${matched.length} zomwe mukufuna pa SmartBridge.`,
    ton: `Twalumba! Twajana zintu ${matched.length} nzyomuyanda aa SmartBridge.`,
    loz: `Luitumezi! Lufumani lika ze ${matched.length} ze mubata fa SmartBridge.`,
    en: `Found ${matched.length} matching products on SmartBridge.`
  };

  res.json({
    interpretedIntent: `Voice query in ${langLabel}: "${transcript}"`,
    localizedReply: greetingMap[language || "en"] || greetingMap.en,
    products: matched
  });
});

// Multimodal AI Product Image Search
app.post("/api/ai/visual-search", async (req, res) => {
  const { sampleImageKeyword, imageBase64, mimeType } = req.body;
  if (!sampleImageKeyword && !imageBase64) {
    return res.status(400).json({ error: "Please upload an image or pick a sample snapshot." });
  }

  const db = readDB();
  const availableProducts = db.products;
  const ai = getGeminiClient();

  if (ai && imageBase64) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      const prodList = availableProducts.map((p: any) => `ID: ${p.id} | ${p.name} | ZK ${p.price} | Cat: ${p.category} | Desc: ${p.description}`).join("\n");
      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType || "image/jpeg", data: cleanBase64 } },
            {
              text: `Identify the product in this photograph and match it to the closest products in this SmartBridge Market catalog. Return JSON with "detectedItem" (string), "description" (1-2 sentence visual match explanation), and "matchedProductIds" (array of IDs).\nCatalog:\n${prodList}`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedItem: { type: Type.STRING },
              description: { type: Type.STRING },
              matchedProductIds: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["detectedItem", "description", "matchedProductIds"]
          }
        }
      });
      const parsed = JSON.parse(resp.text?.trim() || "{}");
      const matches = (parsed.matchedProductIds || [])
        .map((id: string) => availableProducts.find((p: any) => p.id === id))
        .filter(Boolean);
      return res.json({
        detectedItem: parsed.detectedItem,
        description: parsed.description,
        matches: matches.length > 0 ? matches : availableProducts.slice(0, 3)
      });
    } catch (e) {
      console.error("Multimodal visual search error:", e);
    }
  }

  const lower = (sampleImageKeyword || "").toLowerCase();
  let matches: any[] = [];
  if (lower.includes("strawberr") || lower.includes("fruit") || lower.includes("green") || lower.includes("vegetable")) {
    matches = availableProducts.filter((p: any) => p.category === "Fresh Produce");
  } else if (lower.includes("bread") || lower.includes("sourdough") || lower.includes("scone")) {
    matches = availableProducts.filter((p: any) => p.category === "Bakery");
  } else if (lower.includes("fertiliz") || lower.includes("maize") || lower.includes("bag")) {
    matches = availableProducts.filter((p: any) => p.category === "Agriculture");
  } else if (lower.includes("camera") || lower.includes("phone") || lower.includes("solar") || lower.includes("battery")) {
    matches = availableProducts.filter((p: any) => p.category === "Electronics" || p.category === "Hardware");
  } else {
    matches = availableProducts.slice(0, 3);
  }

  res.json({
    detectedItem: sampleImageKeyword || "Uploaded Product Photo",
    description: `Visual match complete for "${sampleImageKeyword || "uploaded item"}". Showing ${matches.length} comparable seller offers on SmartBridge.`,
    matches
  });
});

// Price Optimizer
app.post("/api/ai/optimize-price", async (req, res) => {
  const { name, currentPrice, category, description } = req.body;
  if (!name || !currentPrice) return res.status(400).json({ error: "Product name and price are required." });

  const ai = getGeminiClient();
  if (ai) {
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Analyze pricing for "${name}" in Zambia (current ZK ${currentPrice}, category ${category}, ${description}). Return JSON { recommendedPrice, analysis, percentageChange }.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedPrice: { type: Type.NUMBER },
              analysis: { type: Type.STRING },
              percentageChange: { type: Type.STRING }
            },
            required: ["recommendedPrice", "analysis", "percentageChange"]
          }
        }
      });
      return res.json(JSON.parse(resp.text?.trim() || "{}"));
    } catch {}
  }

  const recommendedPrice = Number((Number(currentPrice) * 0.96).toFixed(2));
  res.json({
    recommendedPrice,
    percentageChange: "-4.0%",
    analysis: `Lowering price by 4% positions your listing as the most competitive offer in your district while preserving strong group-buy volume.`
  });
});

// AI Image Enhancement (maps to clean local generated studio assets — zero external URLs)
app.post("/api/ai/enhance-image", (req, res) => {
  const { productId } = req.body;
  const db = readDB();
  const product = db.products.find((p: any) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const cat = (product.category || "").toLowerCase();
  const enhanced = cat.includes("produce") ? "asset:produce"
    : cat.includes("bakery") ? "asset:bakery"
    : cat.includes("agri") ? "asset:agri"
    : cat.includes("groc") ? "asset:grocery"
    : product.listingType === "rent" ? "asset:camera"
    : "asset:electronics";

  product.imageUrl = enhanced;
  writeDB(db);
  res.json({ success: true, imageUrl: enhanced });
});

app.post("/api/ai/marketing-campaign", async (req, res) => {
  const { name, category, description, platform } = req.body;
  if (!name) return res.status(400).json({ error: "Product name is required" });

  const ai = getGeminiClient();
  if (ai) {
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Write a crisp ${platform || "WhatsApp"} promo post for "${name}" (${category}: ${description}) for Zambian shoppers on SmartBridge Market.`
      });
      return res.json({ campaign: resp.text?.trim() });
    } catch {}
  }

  res.json({
    campaign: `Fresh on SmartBridge Market: ${name} (${category})! Order with MTN MoMo or Airtel Money, join a group buy for extra savings, or pick up in your neighborhood today.`
  });
});

app.post("/api/ai/generate-description", async (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: "Product name is required" });

  const ai = getGeminiClient();
  if (ai) {
    try {
      const resp = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Write a clear 2-sentence product listing description for "${name}" in category "${category}" on a Zambian digital marketplace.`
      });
      return res.json({ description: resp.text?.trim() });
    } catch {}
  }

  res.json({
    description: `Quality ${name} offered by a verified SmartBridge local merchant under ${category}. Available for same-day district delivery or neighborhood pickup.`
  });
});

// AI Demand Forecasting for Sellers (Seasonal & Sector Intelligence)
app.get("/api/ai/inventory-prediction", async (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user || user.role !== "trader") {
    return res.status(401).json({ error: "Unauthorized. For traders only." });
  }

  const db = readDB();
  const traderProducts = db.products.filter((p: any) => p.userId === user.id);
  const seasonalSignals = [
    { season: "Planting Season Window", category: "Agriculture", insight: "Fertilizer & maize seed demand projected +42% over the next 3 weeks in Lusaka & Chongwe." },
    { season: "School Reopening Prep", category: "General", insight: "Electronics, school essentials & breakfast bakery items surge 28% ahead of term opening." },
    { season: "Poultry & Dry Feed Cycle", category: "Fresh Produce", insight: "High poultry feed & fresh leafy produce turnover expected across urban markets." }
  ];

  const predictions = traderProducts.map((p: any) => {
    const currentStock = p.stockQty ?? 12;
    const dailyVelocity = p.category === "Fresh Produce" || p.category === "Bakery" ? 4.5 : 2.1;
    const daysOfStock = Math.max(1, Math.ceil(currentStock / dailyVelocity));
    const recommendedReorderQty = Math.ceil(dailyVelocity * 14);
    const seasonalReason = p.category === "Agriculture"
      ? "Pre-planting demand surge (+42%)"
      : p.category === "Electronics" || p.category === "Hardware"
      ? "Power backup & term demand (+28%)"
      : "Weekend neighborhood spike (+22%)";

    return {
      productId: p.id,
      productName: p.name,
      stockRemaining: currentStock,
      daysOfStock,
      demandScore: seasonalReason,
      recommendedRestockDate: new Date(Date.now() + daysOfStock * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      recommendedReorderQty,
      alert: daysOfStock <= 4 ? "Restock Urgent" : "Adequate Stock"
    };
  });

  res.json({ predictions, seasonalSignals });
});

// Wishlists
app.get("/api/wishlist", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = readDB();
  const list = db.wishlists.filter((w: any) => w.customerId === user.id);
  const products = list.map((w: any) => {
    const prod = db.products.find((p: any) => p.id === w.productId);
    return prod ? { ...prod, wishlistId: w.id } : null;
  }).filter(Boolean);

  res.json({ wishlist: products });
});

app.post("/api/wishlist", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: "productId is required" });

  const db = readDB();
  const exists = db.wishlists.find((w: any) => w.customerId === user.id && w.productId === productId);
  if (exists) return res.json({ success: true, item: exists });

  const newItem = { id: "wish_" + Date.now(), customerId: user.id, productId };
  db.wishlists.push(newItem);
  writeDB(db);
  res.json({ success: true, item: newItem });
});

app.delete("/api/wishlist/:productId", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = readDB();
  const idx = db.wishlists.findIndex((w: any) => w.customerId === user.id && w.productId === req.params.productId);
  if (idx !== -1) {
    db.wishlists.splice(idx, 1);
    writeDB(db);
  }
  res.json({ success: true });
});

app.get("/api/ai/wishlist-alerts", (req, res) => {
  const user = extractUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = readDB();
  const list = db.wishlists.filter((w: any) => w.customerId === user.id);
  const products = list.map((w: any) => db.products.find((p: any) => p.id === w.productId)).filter(Boolean);

  const alerts = products.map((p: any, idx: number) => ({
    id: "alert_" + idx + "_" + Date.now(),
    productId: p.id,
    productName: p.name,
    message: p.groupBuy?.enabled
      ? `Group discount open on "${p.name}": ZK ${p.groupBuy.discountedPrice} (save ZK ${(p.price - p.groupBuy.discountedPrice).toFixed(0)}).`
      : `Price watch active on "${p.name}" at ZK ${p.price.toFixed(2)} (${p.stockQty || 10} left in ${p.location}).`,
    createdAt: new Date(Date.now() - 3600000 * idx).toISOString()
  }));

  res.json({ alerts });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartBridge server is running on http://localhost:${PORT}`);
  });
}

startServer();
