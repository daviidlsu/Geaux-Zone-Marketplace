import React, { useState, useEffect } from "react";
import { Package, Heart, TrendingUp, MapPin, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { toast } from "react-toastify";
import { collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import Navbar from "./components/navbar";
import Menu from "./components/menu";
import CustomToastContainer from "./components/toast";

interface Listing {
  docId: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  location: string;
  categoryID: string;
  Description: string;
  available: boolean;
  sellerUID: string;
  dateListed: any;
  condition?: string;
}

// --- LSU THEME CONSTANTS ---
const PRIMARY_BG = "bg-[#1a0f2e]"; // Dark Purple from Landing Page
const CARD_BG = "bg-[#2c1844]/50"; // Slightly lighter purple for cards
const ACCENT_GOLD = "text-[#FDD023]"; // LSU Gold
const ACCENT_GOLD_BG = "bg-[#FDD023]";
const DARK_PURPLE_TEXT = "text-[#41206a]"; // Dark Purple text on Gold BG
const ACCENT_HOVER = "hover:bg-[#f2b200]"; // Slightly darker gold hover
const ACCENT_GREEN = "bg-emerald-400"; // Green for Verified/Active

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, currentUserData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"listings" | "favorites" | "sold">("listings");
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Data states
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [soldListings, setSoldListings] = useState<Listing[]>([]);
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success("Logout Successful!", { toastId: 'logout-success' });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to logout", { toastId: 'logout-error' });
    }
  };

  // Fetch user's listings (omitted for brevity, remains the same)
  useEffect(() => {
    const fetchUserListings = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        const activeQuery = query(
          collection(db, "Inventory"),
          where("sellerUID", "==", currentUser.uid),
          where("available", "==", true)
        );
        const activeSnap = await getDocs(activeQuery);
        const active = activeSnap.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        } as Listing));
        setMyListings(active);

        const soldQuery = query(
          collection(db, "Inventory"),
          where("sellerUID", "==", currentUser.uid),
          where("available", "==", false)
        );
        const soldSnap = await getDocs(soldQuery);
        const sold = soldSnap.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        } as Listing));
        setSoldListings(sold);

        const favoritesQuery = query(
          collection(db, "Favorites"),
          where("userUID", "==", currentUser.uid)
        );
        const favoritesSnap = await getDocs(favoritesQuery);
        const favoriteIDs = favoritesSnap.docs.map(doc => doc.data().listingID);

        if (favoriteIDs.length > 0) {
          const favListingsPromises = favoriteIDs.map(async (listingID) => {
            const listingDoc = await getDocs(
              query(collection(db, "Inventory"), where("__name__", "==", listingID))
            );
            if (!listingDoc.empty) {
              return {
                docId: listingDoc.docs[0].id,
                ...listingDoc.docs[0].data()
              } as Listing;
            }
            return null;
          });
          
          const favListings = (await Promise.all(favListingsPromises)).filter(
            (listing): listing is Listing => listing !== null
          );
          setFavoriteListings(favListings);
        }

      } catch (error) {
        console.error("Error fetching listings:", error);
        toast.error("Failed to load profile data", { toastId: 'fetch-error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserListings();
  }, [currentUser, navigate]);

  // Remove from favorites (omitted for brevity, remains the same)
  const handleRemoveFavorite = async (listingId: string) => {
    try {
      const favoriteQuery = query(
        collection(db, "Favorites"),
        where("userUID", "==", currentUser?.uid),
        where("listingID", "==", listingId)
      );
      const querySnapshot = await getDocs(favoriteQuery);
      querySnapshot.forEach(async (docSnap) => {
        await deleteDoc(docSnap.ref);
      });

      setFavoriteListings(prev => prev.filter(listing => listing.docId !== listingId));
      toast.success("Removed from favorites!", { toastId: 'remove-favorite' });
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove favorite", { toastId: 'remove-error' });
    }
  };

  // Calculate time ago (omitted for brevity, remains the same)
  const getTimeAgo = (dateListed: any) => {
    if (!dateListed) return "Recently";
    const date = dateListed.toDate ? dateListed.toDate() : new Date(dateListed);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${PRIMARY_BG} flex items-center justify-center`}>
        <div className="text-center">
          {/* Spinner color changed to gold */}
          <div className={`animate-spin inline-block w-12 h-12 border-4 border-t-[#FDD023] border-white/20 rounded-full mb-4`}></div>
          <p className="text-white/80">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${PRIMARY_BG} text-white`}>
      <Navbar
        handleLogout={handleLogout}
        setShowLoginModal={setShowLoginModal}
        setShowMenu={setShowMenu}
        navigate={navigate}
      />
      
      <Menu showMenu={showMenu} setShowMenu={setShowMenu} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <div className={`${CARD_BG} rounded-xl shadow-xl border border-white/10 p-8 mb-8`}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative flex-shrink-0">
              {/* Avatar Initial BG: Dark Purple */}
              <div className={`w-28 h-28 rounded-2xl bg-[#41206a] flex items-center justify-center text-white font-extrabold text-4xl shadow-lg`}>
                {currentUserData?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              {/* Verified Checkmark BG: Emerald Green */}
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full ${ACCENT_GREEN} border-4 border-[#1a0f2e] flex items-center justify-center shadow-md`}>
                <span className="text-xs text-white">✓</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-white">
                  {currentUserData?.username || "User"}
                </h1>
                {/* LSU Verified Badge: Dark Purple/Gold */}
                <span className={`px-3 py-1 rounded-full bg-[#41206a] ${ACCENT_GOLD} text-xs font-semibold border border-[#41206a]`}>
                  LSU Verified
                </span>
              </div>
              <p className="text-white/80 mb-6">{currentUser?.email || "email@lsu.edu"}</p>
              
              {/* Stats Row */}
              <div className="flex flex-wrap gap-8 justify-center md:justify-start mb-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${ACCENT_GOLD}`}>{myListings.length}</div>
                  <div className="text-sm text-white/70">Active Listings</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${ACCENT_GOLD}`}>{soldListings.length}</div>
                  <div className="text-sm text-white/70">Items Sold</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${ACCENT_GOLD}`}>{favoriteListings.length}</div>
                  <div className="text-sm text-white/70">Favorites</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${ACCENT_GOLD}`}>
                    {currentUserData?.accountCreation 
                      ? new Date(currentUserData.accountCreation.toDate()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : "N/A"}
                  </div>
                  <div className="text-sm text-white/70">Member Since</div>
                </div>
              </div>

              {/* Edit Profile Button: Gold BG, Dark Purple Text */}
              <button className={`px-6 py-2.5 rounded-lg ${ACCENT_GOLD_BG} ${DARK_PURPLE_TEXT} font-semibold ${ACCENT_HOVER} transition-all flex items-center gap-2 mx-auto md:mx-0 shadow-lg`}>
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`${CARD_BG} border-b border-white/10 rounded-t-xl`}>
          <div className="flex gap-1 p-2">
            {/* Active Tab: Gold BG, Dark Purple Text */}
            <button
              onClick={() => setActiveTab("listings")}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "listings" 
                  ? `${ACCENT_GOLD_BG} ${DARK_PURPLE_TEXT}` 
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              <Package className="w-4 h-4" />
              My Listings ({myListings.length})
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "favorites" 
                  ? `${ACCENT_GOLD_BG} ${DARK_PURPLE_TEXT}`
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              <Heart className="w-4 h-4" />
              Favorites ({favoriteListings.length})
            </button>
            <button
              onClick={() => setActiveTab("sold")}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "sold" 
                  ? `${ACCENT_GOLD_BG} ${DARK_PURPLE_TEXT}` 
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Sold Items ({soldListings.length})
            </button>
          </div>
        </div>

        {/* Listings Section */}
        <div className="mt-8">
          {activeTab === "listings" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {myListings.length} Active Listing{myListings.length !== 1 ? 's' : ''}
              </h2>
              {myListings.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <Package className="w-16 h-16 mx-auto mb-4 text-white/20" />
                  <p>You don't have any active listings yet.</p>
                  <button
                    onClick={() => navigate('/listings')}
                    className={`mt-4 px-6 py-2 ${ACCENT_GOLD_BG} ${DARK_PURPLE_TEXT} rounded-lg ${ACCENT_HOVER}`}
                  >
                    Create a Listing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {myListings.map(listing => (
                    <ListingCard
                      key={listing.docId}
                      listing={listing}
                      timeAgo={getTimeAgo(listing.dateListed)}
                      onFavorite={null}
                      onClick={() => navigate('/listings')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "favorites" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {favoriteListings.length} Favorited Item{favoriteListings.length !== 1 ? 's' : ''}
              </h2>
              {favoriteListings.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-white/20" />
                  <p>You haven't favorited any items yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {favoriteListings.map(listing => (
                    <ListingCard
                      key={listing.docId}
                      listing={listing}
                      timeAgo={`Saved ${getTimeAgo(listing.dateListed)}`}
                      onFavorite={() => handleRemoveFavorite(listing.docId)}
                      onClick={() => navigate('/listings')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sold" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {soldListings.length} Sold Item{soldListings.length !== 1 ? 's' : ''}
              </h2>
              {soldListings.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-white/20" />
                  <p>You haven't sold any items yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {soldListings.map(listing => (
                    <ListingCard
                      key={listing.docId}
                      listing={listing}
                      timeAgo={getTimeAgo(listing.dateListed)}
                      onFavorite={null}
                      status="sold"
                      onClick={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CustomToastContainer />
    </div>
  );
}

interface ListingCardProps {
  listing: Listing;
  timeAgo: string;
  status?: "active" | "sold";
  onFavorite: (() => void) | null;
  onClick: () => void;
}

function ListingCard({ listing, timeAgo, status = "active", onFavorite, onClick }: ListingCardProps) {
  const statusStyles = {
    // Active/Sold Status based on Landing Page theme
    active: "bg-emerald-400/20 text-emerald-400", 
    sold: "bg-red-500/20 text-red-500",
  };

  const statusLabels = {
    active: "Active",
    sold: "Sold",
  };

  return (
    <div 
        onClick={onClick} 
        // Card BG and Border: Dark Purple Card on Dark Purple BG
        className={`bg-white/5 rounded-xl shadow-lg hover:shadow-xl cursor-pointer border border-white/10 overflow-hidden group transition-all`}
    >
      <div 
        // Image Placeholder Gradient: Light Purple/Yellow (mimicking Listing Card in Landing Page)
        className="aspect-square bg-gradient-to-br from-[#41206a]/20 to-[#FDD023]/20 flex items-center justify-center"
      >
        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 
            // Hover: Gold Accent
            className="font-semibold text-white group-hover:text-[#FDD023] transition-colors flex-grow truncate"
          >
            {listing.title}
          </h3>
          {onFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite();
              }}
              // Favorite Icon: Red Accent
              className={`text-red-500 hover:text-red-600 transition-colors flex-shrink-0 ml-2`}
            >
              <Heart className="w-5 h-5 fill-red-500" />
            </button>
          )}
        </div>
        {/* Price: Gold Accent */}
        <p className={`text-2xl font-bold text-[#FDD023] mb-2`}>${listing.price}</p>
        <div className="flex items-center text-sm text-white/70 mb-2">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2.5 py-1 rounded-full font-semibold ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
          <span className="text-white/70">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}