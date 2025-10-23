import { useState, FormEvent, useEffect } from "react";
import { Search, Filter, MapPin, Heart, X} from "lucide-react";
import { auth, db } from "./firebase/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from 'react-toastify';
import { collection, getDocs, getDocsFromServer, query, Timestamp, where } from "firebase/firestore";

type Category = "All" | "Tickets" | "Textbooks" | "Clothing" | "Electronics" | "Other" | string;

interface Listing {
  docId: string;
  id: number;
  title: string;
  categoryID: Category;
  Description: string;
  price: number;
  dateListed: string;
  image: string;
  location: string;
  sellerUID: string;
  available: boolean;
}

interface sellerInfo {
  accountCreation: Timestamp;
  email: string;
  username: string;
}

export default function WelcomePage() {
  const navigate = useNavigate();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filteredNum, setFilteredNum] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [loggedIn, setLoggedIn] = useState<boolean>(false); // Placeholder for authentication state
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [listingOwner, setListingOwner] = useState<sellerInfo | null>(null);

  const categories: Category[] = ["All", "Tickets", "Textbooks", "Clothing", "Electronics", "Other"];

  // Fetch listings from Firestore
  const fetchListings = async (): Promise<Listing[]> => {
    try{
      const querySnapshot = await getDocs(collection(db, "Inventory")); // Might need to adjust for available items
      const fetchedListings: Listing[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as Listing;
        return {
          docId: doc.id,
          id: data.id,
          title: data.title,
          categoryID: data.categoryID,
          Description: data.Description,
          price: data.price,
          dateListed: data.dateListed,
          image: data.image,
          location: data.location,
          sellerUID: data.sellerUID,
          available: data.available,
        } as Listing;
      });
      return fetchedListings;
    } catch (error) {
      toast.error("Failed to fetch listings.", {toastId:"fetch-error"});
      console.error("Error fetching listings: ", error);
      return [];
    }
  }
  // Update filtered listings count
  useEffect(() => {
    const filteredListings = listings.filter((listing) => {
      const matchesCategory = selectedCategory === "All" || listing.categoryID === selectedCategory;
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) || listing.Description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    setFilteredNum(filteredListings.length);
  }, [listings, searchQuery, selectedCategory]);

  // Called upon loading page to fetch listings
  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      const fetchedListings = await fetchListings();
      setListings(fetchedListings);
      setLoading(false);
    };
    loadListings();
  }, []);

  // Gathers seller info upon selecting a listing
  useEffect(() => {
    if (selectedListing) {
      const fetchSellerInfo = async () => {
        try{
          const userSnapshot = await getDocsFromServer(query(collection(db, "Users"), where("uid", "==", selectedListing.sellerUID)));
          if (userSnapshot.docs.length > 0) {
            const userData = userSnapshot.docs[0];
            setListingOwner(userData.data() as sellerInfo); 
          } else {
            console.log("No user found with UID:", selectedListing.sellerUID);
            setListingOwner(null);
          }
        } catch (error) {
          console.error("Error fetching seller info:", error);
          setListingOwner(null);
        }
      };
      fetchSellerInfo();
    }
    else{
      setListingOwner(null);
    }
  }, [selectedListing])

  // Once listings are fetched, render them
  const renderListings = () => {
    if (loading) {
      return (
      <div className="col-span-full text-center py-10 text-gray-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-t-purple-900 border-gray-200 rounded-full mr-2"></div>
            Loading listings...
        </div>
      );
    }

    const filteredListings = listings.filter((listing) => {
      const matchesCategory = selectedCategory === "All" || listing.categoryID === selectedCategory;
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) || listing.Description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (filteredNum === 0) {
      return (
        <div className="col-span-full text-center py-20">
          <p className="text-gray-500 text-lg">No listings found. Try adjusting your search.</p>
        </div>
      );
    }
    return filteredListings.map((listing) => (
      <div
        key={listing.docId}
        onClick={() => handleListing(listing)}
        className="bg-white rounded-xl shadow-sm hover:shadow-xl cursor-pointer border border-gray-200 overflow-hidden group"
      >
        <div className="aspect-square bg-gradient-to-br from-purple-100 to-yellow-100 flex items-center justify-center">
          <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
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
    ));
  }
  // Listing handler (Sets selected listing))
  async function handleListing(listing: Listing){
    setSelectedListing(listing);
  }
  // Contact seller handler
  const handleContactSeller = () => {
    if (!loggedIn) {
      toast.warn("Please Login or Register to contact seller.", {toastId: 'contact-error'});
    } else {
      // Implement contact seller functionality here
    }
  }
  // Favorite handler
  const handleFavorite = () => {
    if (!loggedIn) {
      toast.warn("Please Login or Register to favorite listings.", {toastId: 'favorite-error'});
    } else {
      // Implement favorite functionality here
    }
  }
  // Login button handler
  const handleLogin = async (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget);
    const {email, password} = Object.fromEntries(formData.entries()) as Record<string,string>;
    // TODO: sanitize user input
    try{
        const user = await signInWithEmailAndPassword(auth, email, password)
        if (user){
          setLoggedIn(true);
            //retrieve user authtoken
          toast.success("Login Successful!", {toastId: 'login-success'});
          setShowLoginModal(false); // Close modal on successful login
        }
    }catch(error){
        toast.error("Login Failed. Please check your credentials.", {toastId: 'login-failed'});
        console.log(error);
    }
  }
  // Logout button handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLoggedIn(false);
      toast.success("Logout Successful!", {toastId: 'logout-success'});
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }
  // Handle modal close
  const handleCloseModal = () => {
    setSelectedListing(null);
    setListingOwner(null);
  };
  // Register button handler
  const handleRegister = () => {
    navigate('/register');
  }

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
            <button onClick={loggedIn ? handleLogout : () => setShowLoginModal(true)} className={`px-4 py-1 rounded-2xl text-purple-900 transition-colors font-semibold
              ${loggedIn 
                ? 'bg-purple-950 text-white hover:bg-purple-999'
                : 'bg-yellow-400 text-purple-900 hover:bg-yellow-500'}`}> {/*Determines button style based on login state*/}
              {loggedIn ? 'Logout' : 'Login'} {/* Determines button text */}
            </button>
            {!loggedIn && (
              <button onClick={handleRegister} className="px-5 py-2 rounded-2xl bg-yellow-400 text-purple-900 font-semibold hover:bg-yellow-500 transition-all active:cursor:grabbing">Sign Up</button>
            )}
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
            {filteredNum} {filteredNum === 1 ? "Listing" : "Listings"} Available
          </h2>
        </div>
        <div id="listing-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderListings()}
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-yellow-400 text-purple-900 rounded-full shadow-2xl hover:bg-yellow-300 transition-all transform hover:scale-110 flex items-center justify-center text-3xl font-bold">
        +
      </button>

      {/* Listing Detail Modal */}
      {selectedListing && listingOwner!=null &&(
        <div
          className="fixed inset-0 bg-[#444]/70 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side - Image */}
            <div className="w-1/2 bg-gradient-to-br from-purple-100 to-yellow-100 flex items-center justify-center">
              <img 
                src={selectedListing.image} 
                alt={selectedListing.title} 
                className="w-full h-full object-cover" 
                loading="lazy"
              />
            </div>

            {/* Right Side - Details */}
            <div className="w-1/2 flex flex-col">
              {/* Header with Close Button */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-sm font-medium">
                  {selectedListing.categoryID}
                </span>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Title and Price */}
                <div className="mb-6">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">{selectedListing.title}</h3>
                  <p className="text-4xl font-bold text-purple-900">${selectedListing.price}</p>
                </div>

                {/* Location */}
                <div className="flex items-center text-gray-600 mb-6 pb-6 border-b border-gray-200">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-lg">{selectedListing.location}</span>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedListing.Description}</p>
                </div>

                {/* Seller Info */}
                {listingOwner && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Seller Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center text-white font-bold text-lg">{listingOwner.username.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{listingOwner.username}</p>
                      <p className="text-sm text-gray-600">Member since {listingOwner.accountCreation.toDate().toLocaleDateString('en-US', {month: 'long', year:'numeric'})}</p>
                    </div>
                  </div>
                </div>)}
              </div>

              {/* Action Buttons - Fixed at Bottom */}
              <div className="px-6 py-4 border-t border-gray-200 bg-white">
                <div className="flex gap-3">
                  {/* Contact Seller Button */}
                  <button onClick={() => {handleContactSeller();}} className="flex-1 bg-purple-900 text-white py-3 rounded-xl font-bold hover:bg-purple-800 transition-all">
                    Contact Seller
                  </button>
                  {/* Favorite Button */}
                    <button onClick={() => {handleFavorite();}}
                      className="px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-purple-900 hover:text-purple-900 transition-all"
                    >
                    <Heart className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {!loggedIn && showLoginModal && (
        <div onClick={() => setShowLoginModal(false)} className="fixed inset-0 flex items-center justify-center bg-[#444]/60 z-50">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-2/5 h-2/3 relative">
            {/*Close button (X)*/}
            <button className="absolute top-2 right-2 hover:bg-gray-100 rounded-md"
              onClick={() => setShowLoginModal(false)}>
              <X size={30}/>
            </button>
            {/* Login Form */}
            <form onSubmit={handleLogin}>
              <div>
                <label>Email</label>
                <input className='border'
                  type="email"
                  name="email"
                />
              </div>
              <div>
                <label>Password</label>
                <input className='border'
                  type="password"
                  name="password"
                />
              </div>
              {/* Submit button */}
              <button className="px-6 py-3 bg-purple-900 text-white rounded-lg font-semibold hover:bg-purple-800 transition-all flex items-center gap-2" type="submit">Login</button> 
            </form>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer
        toastStyle={{ backgroundColor: '#421168ff', color: '#fff', border: '1.5px #421168ff' , borderRadius: '16px'}}
        position="top-right"
        autoClose={4000}
        closeOnClick
        hideProgressBar={true}
        transition={Zoom}
        theme="dark"
      />
    </div>
  );
}
