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

  // Fetch user's listings
  useEffect(() => {
    const fetchUserListings = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        // Fetch active listings
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

        // Fetch sold listings
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

        // Fetch favorite listings
        const favoritesQuery = query(
          collection(db, "Favorites"),
          where("userUID", "==", currentUser.uid)
        );
        const favoritesSnap = await getDocs(favoritesQuery);
        const favoriteIDs = favoritesSnap.docs.map(doc => doc.data().listingID);

        // Fetch the actual listing data for favorites
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

  // Remove from favorites
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

  // Calculate time ago
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-t-purple-900 border-gray-200 rounded-full mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        handleLogout={handleLogout}
        setShowLoginModal={setShowLoginModal}
        setShowMenu={setShowMenu}
        navigate={navigate}
      />
      
      <Menu showMenu={showMenu} setShowMenu={setShowMenu} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-full bg-purple-900 flex items-center justify-center text-white font-extrabold text-4xl shadow-lg">
                {currentUserData?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-white flex items-center justify-center shadow-md">
                <span className="text-xs text-white">✓</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {currentUserData?.username || "User"}
                </h1>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-semibold">
                  LSU Verified
                </span>
              </div>
              <p className="text-gray-600 mb-6">{currentUser?.email || "email@lsu.edu"}</p>
              
              {/* Stats Row */}
              <div className="flex flex-wrap gap-8 justify-center md:justify-start mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900">{myListings.length}</div>
                  <div className="text-sm text-gray-600">Active Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900">{soldListings.length}</div>
                  <div className="text-sm text-gray-600">Items Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900">{favoriteListings.length}</div>
                  <div className="text-sm text-gray-600">Favorites</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900">
                    {currentUserData?.accountCreation 
                      ? new Date(currentUserData.accountCreation.toDate()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600">Member Since</div>
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
                activeTab === "listings" ? "bg-purple-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Package className="w-4 h-4" />
              My Listings ({myListings.length})
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "favorites" ? "bg-purple-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Heart className="w-4 h-4" />
              Favorites ({favoriteListings.length})
            </button>
            <button
              onClick={() => setActiveTab("sold")}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "sold" ? "bg-purple-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {myListings.length} Active Listing{myListings.length !== 1 ? 's' : ''}
              </h2>
              {myListings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>You don't have any active listings yet.</p>
                  <button
                    onClick={() => navigate('/listings')}
                    className="mt-4 px-6 py-2 bg-purple-900 text-white rounded-lg hover:bg-purple-800"
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
                      onClick={() => navigate('/my-listings')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "favorites" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {favoriteListings.length} Favorited Item{favoriteListings.length !== 1 ? 's' : ''}
              </h2>
              {favoriteListings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {soldListings.length} Sold Item{soldListings.length !== 1 ? 's' : ''}
              </h2>
              {soldListings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
    active: "bg-green-100 text-green-700",
    sold: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    active: "Active",
    sold: "Sold",
  };

  return (
    <div onClick={onClick} className="bg-white rounded-xl shadow-sm hover:shadow-xl cursor-pointer border border-gray-200 overflow-hidden group transition-all">
      <div className="aspect-square bg-gradient-to-br from-purple-100 to-yellow-100 flex items-center justify-center">
        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-purple-900 transition-colors flex-grow truncate">
            {listing.title}
          </h3>
          {onFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite();
              }}
              className="text-red-500 hover:text-red-600 transition-colors flex-shrink-0 ml-2"
            >
              <Heart className="w-5 h-5 fill-red-500" />
            </button>
          )}
        </div>
        <p className="text-2xl font-bold text-purple-900 mb-2">${listing.price}</p>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2.5 py-1 rounded-full font-semibold ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
          <span className="text-gray-500">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}