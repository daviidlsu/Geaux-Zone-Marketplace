import { useState } from "react";
import { Search, Filter, MapPin, Heart } from "lucide-react";

type Category = "All" | "Tickets" | "Textbooks" | "Clothing" | "Electronics" | "Other" | string;

interface Listing {
  id: number;
  title: string;
  price: number;
  image: string;
  category: Category;
  location: string;
}

export default function WelcomePage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");

  const listings: Listing[] = [
    { id: 1, title: "Textbook", price: 45, image: "https://via.placeholder.com/300x200", category: "Textbooks", location: "Union" },
    { id: 2, title: "LSU Jersey", price: 34, image: "https://via.placeholder.com/300x200", category: "Clothing", location: "Union" },
    { id: 3, title: "Bike", price: 220, image: "https://via.placeholder.com/300x200", category: "Other", location: "Union" },
    { id: 4, title: "Airpods", price: 106, image: "https://via.placeholder.com/300x200", category: "Electronics", location: "Union" },
  ];

  const categories: Category[] = ["All", "Tickets", "Textbooks", "Clothing", "Electronics", "Other"];

  const handleListing = (listing: Listing) => {
    console.log("Clicked listing:", listing);
    alert("Please Login or Register to view details.");
  };

  const filteredListings = listings.filter((listing) => {
    const matchesCategory = selectedCategory === "All" || listing.category === selectedCategory;
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <nav className="sticky top-0 z-50 bg-purple-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-purple-900 text-lg">
              LSU
            </div>
            <span className="text-white font-bold text-xl">Geaux-Zone Marketplace</span>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2 text-white hover:text-yellow-400 transition-colors font-medium">Login</button>
            <button className="px-5 py-2 bg-yellow-400 text-purple-900 font-semibold hover:bg-yellow-300 transition-all">Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for items..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button className="px-6 py-3 bg-purple-900 text-white rounded-lg font-semibold hover:bg-purple-800 transition-all flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category ? "bg-purple-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredListings.length} {filteredListings.length === 1 ? "Listing" : "Listings"} Available
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => handleListing(listing)}
              className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-200 overflow-hidden group"
            >
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-yellow-100 flex items-center justify-center">
                <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-900 transition-colors">{listing.title}</h3>
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-2xl font-bold text-purple-900 mb-2">${listing.price}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />
                  {listing.location}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No listings found. Try adjusting your search.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-yellow-400 text-purple-900 rounded-full shadow-2xl hover:bg-yellow-300 transition-all transform hover:scale-110 flex items-center justify-center text-3xl font-bold">
        +
      </button>
    </div>
  );
}
