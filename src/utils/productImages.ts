import produceImg from "../assets/images/market_fresh_produce_1794759492678.jpg";
import bakeryImg from "../assets/images/artisan_sourdough_bakery_1794759492858.jpg";
import electronicsImg from "../assets/images/solar_battery_electronics_1794759493513.jpg";
import agriImg from "../assets/images/agri_fertilizer_maize_1794759494058.jpg";
import cameraImg from "../assets/images/camera_rental_gear_1794759494194.jpg";
import groceryImg from "../assets/images/clearance_grocery_basket_1794759494502.jpg";

export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "asset:produce": produceImg,
  "asset:bakery": bakeryImg,
  "asset:electronics": electronicsImg,
  "asset:agri": agriImg,
  "asset:camera": cameraImg,
  "asset:grocery": groceryImg,
  "/uploads/strawberries.jpg": produceImg,
  "/uploads/kale.jpg": produceImg,
  "/uploads/sourdough.jpg": bakeryImg,
  "/uploads/croissant.jpg": bakeryImg,
  "/uploads/repair.jpg": electronicsImg,
};

export function resolveProductImage(imageUrl?: string, category?: string): string {
  if (imageUrl && PRODUCT_IMAGE_MAP[imageUrl]) {
    return PRODUCT_IMAGE_MAP[imageUrl];
  }
  if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("data:"))) {
    return imageUrl;
  }
  const cat = (category || "").toLowerCase();
  if (cat.includes("produce") || cat.includes("farm")) return produceImg;
  if (cat.includes("bakery")) return bakeryImg;
  if (cat.includes("agri") || cat.includes("fertilizer")) return agriImg;
  if (cat.includes("rental") || cat.includes("camera")) return cameraImg;
  if (cat.includes("grocery") || cat.includes("clearance")) return groceryImg;
  return electronicsImg;
}
