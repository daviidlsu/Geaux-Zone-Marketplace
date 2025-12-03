import React, { useState } from "react";
import { Package, Heart, TrendingUp, MapPin, Edit } from "lucide-react";

// TigerTrade Profile Page - Matches WelcomePage styling
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"listings" | "favorites" | "sold">("listings");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Matches WelcomePage nav style */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-900 flex items-center justify-center text-white font-extrabold">
              TT
            </div>
            <div className="text-lg font-bold text-gray-900">
              TigerTrade
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition font-medium">
              Browse
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition font-medium">
              Sell
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition font-medium">
              Messages
            </a>
            <a href="#" className="text-purple-900 transition font-semibold">
              Profile
            </a>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-purple-900 flex items-center justify-center text-white font-extrabold text-4xl shadow-lg">
                JD
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-white flex items-center justify-center shadow-md">
                <span className="text-xs text-white">✓</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">John Doe</h1>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-semibold">
                  LSU Verified
                </span>
              </div>
              <p className="text-gray-600 mb-6">john.doe@lsu.edu</p>
              
              {/* Stats Row */}
              <div className="flex flex-wrap gap-8 justify-center md:justify-start mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900">12</div>
                  <div className="text-sm text-gray-600">Active Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900">8</div>
                  <div className="text-sm text-gray-600">Items Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900">4.8</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900">45</div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
              </div>

              <button className="px-6 py-2.5 rounded-lg bg-purple-900 text-white font-semibold hover:bg-purple-800 transition-all flex items-center gap-2 mx-auto md:mx-0">
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 rounded-t-xl">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab("listings")}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "listings"
                  ? "bg-purple-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Package className="w-4 h-4" />
              My Listings
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "favorites"
                  ? "bg-purple-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Heart className="w-4 h-4" />
              Favorites
            </button>
            <button
              onClick={() => setActiveTab("sold")}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "sold"
                  ? "bg-purple-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Sold Items
            </button>
          </div>
        </div>

        {/* Listings Section */}
        <div className="mt-8">
          {/* Tab Content: My Listings */}
          {activeTab === "listings" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                12 Active Listings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ListingCard
                  emoji="🏈"
                  title="LSU vs Alabama Tickets (2)"
                  price={150}
                  status="active"
                  time="2 days ago"
                  location="Tiger Stadium - Gate 1"
                />
                <ListingCard
                  emoji="📚"
                  title="Calculus Textbook - 9th Ed"
                  price={75}
                  status="active"
                  time="1 week ago"
                  location="Middleton Library - Main Entrance"
                />
                <ListingCard
                  emoji="💻"
                  title="MacBook Pro 2020"
                  price={800}
                  status="active"
                  time="3 days ago"
                  location="Student Union - Front Entrance"
                />
                <ListingCard
                  emoji="🎒"
                  title="Purple & Gold Backpack"
                  price={25}
                  status="active"
                  time="5 days ago"
                  location="UREC - Main Lobby"
                />
                <ListingCard
                  emoji="☕"
                  title="Mini Fridge - Like New"
                  price={60}
                  status="active"
                  time="1 week ago"
                  location="The 459 - Main Lobby"
                />
                <ListingCard
                  emoji="🎧"
                  title="Sony Headphones WH-1000XM4"
                  price={200}
                  status="active"
                  time="4 days ago"
                  location="Patrick F. Taylor Hall"
                />
              </div>
            </div>
          )}

          {/* Tab Content: Favorites */}
          {activeTab === "favorites" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                4 Favorited Items
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ListingCard
                  emoji="🎸"
                  title="Electric Guitar - Fender"
                  price={350}
                  status="available"
                  time="Saved 1 day ago"
                  location="Student Union - Front Entrance"
                />
                <ListingCard
                  emoji="🚲"
                  title="Mountain Bike - Trek"
                  price={400}
                  status="available"
                  time="Saved 3 days ago"
                  location="UREC - Main Lobby"
                />
                <ListingCard
                  emoji="📱"
                  title="iPhone 13 Pro - 256GB"
                  price={650}
                  status="available"
                  time="Saved 5 days ago"
                  location="Middleton Library - Main Entrance"
                />
                <ListingCard
                  emoji="⌚"
                  title="Apple Watch Series 8"
                  price={300}
                  status="available"
                  time="Saved 1 week ago"
                  location="CEBA"
                />
              </div>
            </div>
          )}

          {/* Tab Content: Sold Items */}
          {activeTab === "sold" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                3 Sold Items
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ListingCard
                  emoji="🎮"
                  title="PlayStation 5 Controller"
                  price={45}
                  status="sold"
                  time="2 weeks ago"
                  location="Student Union - Front Entrance"
                />
                <ListingCard
                  emoji="🪑"
                  title="Desk Chair - Like New"
                  price={60}
                  status="sold"
                  time="1 month ago"
                  location="The 459 - Main Lobby"
                />
                <ListingCard
                  emoji="🎯"
                  title="LSU Game Day Jersey"
                  price={30}
                  status="sold"
                  time="3 weeks ago"
                  location="Tiger Stadium - Gate 1"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ListingCardProps {
  emoji: string;
  title: string;
  price: number;
  status: "active" | "available" | "sold";
  time: string;
  location: string;
}

function ListingCard({ emoji, title, price, status, time, location }: ListingCardProps) {
  const statusStyles = {
    active: "bg-green-100 text-green-700",
    available: "bg-blue-100 text-blue-700",
    sold: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    active: "Active",
    available: "Available",
    sold: "Sold",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl cursor-pointer border border-gray-200 overflow-hidden group transition-all">
      <div className="aspect-square bg-gradient-to-br from-purple-100 to-yellow-100 flex items-center justify-center text-7xl border-b border-gray-200">
        {emoji}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-purple-900 transition-colors flex-grow truncate">
            {title}
          </h3>
          <button className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2">
            <Heart className="w-5 h-5" />
          </button>
        </div>
        <p className="text-2xl font-bold text-purple-900 mb-2">${price}</p>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2.5 py-1 rounded-full font-semibold ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
          <span className="text-gray-500">{time}</span>
        </div>
      </div>
    </div>
  );
}
