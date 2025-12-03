import React, { useState } from "react";
import { Package, Heart, TrendingUp } from "lucide-react";

// TigerTrade Profile Page
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"listings" | "favorites" | "sold">("listings");

  return (
    <div className="min-h-screen text-white bg-gradient-to-b from-[#12091a] via-[#1a0f2e] to-[#2c1844] overflow-x-hidden">
      {/* floating subtle background blobs + grid */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <svg
          className="absolute left-[-10%] top-[-10%] w-[60vw] h-[60vh] opacity-30 animate-blob-slow"
          viewBox="0 0 600 600"
        >
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#46207e" />
              <stop offset="100%" stopColor="#f2b200" />
            </linearGradient>
          </defs>
          <g transform="translate(300,300)">
            <path
              fill="url(#g1)"
              d="M120,-150C160,-120,190,-80,200,-40C210,0,200,40,170,80C140,120,100,150,60,170C20,190,-30,200,-70,180C-110,160,-140,120,-160,80C-180,40,-190,0,-180,-40C-170,-80,-140,-120,-100,-150C-60,-180,-30,-200,10,-200C50,-200,80,-180,120,-150Z"
            />
          </g>
        </svg>

        <svg
          className="absolute right-[-5%] bottom-[-5%] w-[50vw] h-[50vh] opacity-20 animate-blob-slower"
          viewBox="0 0 600 600"
        >
          <defs>
            <linearGradient id="g2" x1="0" x2="1">
              <stop offset="0%" stopColor="#f2b200" />
              <stop offset="100%" stopColor="#6b2fb5" />
            </linearGradient>
          </defs>
          <g transform="translate(300,300)">
            <path
              fill="url(#g2)"
              d="M100,-130C140,-110,170,-70,190,-30C210,10,210,60,180,100C150,140,100,170,50,190C0,210,-40,220,-80,200C-120,180,-150,140,-170,100C-190,60,-190,10,-180,-30C-170,-70,-140,-110,-100,-130C-60,-150,-30,-160,10,-170C50,-180,80,-160,100,-130Z"
            />
          </g>
        </svg>

        {/* faint grid */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-soft-light"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff1a 1px, transparent 1px), linear-gradient(90deg, #ffffff1a 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header / Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#f2b200] flex items-center justify-center text-[#41206a] font-extrabold">
            TT
          </div>
          <div
            className="text-base font-semibold"
            style={{ fontFamily: "Rock Salt, cursive" }}
          >
            TigerTrade
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href="#" className="text-white/80 hover:text-white transition">
            Browse
          </a>
          <a href="#" className="text-white/80 hover:text-white transition">
            Sell
          </a>
          <a href="#" className="text-white/80 hover:text-white transition">
            Messages
          </a>
          <a href="#" className="text-white hover:text-[#FDD023] transition font-semibold">
            Profile
          </a>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Profile Header Card */}
        <div className="rounded-3xl bg-white/5 p-8 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-md mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#FDD023] to-[#f2b200] flex items-center justify-center text-[#41206a] font-extrabold text-4xl shadow-[0_18px_45px_rgba(253,208,35,0.45)]">
                JD
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-[#12091a] flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">John Doe</h1>
                <span className="px-3 py-1 rounded-full bg-[#FDD023]/10 border border-[#FDD023]/40 text-[#FDD023] text-xs font-semibold">
                  LSU Verified
                </span>
              </div>
              <p className="text-white/70 mb-4">john.doe@lsu.edu</p>
              
              {/* Stats Row */}
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FDD023]">12</div>
                  <div className="text-xs text-white/60">Active Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FDD023]">8</div>
                  <div className="text-xs text-white/60">Items Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FDD023]">4.8</div>
                  <div className="text-xs text-white/60">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FDD023]">45</div>
                  <div className="text-xs text-white/60">Reviews</div>
                </div>
              </div>

              <button className="mt-6 px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 transition text-sm font-semibold">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("listings")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "listings"
                ? "bg-[#FDD023] text-[#41206a]"
                : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
            }`}
          >
            <Package className="w-4 h-4" />
            My Listings
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "favorites"
                ? "bg-[#FDD023] text-[#41206a]"
                : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
            }`}
          >
            <Heart className="w-4 h-4" />
            Favorites
          </button>
          <button
            onClick={() => setActiveTab("sold")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "sold"
                ? "bg-[#FDD023] text-[#41206a]"
                : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Sold Items
          </button>
        </div>

        {/* Listings Grid */}
        {activeTab === "listings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ListingCard
              emoji="🏈"
              title="LSU vs Alabama Tickets (2)"
              price="$150"
              status="active"
              time="2 days ago"
            />
            <ListingCard
              emoji="📚"
              title="Calculus Textbook - 9th Ed"
              price="$75"
              status="active"
              time="1 week ago"
            />
            <ListingCard
              emoji="💻"
              title="MacBook Pro 2020"
              price="$800"
              status="active"
              time="3 days ago"
            />
            <ListingCard
              emoji="🎒"
              title="Purple & Gold Backpack"
              price="$25"
              status="active"
              time="5 days ago"
            />
            <ListingCard
              emoji="☕"
              title="Mini Fridge - Like New"
              price="$60"
              status="active"
              time="1 week ago"
            />
            <ListingCard
              emoji="🎧"
              title="Sony Headphones WH-1000XM4"
              price="$200"
              status="active"
              time="4 days ago"
            />
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ListingCard
              emoji="🎸"
              title="Electric Guitar - Fender"
              price="$350"
              status="available"
              time="Saved 1 day ago"
            />
            <ListingCard
              emoji="🚲"
              title="Mountain Bike - Trek"
              price="$400"
              status="available"
              time="Saved 3 days ago"
            />
            <ListingCard
              emoji="📱"
              title="iPhone 13 Pro - 256GB"
              price="$650"
              status="available"
              time="Saved 5 days ago"
            />
            <ListingCard
              emoji="⌚"
              title="Apple Watch Series 8"
              price="$300"
              status="available"
              time="Saved 1 week ago"
            />
          </div>
        )}

        {activeTab === "sold" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ListingCard
              emoji="🎮"
              title="PlayStation 5 Controller"
              price="$45"
              status="sold"
              time="2 weeks ago"
            />
            <ListingCard
              emoji="🪑"
              title="Desk Chair - Like New"
              price="$60"
              status="sold"
              time="1 month ago"
            />
            <ListingCard
              emoji="🎯"
              title="LSU Game Day Jersey"
              price="$30"
              status="sold"
              time="3 weeks ago"
            />
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rock+Salt&family=Inter:wght@400;500;600;700&display=swap');

        body {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* subtle blob animations */
        @keyframes blob-slow {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes blob-slower {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-blob-slow { animation: blob-slow 10s ease-in-out infinite; transform-origin: center; }
        .animate-blob-slower { animation: blob-slower 14s ease-in-out infinite; transform-origin: center; }

        /* Hover scale & golden glow */
        .listing-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .listing-card:hover {
          transform: scale(1.04);
          box-shadow: 0 0 18px rgba(253, 208, 35, 0.55), 0 0 32px rgba(253, 208, 35, 0.35);
          border-color: rgba(253, 208, 35, 0.75);
        }
      `}</style>
    </div>
  );
}

interface ListingCardProps {
  emoji: string;
  title: string;
  price: string;
  status: "active" | "available" | "sold";
  time: string;
}

function ListingCard({ emoji, title, price, status, time }: ListingCardProps) {
  const statusStyles = {
    active: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
    available: "bg-blue-500/10 border-blue-500/40 text-blue-400",
    sold: "bg-red-500/10 border-red-500/40 text-red-400",
  };

  const statusLabels = {
    active: "Active",
    available: "Available",
    sold: "Sold",
  };

  return (
    <div className="listing-card rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm cursor-pointer">
      <div className="w-full h-48 bg-gradient-to-br from-[#41206a] to-[#6b2fb5] flex items-center justify-center text-7xl border-b border-white/5">
        {emoji}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-white/95 mb-2">{title}</h3>
        <div className="text-2xl font-bold text-[#FDD023] mb-3">{price}</div>
        <div className="flex items-center justify-between text-xs">
          <span
            className={`px-2.5 py-1 rounded-full border font-semibold ${statusStyles[status]}`}
          >
            {statusLabels[status]}
          </span>
          <span className="text-white/60">{time}</span>
        </div>
      </div>
    </div>
  );
}
