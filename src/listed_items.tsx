import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { db } from "./firebase/firebase";
import { useAuth } from './auth/AuthContext';
import { toast } from 'react-toastify';
import { Search, MapPin, X, Trash2, TriangleAlert, DollarSign } from "lucide-react";
import { collection, getDocs, doc, query, Timestamp, where, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import Menu from "./components/menu.tsx"
import Navbar from "./components/navbar.tsx";
import CustomToastContainer from "./components/toast.tsx";

// --- LSU THEME CONSTANTS ---
const PRIMARY_BG = "bg-[#1a0f2e]"; // Dark Purple from Landing Page (Main BG)
const CARD_BG = "bg-[#2c1844]"; // Slightly lighter purple for cards
const HEADER_BG = "bg-[#41206a]"; // Header/Navbar Purple
const ACCENT_GOLD = "text-[#FDD023]"; // LSU Gold Text
const ACCENT_GOLD_BG = "bg-[#FDD023]"; // LSU Gold BG
const DARK_PURPLE_TEXT = "text-[#41206a]"; // Dark Purple text on Gold BG
const ACCENT_HOVER = "hover:bg-[#f2b200]"; // Slightly darker gold hover
const ACCENT_RED_BG = "bg-red-700"; // Red for Delete button
// ---

type Category = "All" | "Tickets" | "Textbooks" | "Clothing" | "Electronics" | "Other" | string;

interface Listing {
  docId: string;
  title: string;
  categoryID: Category;
  Description: string;
  price: number;
  dateListed: Timestamp;
  image: string;
  images: string[]
  location: string;
  sellerUID: string;
  highestOffer: number;
  offers: number;
  available: boolean;
  lastModified: Timestamp;
  condition: string;
}

const safeLocations = [
  {
    name: "Student Union - Front Entrance",
    description: "Main floor, well-lit, high traffic area",
    hours: "6am - 11pm daily",
    icon: "🏛️",
    safety: "high"
  },
  {
    name: "Middleton Library - Main Entrance", 
    description: "Security cameras, busy lobby area",
    hours: "24/7 access",
    icon: "📚",
    safety: "high"
  },
  {
    name: "Tiger Stadium - Gate 1",
    description: "Public area with security presence",
    hours: "Daylight hours recommended",
    icon: "🏈",
    safety: "high"
  },
  {
    name: "UREC - Main Lobby",
    description: "High foot traffic, staff present",
    hours: "6am - 10pm",
    icon: "💪",
    safety: "high"
  },
  {
    name: "The 459 - Main Lobby",
    description: "Student housing lobby",
    hours: "8am - 8pm",
    icon: "🏢",
    safety: "medium"
  },
  {
    name: "Patrick F. Taylor Hall",
    description: "Engineering building, busy during class hours",
    hours: "7am - 9pm",
    icon: "🏫",
    safety: "medium"
  },
  {
    name: "CEBA",
    description: "Business building lobby",
    hours: "7am - 9pm",
    icon: "💼",
    safety: "medium"
  },
  {
    name: "Nicholson Gateway",
    description: "Central campus location",
    hours: "Daylight hours recommended",
    icon: "🌳",
    safety: "medium"
  },
  {
    name: "Off Campus",
    description: "Choose a safe public location",
    hours: "Use caution",
    icon: "📍",
    safety: "low"
  }
];

export default function Listings() {
  const navigate = useNavigate();

  const { currentUser, currentUserData, logout } = useAuth();

  const [filteredNum, setFilteredNum] = useState<number>(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newCategory, setNewCategory] = useState<Category>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newImage, setNewImage] = useState<string>("");
  const [newLocation, setNewLocation] = useState<string>("");
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showSelectedListing, setShowSelectedListing] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0)
  const [newCondition, setNewCondition] = useState<string>("");

  const categories: Category[] = ["All", "Tickets", "Textbooks", "Clothing", "Electronics", "Other"];

  // Fetch listings from Firestore
  const fetchListings = async (): Promise<Listing[]> => {
    try{
      const querySnapshot = await getDocs(collection(db, "Inventory")); // Might need to adjust for available items
        const fetchedListings: Listing[] = querySnapshot.docs.filter(doc => {
        const data = doc.data() as Listing;
        return currentUser?.uid === data.sellerUID;} // Only fetch listings for current user
      ).map(doc => {
        const data = doc.data() as Listing;
        return {
          docId: doc.id,
          title: data.title,
          categoryID: data.categoryID,
          Description: data.Description,
          price: data.price,
          dateListed: data.dateListed,
          image: data.image,
          location: data.location,
          sellerUID: data.sellerUID,
          highestOffer: data.highestOffer,
          offers: data.offers,
          available: data.available,
          condition: data.condition,
        } as Listing;
      });
      return fetchedListings;
    } catch (error) {
      toast.error("Failed to fetch listings.", {toastId:"fetch-error"});
      console.error("Error fetching listings: ", error);
      return [];
    }
  }

  // Called upon loading page to fetch listings
  useEffect(() => {
    const loadListings = async () => {
        setLoading(true);
        const fetchedListings = await fetchListings();
        setListings(fetchedListings);
        setLoading(false);
    };
    loadListings();
  }, [currentUser, reloadTrigger]);

  // Update filtered listings count
  useEffect(() => {
    const filteredListings = listings.filter((listing) => {
      const matchesCategory = selectedCategory === "All" || listing.categoryID === selectedCategory;
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) || listing.Description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    setFilteredNum(filteredListings.length);
  }, [listings, searchQuery, selectedCategory]);

  // Once listings are fetched, render them
  const renderListings = () => {
    if (loading) {
      return (
        <div className="col-span-full text-center py-10 text-white/70">
          {/* Spinner color changed to gold */}
          <div className={`animate-spin inline-block w-8 h-8 border-4 border-t-[#FDD023] border-white/20 rounded-full mr-2`}></div>
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
          <p className="text-white/70 text-lg">No listings found. Try adjusting your search.</p>
        </div>
      );
    }
    return (
        // Table container changed to Card BG color
        <div className={`w-full overflow-x-auto rounded-xl shadow-lg ${CARD_BG} border border-white/10`}>
            {/* Table BG changed to Card BG color */}
            <table className="min-w-full divide-y divide-white/10">
                {/* Table Header BG changed to Darker Purple */}
                <thead className={`${HEADER_BG}`}>
                    <tr>
                        <th
                          scope="col"
                          // Text color changed to White/Gold
                          className="ml-4 py-3.5 pl-6 pr-3 text-left text-m font-semibold text-white/90"
                        >
                          Listing Title
                        </th>
                        <th 
                          scope="col" 
                          className="px-3 py-3.5 text-left text-m font-semibold text-white/90"
                        >
                          Price
                        </th>
                        <th 
                          scope="col" 
                          className="px-3 py-3.5 text-left text-m font-semibold text-white/90"
                        >
                          Location
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-m font-semibold text-white/90"
                        >
                          Date Listed
                        </th>
                        <th
                          scope="col"
                          className="pl-3 py-3.5 text-center text-m font-semibold text-white/90"
                          >
                          Offers
                        </th>
                        <th
                          scope="col"
                          className="pr-3 py-3.5 text-center text-m font-semibold text-white/90"
                          >
                          Highest Offer
                        </th>
                        <th
                          scope="col"
                          className="relative py-3.5 pr-6 pl-3"
                          >
                          <span className="sr-only"></span>
                        </th>
                    </tr>
                </thead>
                
                {/* TABLE BODY */}
                {/* Table Body BG changed to Card BG color */}
                <tbody className={`divide-y divide-white/10 ${CARD_BG}`}>
                    {filteredListings.map((listing) => (
                        <tr key={listing.docId} onClick={()=>{navigate(`/my-listings/${listing.docId}/offers`);setSearchQuery("")}} 
                            // Hover effect changed to slight White opacity
                            className="hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            {/* Title Column */}
                            <td className="whitespace-nowrap py-4 pl-6 pr-3 text-m font-medium text-white truncate max-w-xs">
                              {listing.title}
                            </td>
                            {/* Price Column - Gold Accent */}
                            <td className={`whitespace-nowrap px-3 py-4 text-m ${ACCENT_GOLD} font-semibold`}>
                              ${listing.price}
                            </td>
                            {/* Location Column */}
                            <td className="whitespace-nowrap px-3 py-4 text-m text-white/70">
                              {listing.location}
                            </td>
                            {/* Date Listed Column */}
                            <td className="whitespace-nowrap px-3 py-4 text-m text-white/70">
                              {listing.dateListed.toDate().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year:'numeric'})}
                            </td>
                            {/* Number of Offers Column - Gold Accent */}
                            <td className={`whitespace-nowrap text-center ${ACCENT_GOLD} font-bold pl-3 py-4 text-m`}>
                              {listing.offers}
                            </td>
                            {/* Highest Bid Column */}
                            <td className="whitespace-nowrap text-center pr-3 py-4 text-m text-white/70">
                              {listing.highestOffer > 0 ? `$${listing.highestOffer}` : "N/A"}
                            </td>
                            {/* View Listing Button - Gold BG, Dark Purple Text */}
                            <td className="relative whitespace-nowrap py-4 pr-6 pl-3 text-right text-sm font-medium">
                              <button
                                className={`text-[#A38200] px-3 py-1 ${ACCENT_GOLD_BG} ${DARK_PURPLE_TEXT} font-semibold rounded-2xl ${ACCENT_HOVER} hover:shadow-xl`}
                                onClick={(e)=>{e.stopPropagation();handleOpenEditListingModal(listing)}}>
                                  Edit
                              </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success("Logout Successful!", {toastId: 'logout-success'});
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  const handleOpenEditListingModal = (listing: Listing) => {
    setNewTitle(listing.title);
    setNewPrice(listing.price);
    setNewCategory(listing.categoryID);
    setNewLocation(listing.location);
    setNewDescription(listing.Description);
    setNewImage(listing.image);
    setNewCondition(listing.condition || "");
    setSelectedListing(listing);
    setShowSelectedListing(true);
  }

  const handleCloseEditListingModal = () => {
    setNewTitle("");
    setNewPrice(null);
    setNewCategory("");
    setNewLocation("");
    setNewDescription("");
    setNewImage("");
    setNewCondition("");
    setSelectedListing(null);
    setShowSelectedListing(false);
    setShowDeleteConfirm(false); // Close delete confirm if open
  }

  const handleChangeListing = async (listing:Listing) => {
    if (!newTitle || newPrice === null || !newLocation || !newDescription) {
      toast.warn("Please fill in all required fields.", {toastId: 'create-listing-error'});
      return;
    }
    if (newPrice < 1) {
      toast.warn("Please enter a valid price.", {toastId: 'price-error'});
      return;
    }
    if (newCategory === "") {
      toast.warn("Please select a category.", {toastId: 'category-error'});
      return;
    }
    if (newCondition === "") {
        toast.warn("Please select a condition.", {toastId: 'condition-error'});
        return;
    }
    try {
      await updateDoc(doc(db, "Inventory", listing.docId), {
        Description: newDescription,
        available: true,
        categoryID: newCategory,
        // Using new Date() here for dateListed might overwrite the original listing date. 
        // It's usually better to only update lastModified.
        // I will update the code to use serverTimestamp() for lastModified only, and remove dateListed update.
        // dateListed: new Date(), 
        image: newImage || "https://via.placeholder.com/300x200",
        location: newLocation,      
        price: newPrice || null,
        title: newTitle,
        condition: newCondition,
        lastModified: serverTimestamp()
      });
      setReloadTrigger(prev => prev + 1); // Trigger re-fetch of listings
    } catch (e) {
      console.error("Error adding document: ", e);
    } finally {
      handleCloseEditListingModal();
      toast.success("Listing changed successfully!");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
      // Limit to 5 images
      if (uploadedImages.length + fileArray.length > 5) {
      toast.warn("You can only upload up to 5 images.");
      return;
      }
      setUploadedImages([...uploadedImages, ...fileArray]);
    }
  }

  const handleRemoveImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    setPreviewImageIndex(0); // Always go back to first image
  }

  const handleDeleteListing = async (listing:Listing) => {
    // Clean up associated favorite records
    const batch = writeBatch(db);
    const favoritesRef=collection(db, "Favorites");
    const favQuerySnapshot = await getDocs(query(favoritesRef, where("listingID", "==", listing.docId)));
    if (favQuerySnapshot.empty) {
          console.log(`No favorite records found for listing:${listing.docId}. Cleanup complete.`);
    }
    else {
        favQuerySnapshot.forEach((doc) => {
          batch.delete(doc.ref)
        }
    )}

    // Cleans up all associated chats
    const offersRef=collection(db,"Inventory", listing.docId, "offers")
    const offerSnapshot = await getDocs(offersRef)
    if (offerSnapshot.docs.length<=1){
      console.log(`No chat records found for listing:${listing.docId}. Cleanup complete.`);
    } else {
      offerSnapshot.forEach((document) => {

        batch.delete(doc(db,"Chats",document.data().chatId))
      })
    }
    await batch.commit()

    // Delete the listing document
    await deleteDoc(doc(db, "Inventory", listing.docId));
    setReloadTrigger(prev => prev + 1); // Trigger re-fetch of listings
    setShowDeleteConfirm(false);
    handleCloseEditListingModal();
    toast.success("Listing successfully deleted!");
  }
    
  return (
        // Main BG changed to Dark Purple
        <div className={`min-h-screen ${PRIMARY_BG}`}>
            {/* Header Section (Navbar assumed to handle theme) */}
            <Navbar
              handleLogout={handleLogout}
              setShowLoginModal={()=>{}}
              setShowMenu={setShowMenu}
              navigate={navigate}
            />
            <Menu showMenu={showMenu} setShowMenu={setShowMenu}/>

            {/* Search Bar Container BG changed to Card BG color */}
            <div className={`${CARD_BG} border-b border-white/10 shadow-sm`}>
                <div className="max-w-7xl mx-auto px-6 py-6 flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                        {/*Possibly remove the category reset, if user needs to search in specific category*/}
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {setSearchQuery(e.target.value);setSelectedCategory("All")}}
                            placeholder="Search for items..."
                            // Input style change: dark BG, white text, Gold focus ring
                            className={`w-full pl-12 pr-4 py-3 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent ${PRIMARY_BG} text-white`}
                        /> 
                        {/*Clear search button if searchQuery is not empty*/}
                        {searchQuery!=="" && (
                        <button 
                            onClick={()=>setSearchQuery("")} 
                            className="absolute flex right-3 top-1/2 transform -translate-y-1/2 items-center justify-center">
                            <X color="white" size={20}></X>
                        </button>)}
                    </div>
                </div>
            </div>

            {/* Listings Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="mb-6">
                {/* Header text changed to white */}
                <h2 className="text-2xl font-bold text-white">
                  {filteredNum} {filteredNum === 1 ? "Listed Item" : "Listed Items"}
                </h2>
              </div>
              <div id="listing-grid" className="grid grid-col h-full gap-6">
                {renderListings()}
              </div>
            </div>

            {showSelectedListing && (
                    <div
                      // Modal Overlay BG changed to Dark Purple with high opacity
                      className={`fixed inset-0 ${PRIMARY_BG} bg-opacity-90 z-50 flex grid-cols-2 items-center justify-center p-4 gap-2`}
                      onClick={handleCloseEditListingModal}
                    >
                      {/* Listing Preview Container LEFT SIDE*/}
                      <div
                        // Modal Card BG changed to Card BG color
                        className={`relative ${CARD_BG} rounded-2xl max-w-5xl w-4/5 h-4/5 max-h-[90vh] shadow-2xl flex overflow-hidden border border-white/10`}
                        onClick={(e) => e.stopPropagation()}>
                        
                        {/* Left Side - Image with Carousel */}
                        {/* Image Placeholder BG changed to Gold/Dark Purple gradient */}
                        <div className="w-1/2 bg-gradient-to-br from-[#41206a]/50 to-[#FDD023]/50 flex items-center justify-center relative">
                          <img 
                            src={
                              uploadedImages.length > 0 
                                ? URL.createObjectURL(uploadedImages[previewImageIndex]) 
                                : selectedListing?.image || "https://img.freepik.com/free-photo/blurred-abstract-background_58702-1509.jpg?semt=ais_hybrid&w=740&q=80"
                            } 
                            alt={newTitle} 
                            className="w-full h-full object-cover rounded-tl-2xl rounded-bl-2xl" 
                          />
                          
                          {/* Carousel Navigation (colors remain dark/white for visibility over image) */}
                          {uploadedImages.length > 1 && (
                            <>
                              {/* Previous Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImageIndex(previewImageIndex === 0 ? uploadedImages.length - 1 : previewImageIndex - 1);
                                }}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all z-10"
                              >
                                <span className="text-2xl">‹</span>
                              </button>
                              
                              {/* Next Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImageIndex(previewImageIndex === uploadedImages.length - 1 ? 0 : previewImageIndex + 1);
                                }}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all z-10"
                              >
                                <span className="text-2xl">›</span>
                              </button>
                              
                              {/* Image Counter */}
                              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-medium">
                                {previewImageIndex + 1} / {uploadedImages.length}
                              </div>
                            </>
                          )}
                        </div>
            
                        {/* Right Side - Listing Info */}
                        <div className="w-1/2 flex flex-col">
                          {/* Header with Close Button */}
                          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                            {/* Category Tag: Dark Purple BG, Gold Text */}
                            <span className={`inline-block px-3 py-1 ${HEADER_BG} ${ACCENT_GOLD} rounded-full text-sm font-medium`}>
                              {newCategory || "Category"}
                            </span>
                          </div>
            
                          {/* Scrollable Content */}
                          <div className="overflow-y-auto p-6 h-4/5">
                            {/* Title and Price */}
                            <div className="mb-4">
                              {/* Title text changed to white */}
                              <h3 className="text-3xl font-bold text-white mb-2">{newTitle || "Title"}</h3>
                              {/* Price text changed to Gold */}
                              <p className={`text-4xl font-bold ${ACCENT_GOLD}`}>${newPrice || "0"}</p>
                            </div>
                            {/* Location */}
                            <div className="flex items-center text-white/80 mb-4 pb-4 border-b border-white/10">
                              <MapPin className="w-5 h-5 mr-2" />
                              <span className="text-lg">{newLocation || "Location"}</span>
                            </div>

                              
                            {/* Description */}
                            <div className="mb-6 h-1/2">
                              {/* Header text changed to white */}
                              <h4 className="text-lg pl-2 font-semibold text-white mb-2">Description</h4>
                              <textarea 
                                // Textarea style change: Dark BG, White text
                                className={`text-white rounded-xl p-4 pt-2 ${PRIMARY_BG} w-full h-full leading-relaxed resize-none border border-white/10`}
                                value={newDescription || "Enter description..."}
                                disabled>
                              </textarea>
                            </div>
                          </div>
            
                          {/* Seller Info */}
                            {/* Seller Info BG changed to Darker Purple */}
                            <div className={`${HEADER_BG} rounded-xl p-4 m-6`}>
                              {/* Header text changed to white */}
                              <h4 className="text-lg font-semibold text-white mb-2">Seller Information</h4>
                              <div className="flex items-center gap-3">
                                {/* Avatar BG remains Dark Purple */}
                                <div className={`w-12 h-12 ${HEADER_BG} rounded-full flex items-center justify-center text-white font-bold text-lg border border-white`}>{(currentUserData?.username.charAt(0).toUpperCase())}</div>
                                <div>
                                  {/* Text changed to white */}
                                  <p className="font-semibold text-white">{currentUserData?.username}</p>
                                  <p className="text-sm text-white/70">Member since {currentUserData?.accountCreation.toDate().toLocaleDateString('en-US', {month: 'long', year:'numeric'})}</p>
                                </div>
                              </div>
                            </div>
                        </div>
                      </div>
            
                      {/* Input Form Container  RIGHT SIDE*/}
                        <div
                          // Input Form Card BG changed to Card BG color
                          className={`flex flex-col relative ${CARD_BG} border-1 border-white/10 rounded-2xl max-w-3xl w-2/3 max-h-[90vh] shadow-xl overflow-hidden`}
                          onClick={(e) => e.stopPropagation()}
                        >
                        {/* Header */}
                        <div className="z-50 sticky top-0 bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                          {/* Header text changed to white */}
                          <h2 className="text-2xl font-bold text-white">Edit Listing</h2>
                          <button
                            onClick={handleCloseEditListingModal}
                            className="p-2 text-white/70 hover:text-white transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
            
                        {/* Form Content */}
                        <div className="p-6 overflow-y-auto">
                          <div className="flex flex-col space-y-6">
                            {/* Title */}
                            <div>
                              {/* Label text changed to white */}
                              <label className="block text-sm font-semibold text-white/80 mb-2">
                                Title <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="e.g., Calculus Textbook"
                                // Input style change: dark BG, white text, Gold focus ring
                                className={`w-full px-4 py-3 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent ${PRIMARY_BG} text-white`}
                              />
                            </div>
            
                            {/* Price and Category Row */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                 {/* Label text changed to white */}
                                <label className="block text-sm font-semibold text-white/80 mb-2">
                                  Price <span className="text-red-500">*</span>
                                </label>
                                <div className="relative z-0">
                                  {/* Dollar sign color changed to Gold */}
                                  <DollarSign className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${ACCENT_GOLD} w-5 h-5`} />
                                  <input
                                    type="number"
                                    value={newPrice || ""}
                                    onChange={(e) => setNewPrice(e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="0"
                                    // Input style change: dark BG, white text, Gold focus ring
                                    className={`w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent ${PRIMARY_BG} text-white`}
                                    min="0"
                                  />
                                </div>
                              </div>
            
                              <div>
                                 {/* Label text changed to white */}
                                <label className="block text-sm font-semibold text-white/80 mb-2">
                                  Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={newCategory}
                                  onChange={(e) => setNewCategory(e.target.value as Category)}
                                  // Input style change: dark BG, white text, Gold focus ring
                                  className={`w-full px-4 py-3 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent ${PRIMARY_BG} text-white`}
                                >
                                  <option value="" disabled>Select a category</option>
                                  {categories.filter(cat => cat !== "All").map((cat) => (
                                    <option key={cat} value={cat} className="text-gray-900 bg-gray-200">{cat}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
            
                           {/* Location */}
                          <div>
                             {/* Label text changed to white */}
                              <label className="block text-sm font-semibold text-white/80 mb-2">
                                Pickup Location <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={newLocation}
                                onChange={(e) => setNewLocation(e.target.value)}
                                // Input style change: dark BG, white text, Gold focus ring
                                className={`w-full px-4 py-3 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent ${PRIMARY_BG} text-white`}
                              >
                                <option value="" disabled>Select a safe meetup location</option>
                                <optgroup label="🛡️ Recommended Safe Spots" className="text-gray-900 bg-gray-200">
                                  {safeLocations.filter(loc => loc.safety === "high").map((loc) => (
                                    <option key={loc.name} value={loc.name}>
                                      {loc.icon} {loc.name}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="📍 Other Campus Locations" className="text-gray-900 bg-gray-200">
                                  {safeLocations.filter(loc => loc.safety === "medium").map((loc) => (
                                    <option key={loc.name} value={loc.name}>
                                      {loc.icon} {loc.name}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="⚠️ Off Campus" className="text-gray-900 bg-gray-200">
                                  {safeLocations.filter(loc => loc.safety === "low").map((loc) => (
                                    <option key={loc.name} value={loc.name}>
                                      {loc.icon} {loc.name}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                              
                              {/* Show location details when selected */}
                              {newLocation && safeLocations.find(loc => loc.name === newLocation) && (
                                <div className={`mt-2 p-3 ${HEADER_BG} rounded-lg`}>
                                  <p className="text-sm text-white/80">
                                    {safeLocations.find(loc => loc.name === newLocation)?.description}
                                  </p>
                                  {/* Time text changed to Gold */}
                                  <p className={`text-sm ${ACCENT_GOLD} font-medium mt-1`}>
                                    ⏰ {safeLocations.find(loc => loc.name === newLocation)?.hours}
                                  </p>
                                </div>
                              )}
                            </div>

                           
                          {/* Condition */ }
                            <div>
                               {/* Label text changed to white */}
                              <label className="block text-sm font-semibold text-white/80 mb-2">
                                Condition <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={newCondition}
                                onChange={(e) => setNewCondition(e.target.value)}
                                // Input style change: dark BG, white text, Gold focus ring
                                className={`w-full px-4 py-3 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent ${PRIMARY_BG} text-white`}
                              >
                                <option value="" disabled>Select condition</option>
                                <option value="New" className="text-gray-900 bg-gray-200">New</option>
                                <option value="Like New" className="text-gray-900 bg-gray-200">Like New</option>
                                <option value="Good" className="text-gray-900 bg-gray-200">Good</option>
                                <option value="Fair" className="text-gray-900 bg-gray-200">Fair</option>
                                <option value="Poor" className="text-gray-900 bg-gray-200">Poor</option>
                              </select>
                            </div>
                            
                            {/* Description */}
                            <div>
                              <label className="block text-sm font-semibold text-white/80 mb-2">
                                Description
                              </label>
                              <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                rows={4}
                                placeholder="Provide a detailed description of the item..."
                                // Input style change: dark BG, white text, Gold focus ring
                                className={`w-full px-4 py-3 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent ${PRIMARY_BG} text-white resize-none`}
                              ></textarea>
                            </div>
                            
                            {/* Images (Note: image upload logic needs backend implementation to be fully functional) */}
                            <div>
                              <label className="block text-sm font-semibold text-white/80 mb-2">
                                Images (Max 5)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="w-full text-white/70"
                              />
                              <div className="mt-4 flex flex-wrap gap-3">
                                {uploadedImages.map((file, index) => (
                                  <div key={index} className="relative w-20 h-20">
                                    <img 
                                      src={URL.createObjectURL(file)} 
                                      alt={`preview ${index}`} 
                                      className="w-full h-full object-cover rounded-lg border border-white/10"
                                    />
                                    <button
                                      onClick={() => handleRemoveImage(index)}
                                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                                    >
                                      <X className="w-3 h-3"/>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {selectedListing && (
                          <div className={`p-6 border-t border-white/10 flex justify-between items-center bg-white/5`}>
                            {/* Delete Button: Red BG */}
                            <button
                                onClick={(e) => {e.stopPropagation(); setShowDeleteConfirm(true)}}
                                className={`flex items-center px-4 py-3 text-sm font-semibold text-white ${ACCENT_RED_BG} rounded-xl hover:bg-red-800 transition shadow-lg`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Listing
                              </button>
                              
                              <button
                                onClick={(e) => {e.stopPropagation(); handleChangeListing(selectedListing)}}
                                // Update Button: Gold BG, Dark Purple Text
                                className={`flex items-center px-6 py-3 text-sm font-semibold ${ACCENT_GOLD_BG} ${DARK_PURPLE_TEXT} rounded-xl ${ACCENT_HOVER} transition shadow-lg`}
                              >
                                Save Changes
                              </button>
                          </div>
                        )}

                        {/* Delete Confirmation Modal */}
                        {showDeleteConfirm && (
                          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                            <div className={`rounded-xl shadow-2xl w-full max-w-md p-6 ${CARD_BG}`}>
                              <div className="flex items-center mb-4">
                                <TriangleAlert className="w-6 h-6 text-red-500 mr-3" />
                                <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
                              </div>
                              <p className="text-white/80 mb-6">
                                Are you sure you want to delete the listing: **{selectedListing?.title}**? 
                                This action is permanent and will remove all associated offers and chats.
                              </p>
                              <div className="flex justify-end space-x-3">
                                <button
                                  onClick={(e) => {e.stopPropagation(); setShowDeleteConfirm(false)}}
                                  className={`px-4 py-2 text-sm font-semibold text-white/80 ${HEADER_BG} rounded-lg hover:bg-white/10 transition`}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteListing(selectedListing!)}
                                  className={`px-4 py-2 text-sm font-semibold text-white ${ACCENT_RED_BG} rounded-lg hover:bg-red-800 transition`}
                                >
                                  Confirm Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        </div>
                    </div>
                  )}

            <CustomToastContainer />
        </div>
    );
}