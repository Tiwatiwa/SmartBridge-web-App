import React, { useState } from "react";
import { User, UserRole } from "../types";
import { apiFetch, saveSession } from "../utils/api";
import { MapPin, Store, User as UserIcon, ChevronRight, Eye, EyeOff, ShoppingBag } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../utils/firebase";
import loginHeroImg from "../assets/images/login_navy_purple_commerce_1794765607914.jpg";

interface LoginProps {
  onSuccess: (user: User) => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("customer");

  const [location, setLocation] = useState("Lusaka");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("Fresh Produce");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handlePasswordReset = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your email address above first so we can send a reset link.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(`Password reset link sent to ${email.trim()}.`);
    } catch {
      setError("Could not send password reset email. Check the address and try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const fbCred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = fbCred.user;

        const payload = {
          email,
          password,
          uid: fbUser.uid,
          name,
          role,
          location,
          businessName: role === "trader" ? businessName || name : undefined,
          category: role === "trader" ? category : undefined,
          description: role === "trader" ? description : undefined
        };
        const res = await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        saveSession(res.token, res.user);
        onSuccess(res.user);
      } else {
        const fbCred = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = fbCred.user;

        const res = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password, uid: fbUser.uid })
        });
        saveSession(res.token, res.user);
        onSuccess(res.user);
      }
    } catch (err: any) {
      let friendlyError = err.message || "An unexpected error occurred during sign in.";
      if (err.code === "auth/email-already-in-use") {
        friendlyError = "This email is already in use by another account.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        friendlyError = "Incorrect email address or password.";
      } else if (err.code === "auth/user-not-found") {
        friendlyError = "No registered user found with this email.";
      } else if (err.code === "auth/weak-password") {
        friendlyError = "The password is too weak. Must be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        friendlyError = "Please enter a valid email address.";
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const LOCATIONS = ["Lusaka", "Kitwe", "Ndola", "Chisamba", "Chongwe", "Kalingalinga", "Kabwata"];
  const CATEGORIES = ["Fresh Produce", "Bakery", "Hardware", "Handicrafts", "Beauty", "Tailoring", "Consultancy"];

  return (
    <div
      className="min-h-screen w-full flex flex-col md:flex-row bg-[#eef0f8] overflow-x-hidden"
      id="login_container"
    >
      {/* Left Side: Brand Header & Interactive Login/SignUp Form */}
      <div
        className="w-full md:w-[46%] lg:w-[44%] min-h-screen flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-gradient-to-b from-[#f3f4fb] to-[#e6e9f7] border-r border-indigo-200/70 z-10"
        id="login_form_area"
      >
        {/* Top Left Designer App Branding */}
        <div className="flex items-center gap-3.5" id="login_brand_logo">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#6d28d9] flex items-center justify-center shadow-md shrink-0">
            <svg
              className="w-7 h-7 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 20L12 4l9 16" />
              <line x1="6" y1="15" x2="18" y2="15" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black tracking-tight text-[#0f172a] uppercase leading-none">
              SmartBridge
            </span>
            <p className="text-[11px] tracking-[0.22em] text-[#5b21b6] font-bold uppercase mt-1">
              SmartBridge Market
            </p>
          </div>
        </div>

        {/* Center Login Card */}
        <div className="my-auto py-6 flex items-center justify-center">
          <div
            className="w-full max-w-md bg-white p-7 sm:p-8 rounded-3xl shadow-xl shadow-indigo-950/10 border border-indigo-100 max-h-[82vh] overflow-y-auto"
            id="login_card"
          >
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
                {isSignUp ? "Create Account" : "Sign In"}
              </h2>
              <p className="text-xs text-slate-500 mt-1.5">
                {isSignUp
                  ? "Join buyers, sellers, and farmers across Zambia"
                  : "Access your marketplace, mobile money checkout & rewards"}
              </p>
            </div>

            {error && (
              <div
                className="p-3.5 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl text-center"
                id="login_error"
              >
                {error}
              </div>
            )}
            {notice && (
              <div
                className="p-3.5 mb-4 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium rounded-xl text-center"
                id="login_notice"
              >
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6d28d9] focus:border-transparent focus:bg-white outline-none text-slate-900 placeholder-slate-400 transition text-sm"
                  />
                </div>
              )}

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6d28d9] focus:border-transparent focus:bg-white outline-none text-slate-900 placeholder-slate-400 transition text-sm"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6d28d9] focus:border-transparent focus:bg-white outline-none text-slate-900 placeholder-slate-400 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1e1b4b] transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {isSignUp && (
                <>
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-slate-700 block text-center">
                      I want to join as a:
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("customer")}
                        className={`p-3 border rounded-xl flex items-center justify-center gap-2 transition font-semibold text-sm ${
                          role === "customer"
                            ? "border-[#6d28d9] bg-purple-50 text-[#1e1b4b] ring-2 ring-purple-500/20"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <UserIcon className="w-4 h-4" />
                        Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("trader")}
                        className={`p-3 border rounded-xl flex items-center justify-center gap-2 transition font-semibold text-sm ${
                          role === "trader"
                            ? "border-[#6d28d9] bg-purple-50 text-[#1e1b4b] ring-2 ring-purple-500/20"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        Local Trader
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6d28d9] focus:bg-white outline-none text-slate-900 transition appearance-none text-sm"
                    >
                      {LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc} Hub Area
                        </option>
                      ))}
                    </select>
                  </div>

                  {role === "trader" && (
                    <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                      <p className="text-[11px] font-bold text-[#312e81] uppercase tracking-wider text-center">
                        Local Shop Profile
                      </p>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Store or Brand Name"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6d28d9] outline-none text-slate-800 text-sm transition"
                      />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6d28d9] outline-none text-slate-800 text-sm transition"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat} Category
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your shop or products..."
                        rows={2}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6d28d9] outline-none text-slate-800 text-sm transition resize-none"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#0f172a] via-[#312e81] to-[#7c3aed] hover:from-[#1e1b4b] hover:to-[#6d28d9] text-white rounded-xl font-bold tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20 active:scale-[0.99] disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                >
                  {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-col items-center gap-2.5">
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-slate-500 hover:text-[#312e81] text-xs font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setNotice(null);
                }}
                className="text-[#5b21b6] font-semibold hover:underline text-sm focus:outline-none"
              >
                {isSignUp ? "Already have an account? Sign In" : "New to SmartBridge? Sign Up"}
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col items-center gap-2.5">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setNotice("Please sign in or create an account with your email and password above.")}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition border border-slate-200"
                  title="Sign in with Google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.19-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setNotice("Please sign in or create an account with your email and password above.")}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition border border-slate-200"
                  title="Sign in with Facebook"
                >
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <p className="text-[11px] text-slate-500 text-center md:text-left">
          Zambian Kwacha (ZK) · MTN MoMo & Airtel Money · SmartBridge Market
        </p>
      </div>

      {/* Right Side: Navy Blue & Purple Commerce Illustration */}
      <div
        className="w-full md:w-[54%] lg:w-[56%] min-h-[380px] md:min-h-screen bg-gradient-to-br from-[#070a28] via-[#131249] to-[#39146e] flex items-center justify-center relative overflow-hidden p-4 sm:p-8"
        id="login_hero_image_panel"
      >
        {!imgError ? (
          <img
            src={loginHeroImg}
            alt="Shopping bags, credit cards, shopping cart, basket, wallet, hand pointing at Buy and hand pointing at Shop"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full max-h-[88vh] object-contain rounded-2xl select-none"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-white space-y-3 p-8">
            <div className="p-4 rounded-2xl bg-purple-600/30 border border-purple-400/30">
              <ShoppingBag className="w-12 h-12 text-purple-200" />
            </div>
            <p className="text-xl font-bold">SmartBridge Market</p>
            <p className="text-sm text-indigo-200 max-w-xs">
              Buy and shop directly with verified neighborhood traders and local farmers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
