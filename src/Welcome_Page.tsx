import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "./auth/AuthContext.tsx";
import { Search, Filter, MapPin, Heart, X, WandSparkles } from "lucide-react";
import { auth, db } from "./firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from 'react-toastify';
import { increment, collection, addDoc, getDoc, getDocs, doc, getDocsFromServer, setDoc, updateDoc, query, Timestamp, where, serverTimestamp, deleteDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase/firebase";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import Menu from "./components/menu.tsx"
import Navbar from "./components/navbar.tsx";
import CustomToastContainer from "./components/toast.tsx"
import ReportUserButton from "./components/reportUser.tsx";
import { motion, AnimatePresence } from "framer-motion";





type Category = "All" | "Suggested" | "Tickets" | "Textbooks" | "Clothing" | "Electronics" | "Other" | string;

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
  }
];

interface Listing {
  docId: string;
  title: string;
  categoryID: Category;
  Description: string;
  price: number;
  dateListed: Timestamp;
  image: string;
  images?: string[]; 
  location: string;
  sellerUID: string;
  highestOffer: number;
  offers: number;
  available: boolean;
  lastModified: Timestamp;
  condition: string;
  userId: string;
}

interface Offer {
  parentId: string
  listingTitle: string
  amount: number
  note: string
  buyerUID: string
  timeStamp: Timestamp
  status: string
}

interface sellerInfo {
  accountCreation: Timestamp;
  email: string;
  username: string;
}

const InitialFilters = {
  priceRange: [0, 500],
  sortBy: "Newest",
  condition: "All",
  distance: 10,
  postedDate: "All",
}

export default function WelcomePage() {
  const navigate = useNavigate();

  const { currentUser, currentUserData, logout } = useAuth();

  const [email, setEmail] = useState<string>('')
  const [filteredNum, setFilteredNum] = useState<number>(0);
  const [filters, setFilters] = useState(InitialFilters);
  const [invalidEmail, setInvalidEmail] = useState<boolean>(false);
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingOwner, setListingOwner] = useState<sellerInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState<Category>("");
  const [newLocation, setNewLocation] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [offerAmount, setOfferAmount] = useState<number | null>(null);
  const [offerMade, setOfferMade] = useState<boolean>(false);
  const [offerNote, setOfferNote] = useState<string>("");
  const [password, setPassword] = useState('')
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showCreateListing, setShowCreateListing] = useState<boolean>(false);
  const [showLikedOnly, setShowLikedOnly] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [newCondition, setNewCondition] = useState<string>("");
  const [showSafetyTips, setShowSafetyTips] = useState(false);

  const lsuEmailRegex = /^[^@\s]+@lsu\.edu$/i
  const categories: Category[] = ["All", "Recommended", "Tickets", "Textbooks", "Clothing", "Electronics", "Other"];

  // Fetch listings from Firestore
  const fetchListings = async (): Promise<Listing[]> => {
    try{
      const querySnapshot = await getDocs(collection(db, "Inventory")); 
      const fetchedListings: Listing[] = querySnapshot.docs.filter(doc => {
        const data = doc.data() as Listing;
        return currentUser?.uid !== data.sellerUID && data.available}
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
          images: data.images || [],
          location: data.location,
          highestOffer: data.highestOffer,
          offers: data.offers,
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
      const isLiked = likedItems.includes(listing.docId); //Collects liked items from user data
      const matchesLikedFilter = !showLikedOnly || isLiked;
      return matchesCategory && matchesSearch && matchesLikedFilter;
    });
    setFilteredNum(filteredListings.length);
  }, [listings, searchQuery, selectedCategory, showLikedOnly]);

  // Loads all listings and liked items
  const reloadData = async () => {
    const loadListings = async () => {
      setLoading(true);
      const fetchedListings = await fetchListings();
      setListings(fetchedListings);

      if (currentUser) {
        try {
          const favoritesQuery = query(collection(db, "Favorites"), where("userUID", "==", currentUser.uid));
          const favoritesSnapshot = await getDocs(favoritesQuery);
          const favoriteListingIDs: string[] = [];
          favoritesSnapshot.forEach((doc) => {
            const data = doc.data().listingID;
            favoriteListingIDs.push(data);
          });
          setLikedItems(favoriteListingIDs);
        } catch (error) {
          console.error("Error fetching favorite listings: ", error);
        }
      }
      else {setLikedItems([]);}
      setLoading(false);
    };
    loadListings();
  }

  // Called upon loading page to fetch listings
  useEffect(() => {
    reloadData();
  }, [currentUser]);

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
  }, [selectedListing]);

  const handleSelectListing = async (listing: Listing) => {
    const docRef = doc(db, "Inventory", listing.docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const updatedListing = {
        docId: docSnap.id,
        ...docSnap.data()
      } as Listing;
      // If listing has been modified since listings were fetched, update selected listing
      if (updatedListing.lastModified !== listing.lastModified){
        setListings(prevListings => prevListings.map(item=>
          item.docId === listing.docId ? updatedListing : item)
        )
        setSelectedListing(updatedListing)
        checkForOffer(updatedListing);
      } else {
        setSelectedListing(listing);
      }
    } else {
      toast.error("This listing is no longer available.", {toastId: 'listing-unavailable'});
      setListings(prevListings => prevListings.filter(item => item.docId !== listing.docId));
      setSelectedListing(null);
    }
  }

  // Favorite listing handler
  const handleFavorite = async (listingid: string) => {
    if (currentUser == null) {
      toast.warn("Please Login or Register to favorite listings.", {toastId: 'favorite-error'});
      return;
    } 
    if (likedItems.includes(listingid)) {
      const favoriteQuery = query(
        collection(db, "Favorites"), 
        where("userUID", "==", auth.currentUser?.uid), 
        where("listingID", "==", listingid)
      );
      const querySnapshot = await getDocs(favoriteQuery);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      setLikedItems(prev => prev.filter(id => id !== listingid));
      toast.success("Removed from favorites!", {toastId: 'remove-favorite-success'});
    }
    else {
      await addDoc(collection(db, "Favorites"), {
        userUID: auth.currentUser?.uid,
        listingID: listingid,
        timestamp: serverTimestamp()
      });
      setLikedItems(prev => [...prev, listingid]);
      toast.success("Added to favorites!", {toastId: 'add-favorite-success'});
    }
  }

  // Once listings are fetched, render them
  const renderListings = () => {
  if (loading) {
    return (
      <div className="col-span-full text-center py-20">
        <div className="animate-spin inline-block w-12 h-12 border-4 border-t-[#FDD023] border-white/20 rounded-full mb-4"></div>
        <p className="text-white/70 text-lg">Loading listings...</p>
      </div>
    );
  }

  const filteredListings = listings
    .filter((listing) => {
      const matchesCategory = selectedCategory === "All" || listing.categoryID === selectedCategory;
      const matchesSearch =
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.Description.toLowerCase().includes(searchQuery.toLowerCase());
      const isLiked = likedItems.includes(listing.docId);
      const matchesLikedFilter = !showLikedOnly || isLiked;
      const matchesPrice = listing.price >= filters.priceRange[0] && listing.price <= filters.priceRange[1];
      const matchesCondition = filters.condition === "All" || listing.condition === filters.condition;

      let matchesPostedDate = true;
      if (filters.postedDate !== "All") {
        const now = new Date();
        const posted = listing.dateListed.toDate();
        if (filters.postedDate === "Today") {
          matchesPostedDate = posted.toDateString() === now.toDateString();
        } else if (filters.postedDate === "This Week") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay()); 
          matchesPostedDate = posted >= startOfWeek;
        } else if (filters.postedDate === "This Month") {
          matchesPostedDate = posted.getMonth() === now.getMonth() && posted.getFullYear() === now.getFullYear();
        }
      }

      // Distance filter placeholder
      const matchesDistance = true; 

      return matchesCategory && matchesSearch && matchesLikedFilter && matchesPrice && matchesCondition && matchesPostedDate && matchesDistance;
    })
    .sort((a, b) => {
      if (filters.sortBy === "Newest") return b.dateListed.seconds - a.dateListed.seconds;
      if (filters.sortBy === "Lowest Price") return a.price - b.price;
      if (filters.sortBy === "Highest Price") return b.price - a.price;
      return 0;
    });

  if (filteredListings.length === 0) {
    return (
      <div className="col-span-full text-center py-20">
        <div className="mb-4 text-6xl opacity-30">🔍</div>
        <p className="text-white/70 text-xl mb-2">No listings found</p>
        <p className="text-white/50 text-sm">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return filteredListings.map((listing) => (
    <div
      key={listing.docId}
      onClick={() => handleSelectListing(listing)}
      className="listing-card bg-white/5 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl cursor-pointer border border-white/10 overflow-hidden group transition-all"
    >
      <div className="aspect-square bg-gradient-to-br from-[#41206a] to-[#6b2fb5] flex items-center justify-center">
        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-white/95 group-hover:text-[#FDD023] transition-colors flex-grow truncate">
            {listing.title}
          </h3>
          <button 
            onClick={(e)=>{e.stopPropagation();handleFavorite(listing.docId)}} 
            className={`transition-colors flex-shrink-0 ml-2 ${
              likedItems.includes(listing.docId) ? "text-[#FDD023]" : "text-white/40 hover:text-[#FDD023]"
            }`}
          >
            <Heart className={`w-5 h-5 ${likedItems.includes(listing.docId) ? "fill-[#FDD023]" : "fill-none"}`}/>
          </button>
        </div>
        <p className="text-2xl font-bold text-[#FDD023] mb-2">${listing.price}</p>
        <div className="flex items-center text-sm text-white/70">
          <MapPin className="w-4 h-4 mr-1" />
          {listing.location}
        </div>
      </div>
    </div>
  ));
};

  // Closes selected listing
  const handleCloseListing = () => {
    setSelectedListing(null);
    setListingOwner(null);
    setUploadedImages([]);
  }

  // Login handler
  const handleLogin = async (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget);
    const {email, password} = Object.fromEntries(formData.entries()) as Record<string,string>;
    try{
        setLoading(true);
        await signInWithEmailAndPassword(auth, email, password)
        navigate('/listings');
        toast.success("Login Successful!", {toastId: 'login-success'});
        setShowLoginModal(false);
    }catch(error){
        toast.error("Login Failed. Please check your credentials.", {toastId: 'login-failed'});
        console.log(error);
    }
    setLoading(false);
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      setLikedItems([]);
      navigate('/listings');
      toast.success("Logout Successful!", {toastId: 'logout-success'});
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  // Function to upload images to Firebase Storage
  const uploadImagesToStorage = async (images: File[], listingId: string): Promise<string[]> => {
    const uploadPromises = images.map(async (image, index) => {
      const imageRef = ref(storage, `listings/${listingId}/${index}_${image.name}`);
      await uploadBytes(imageRef, image);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    });
  
    return Promise.all(uploadPromises);
  }

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

  // Close create listing modal
  const handleCloseNewListingModal = () => {
    setNewTitle("");
    setNewPrice(null);
    setNewCategory("");
    setNewLocation("");
    setNewDescription("");
    setPreviewImageIndex(0);
    setUploadedImages([]);
    setShowCreateListing(false);
  }

  // Close offer modal
  const handleCloseOfferModal = () => {
    setOfferAmount(null)
    setOfferNote("")
    setShowOfferModal(false)
  }

  // Submit new listing to Firestore
  const handleSubmitListing = async ()  => {
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
    if (uploadedImages.length === 0) {
      alert("Please upload at least one photo.");
      return;
    }
    try {
      setLoading(true);
      toast.info("Uploading images...", {toastId: 'uploading'});

      const tempListingId = `listing_${Date.now()}_${auth.currentUser?.uid}`;
      const imageUrls = await uploadImagesToStorage(uploadedImages, tempListingId);
      
      toast.info("Creating listing...", {toastId: 'creating'});

      const newDocRef = await addDoc(collection(db, "Inventory"), {
        Description: newDescription,
        available: true,
        categoryID: newCategory,
        dateListed: new Date(),
        image: imageUrls[0], 
        images: imageUrls, 
        location: newLocation,      
        price: newPrice || null,
        highestOffer: 0,
        offers: 0,
        sellerUID: auth.currentUser?.uid || "anonymous",
        title: newTitle,
        condition: newCondition,
        lastModified: serverTimestamp()
      });
      const offersRef = collection(newDocRef, "offers")
      await setDoc(doc(offersRef, "placeholder"),{})

      toast.success("Listing created successfully!", {toastId:"creation-success"});
      handleCloseNewListingModal();

      // Refresh listings to show the new one
      const fetchedListings = await fetchListings();
      setListings(fetchedListings);
    
    } catch (e) {
      console.error("Error creating listing: ", e);
      toast.dismiss('uploading');
      toast.dismiss('creating');
      toast.error("Failed to create listing. Please try again.");
    } finally {
      handleCloseNewListingModal();
      setLoading(false);
    }
  }

  // Checks if user has already made an offer on the selected listing
  const checkForOffer = (listing: Listing) => {
    const offersCollectionRef = collection(db, "Inventory", listing!.docId, "offers");
    const existingOfferQuery = query(offersCollectionRef, where("buyerUID", "==", currentUserData?.uid));
    getDocs(existingOfferQuery).then((querySnapshot) => {
      if (!querySnapshot.empty) {
        toast.warn("You have already made an offer on this listing.", {toastId: "existing-offer-warning"});
        setOfferMade(true);
      } else {
        setOfferMade(false);
      }
    }).catch((error) => { console.log(error);});
    setOfferMade(false);
  }

  // Submit new offer
  const handleSubmitOffer = async () => {
    setLoading(true)
    toast.info("Submitting offer...", {toastId: "submit-pending-info"})
    try {
      const listingRef = doc(db,"Inventory",selectedListing!.docId);
      const offersCollection = collection(listingRef, "offers")
      const newRef = await addDoc(offersCollection, {
        parentId: selectedListing?.docId,
        listingTitle: selectedListing?.title,
        amount: offerAmount,
        note: offerNote,
        buyerUID: currentUserData?.uid,
        timeStamp: serverTimestamp(),
        status: "pending",
      } as Offer)
      toast.success("Offer submitted successfully!", {toastId: "submit-offer-success"})
      await updateDoc(newRef, {
        offerId: newRef.id
      })
      const listingSnapshot = await getDoc(listingRef)
      const listingData = listingSnapshot.data()
      if (listingData && listingData.highestOffer < offerAmount!){
        await updateDoc(listingRef, {highestOffer: offerAmount})
      }
      await updateDoc(listingRef, {offers:increment(1)})
    } catch (error) {
      console.log("Error submitting offer:", error)
      toast.error("Error occured trying to submit offer", {toastId: "submit-offer-error"})
    }
    setSelectedListing(null)
    handleCloseOfferModal()
    setLoading(false)
  }

  return (
    <div className="h-screen  bg-gray-50 bg-gradient-to-b from-[#12091a] via-[#1a0f2e] to-[#2c1844] overflow-x-hidden">
      <Navbar
        handleLogout={handleLogout}
        setShowLoginModal={setShowLoginModal}
        setShowMenu={setShowMenu}
        navigate={navigate}/>
      <Menu showMenu={showMenu} setShowMenu={setShowMenu}/>
      <CustomToastContainer/>
      {/* Search & Filter Section */}
        <div className=" from-[#12091a] via-[#1a0f2e] to-[#2c1844] overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-6 py-6 flex gap-3 items-center">
            {/* Liked Listings Toggle */}
            <button
              onClick={
                auth.currentUser
                ? () => setShowLikedOnly((prev) => !prev)
                : () =>
                  toast.warn("Please login to view liked listings", {
                    toastId: "like-filter",
                  })
              }
              className={`group px-3 py-2 border-2 rounded-xl transition-all duration-200 
                ${showLikedOnly 
                ? "bg-[#FDD023] border-[#FDD023]" 
                : "bg-white/5 border-white/20 hover:border-[#FDD023]"}`}
            >
              <Heart
                className={`w-6 h-6 stroke-2 transition-all duration-200 
                  ${showLikedOnly
                  ? "fill-[#FDD023] stroke-white"
                  : "fill-none stroke-white/70 group-hover:stroke-[#FDD023]"}`}
              />
            </button>

            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for items..."
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent text-white placeholder-white/50"
              />
              {searchQuery !== "" && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center"
                >
                  <X color="white" size={20} className="opacity-50 hover:opacity-100" />
                </button>
              )}
            </div>

            {/* Single Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-[#FDD023] text-[#41206a] rounded-lg font-semibold hover:brightness-95 transition-all flex items-center gap-2"
            >
            <Filter className="w-5 h-5" />
            {showFilters ? "Hide Filters" : "Filters"}
            </button>
          </div>
        </div>

      {/* Categories */}
        <div className="">
          <div className="max-w-7xl mx-auto px-6 py-4 pt-2">
            <div className="flex gap-3 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all 
                  ${selectedCategory === category 
                  ? category === "Recommended" 
                    ? "bg-[#FDD023] text-[#41206a]"
                    : "bg-white/20 text-white border-2 border-[#FDD023]"
                  : category === "Recommended"
                    ? "bg-[#FDD023]/80 text-[#41206a] hover:bg-[#FDD023]"
                    : "bg-white/5 text-white/80 hover:bg-white/10 border border-white/20"
                  }`}
              >
                {category === "Recommended" && <WandSparkles className="h-4 w-4 mr-1"/>}
                {category}
              </button>
            ))}
            </div>
          </div>
        </div>

      {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#2c1844] p-4 rounded-xl shadow mb-6 overflow-hidden max-w-7xl mx-auto px-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold mb-3 text-[#FDD023]">Filters</h2>
                <button onClick={()=>setFilters(InitialFilters)} className="text-white text-center font-semibold bg-purple-900 px-2 rounded-xl hover:shadow-sm ">
                  Clear
                </button>
              </div>

              {/* Price Range */}
              <label className="block mb-2 text-white">
                Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </label>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={filters.priceRange[1]}
                onChange={(e) =>
                  setFilters({ ...filters, priceRange: [0, Number(e.target.value)] })
                }
                className="w-full mb-4 accent-[#FDD023] "
              />

              {/* Sort */}
              <label className="block mb-2 text-white">Sort by:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full border rounded p-2 mb-4 bg-[#2c1844] text-[#FDD023]"
              >
                <option>Newest</option>
                <option>Lowest Price</option>
                <option>Highest Price</option>
              </select>

              {/* Condition */}
              <label className="block mb-2 text-white">Condition:</label>
              <select
                value={filters.condition}
                onChange={(e) =>
                  setFilters({ ...filters, condition: e.target.value })
                }
                className="w-full border rounded p-2 mb-4 bg-[#2c1844] text-[#FDD023]"
              >
                <option>All</option>
                <option>New</option>
                <option>Like New</option>
                <option>Good</option>
                <option>Fair</option>
              </select>

              {/* Distance */}
              <label className="block mb-2 text-white">
                Distance from Campus (miles): {filters.distance}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={filters.distance}
                onChange={(e) =>
                  setFilters({ ...filters, distance: Number(e.target.value) })
                }
                className="w-full mb-4 accent-[#FDD023]"
              />

              {/* Posted Date */}
              <label className="block mb-2 text-white">Posted Date:</label>
              <select
                value={filters.postedDate}
                onChange={(e) =>
                  setFilters({ ...filters, postedDate: e.target.value })
                }
                className="w-full border rounded p-2 bg-[#2c1844] text-[#FDD023]"
              >
                <option>All</option>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </motion.div>
          )}
        </AnimatePresence>
      
      {/* Listings Grid */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FDD023] to-white">
              {filteredNum} {filteredNum === 1 ? "Listing" : "Listings"} Available
            </h2>
            <p className="text-white/70 mt-2">Browse items from verified LSU students</p>
          </div>
          <div id="listing-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderListings()}
          </div>
        </div>
      
      {/* New Listing Button */}
        <button onClick={currentUser == null 
          ? ()=> {toast.warn("Please login to create a listing.", {toastId:'login-to-create'}); setShowLoginModal(true)}
          : ()=> {setShowCreateListing(true); }} 
          className="fixed bottom-8 right-8 bg-yellow-500 text-white p-2 rounded-full w-12 h-12 hover:w-44 flex items-center shadow-lg transition-all duration-300 ease-in-out group">    
          <span className="text-2xl text-purple-900 font-bold leading-none absolute inset-0  mb-1 flex items-center justify-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-0">
            +
          </span>
          <span className=" text-m text-purple-900 font-bold opacity-0 group-hover:opacity-100 transition-all hover:duration-300 hover:delay-190 whitespace-nowrap w-full flex justify-center">
            Create new listing
          </span>
        </button>

      {/* Listing Detail Modal */}
        {selectedListing && listingOwner!=null &&(
        <div
          // Dark background overlay
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={()=>{handleCloseListing()}}
        >
          <div
            // Main modal container: dark purple background
            className="bg-[#1a0f2e] rounded-2xl max-w-5xl w-full h-[95vh] max-h-[110vh] overflow-hidden shadow-2xl flex"
            onClick={(e) => {e.stopPropagation();handleCloseOfferModal()}}
          >
            {/* Left Side - Image Carousel */}
            <div className="w-1/2 bg-gradient-to-br from-[#12091a] to-[#2c1844] flex items-center justify-center relative overflow-hidden">
              {selectedListing.images && selectedListing.images.length > 0 ? (
                <Carousel
                  showArrows={true}
                  showThumbs={false}
                  showIndicators={true}
                  showStatus={false}
                  infiniteLoop={true}
                  dynamicHeight={false}
                  emulateTouch={true}
                  className="w-full h-full"
                  renderArrowPrev={(onClickHandler, hasPrev) =>
                    hasPrev && (
                      <button
                        type="button"
                        onClick={onClickHandler}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all z-10"
                      >
                        <span className="text-2xl">‹</span>
                      </button>
                    )
                  }
                  renderArrowNext={(onClickHandler, hasNext) =>
                    hasNext && (
                      <button
                        type="button"
                        onClick={onClickHandler}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all z-10"
                      >
                        <span className="text-2xl">›</span>
                      </button>
                    )
                  }
                >
                  {selectedListing.images.map((url: string, index: number) => (
                    <div key={index} className="h-full flex items-center justify-center bg-gradient-to-br from-[#12091a] to-[#2c1844]">
                      <img
                        src={url}
                        alt={`${selectedListing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </Carousel>
              ) : (
                <img
                  src={selectedListing.image}
                  alt={selectedListing.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </div>

            {/* Right Side - Details */}
              <div className="w-1/2 flex flex-col text-white">
              {/* Header with Close Button */}
                <div className="px-6 py-3 border-b border-zinc-700 flex items-center justify-between bg-[#2c1844]">
                
                {/* Category Tag (Gold Accent) */}
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-3 py-1 bg-[#FDD023] text-black rounded-full text-sm font-medium">
                      {selectedListing.categoryID}
                    </span>
                    <span className="inline-block px-3 py-1 bg-gray-700 text-white rounded-full text-sm font-medium">
                      {selectedListing.condition || "Condition not set"}
                    </span>
                  </div>
                  <button
                  onClick={()=>{handleCloseListing()}}
                  className="text-white hover:text-[#FDD023] w-8 h-8 flex items-center justify-center rounded-full transition-all"
                  >
                  <X size={30} color="#FDD023" />
                  </button>
                  </div>

              {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 ">
                {/* Title and Price */}
                <div className="mb-6">
                  {/* Title and Price text color updated */}
                  <h3 className="text-3xl font-bold text-[#FDD023] mb-3">{selectedListing.title}</h3>
                  <p className="text-4xl font-bold text-white">${selectedListing.price}</p>
                </div>

                {/* Location */}
               <div className="bg-[#2c1844] rounded-xl p-4 mb-6 border border-zinc-700">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#FDD023]" />
                  Pickup Location
                </h4>
                
                <div className="space-y-2">
                  <p className="font-semibold text-[#FDD023] text-lg">
                    {safeLocations.find(loc => loc.name === selectedListing.location)?.icon} {selectedListing.location}
                  </p>
                  
                  {/* Show location details if it's a predefined safe spot */}
                  {safeLocations.find(loc => loc.name === selectedListing.location) && (
                    <>
                      <p className="text-sm text-gray-300">
                        {safeLocations.find(loc => loc.name === selectedListing.location)?.description}
                      </p>
                      <p className="text-sm text-gray-400">
                        ⏰ <strong>Best times:</strong> {safeLocations.find(loc => loc.name === selectedListing.location)?.hours}
                      </p>
                      
                      {/* Safety badge */}
                      {safeLocations.find(loc => loc.name === selectedListing.location)?.safety === "high" && (
                        <span className="inline-block px-3 py-1 bg-green-700 text-white rounded-full text-xs font-semibold">
                          ✅ Recommended Safe Spot
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Link to open in Google Maps */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=LSU+${encodeURIComponent(selectedListing.location)}+Baton+Rouge+LA`;
                      window.open(mapsUrl, '_blank');
                    }}
                    className="text-sm text-[#FDD023] hover:underline flex items-center gap-1 mt-2 font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    Open in Google Maps
                  </button>
                </div>
              </div>

              {/* Description */}
                <div className="mb-6 h-13/30">
                  <h4 className="text-lg font-semibold text-white ml-2 mb-3">Description</h4>
                  <textarea 
                    className="text-gray-200 rounded-xl p-4 pt-2 pb-2 bg-[#2c1844] w-full h-full leading-relaxed resize-none border border-zinc-700"
                    value={selectedListing.Description || "Enter description..."}
                    disabled>
                  </textarea>
                </div>
              </div>

              {/* Seller Info */}
                <div className="bg-[#2c1844] rounded-xl p-4 m-6 mt-4 mb-1 py-2 h-460px">
                  <h4 className="text-lg font-semibold text-[#FDD023] mb-2">Seller Information</h4>
                  <div className="pb-1 flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      {/* Seller Initials (Gold Accent) */}
                      <div className="w-12 h-12 bg-[#FDD023] rounded-full flex items-center justify-center text-black font-bold text-lg">{(listingOwner?.username.charAt(0).toUpperCase())}</div>
                      <div>
                        <p className="font-semibold text-white flex items-center gap-3">
                          {listingOwner?.username}
                        </p>
                        <p className="text-sm text-gray-400">Member since {listingOwner?.accountCreation.toDate().toLocaleDateString('en-US', {month: 'long', year:'numeric'})}</p>
                      </div>
                    </div>

                    <div className="ml-4">
                      <ReportUserButton
                        reportedName={listingOwner?.username || 'Unknown User'}
                        reportedUID={selectedListing?.sellerUID}
                        listingId={selectedListing?.docId}
                        reporterName={currentUserData?.username}
                      />
                    </div>
                  </div>
                </div>

              {/* Action Buttons - Fixed at Bottom */}
                <div className="px-6 py-4">
                <div className="flex gap-3">
                  {/* Purchase Button (Gold Accent) */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    
                    if (!currentUser) {
                      toast.warn("Please login to purchase items.", {toastId: 'login-required'});
                      setShowLoginModal(true);
                      return;
                    }
                    
                    if (!selectedListing) {
                      toast.error("No listing selected", {toastId: 'no-listing'});
                      return;
                    }
                    
                    // Check if user is trying to buy their own listing
                    if (selectedListing.sellerUID === currentUser.uid) {
                      toast.warn("You cannot purchase your own listing!", {toastId: 'own-listing'});
                      return;
                    }
                    
                    if (!selectedListing.docId) {
                      toast.error("Invalid listing ID", {toastId: 'invalid-id'});
                      return;
                    }
                    if (!selectedListing.available) {
                      toast.warn("This listing is no longer available.", {toastId: 'unavailable-listing'});
                      handleCloseListing();
                      return;
                    }
                    
                    try {
                      setLoading(true);
                      
                      // Verify document exists and is still available
                      const listingRef = doc(db, "Inventory", selectedListing.docId);
                      const listingSnap = await getDoc(listingRef);
                      if (!listingSnap.exists()) {
                        toast.error("This listing no longer exists", {toastId: 'listing-not-found'});
                        handleCloseListing();
                        return;
                      }
                      
                      const listingData = listingSnap.data();
                      if (!listingData.available) {
                        toast.warn("Sorry, this item was just purchased by someone else!", {toastId: 'just-sold'});
                        handleCloseListing();
                        return;
                      }
                      
                      // 1. Mark listing as sold
                      await updateDoc(listingRef, {
                        available: false,
                        soldTo: currentUser.uid,
                        soldAt: serverTimestamp()
                      });
                      
                      // 2. Create or find existing chat with seller
                      const chatsRef = collection(db, "Chats");
                      const existingChatQuery = query(
                        chatsRef,
                        where("listingTitle", "==", selectedListing.title),
                        where("senderUID", "==", currentUser.uid),
                        where("recUID", "==", selectedListing.sellerUID)
                      );
                      
                      const existingChats = await getDocs(existingChatQuery);
                      let chatId;
                      
                      if (!existingChats.empty) {
                        // Use existing chat
                        chatId = existingChats.docs[0].id;
                        
                        // Add purchase message to existing chat
                        await addDoc(collection(db, "Chats", chatId, "messages"), {
                          senderId: currentUser.uid,
                          text: `Hi! I'd like to purchase "${selectedListing.title}" for $${selectedListing.price}. Let's arrange a pickup!`,
                          timestamp: serverTimestamp(),
                          type: "text"
                        });
                        
                        // Update last message
                        await updateDoc(doc(db, "Chats", chatId), {
                          lastMessage: `🎉 Purchase request for ${selectedListing.title}`,
                          lastMessageSender: currentUser.uid,
                          lastMessageTime: serverTimestamp(),
                        });
                        
                      } else {
                        // Create new chat
                        const newChatRef = await addDoc(chatsRef, {
                          listingTitle: selectedListing.title,
                          listingAmount: selectedListing.price,
                          senderUID: currentUser.uid,
                          senderName: currentUserData?.username || "Buyer",
                          recUID: selectedListing.sellerUID,
                          recName: listingOwner.username,
                          lastMessage: `🎉 Purchase request for ${selectedListing.title}`,
                          lastMessageSender: currentUser.uid,
                          lastMessageTime: serverTimestamp(),
                        });
                        chatId = newChatRef.id;
                        
                        // Add initial purchase message
                        await addDoc(collection(db, "Chats", chatId, "messages"), {
                          senderId: currentUser.uid,
                          text: `Hi! I'd like to purchase "${selectedListing.title}" for $${selectedListing.price}. Let's arrange a pickup!`,
                          timestamp: serverTimestamp(),
                          type: "text"
                        });
                      }
                      
                      toast.success("Purchase initiated! Check your messages to arrange pickup.", { 
                        toastId: 'purchase-success' 
                      });
                      
                      handleCloseListing();
                      navigate(`/messages/${chatId}`);
                      
                    } catch (error) {
                      console.error("Purchase error:", error);
                      toast.error("Failed to complete purchase. Please try again.", { toastId: 'purchase-error' });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="flex-1 bg-[#FDD023] text-black py-2 rounded-xl font-bold hover:bg-[#FDD023]/90 transition-all disabled:opacity-50"
                  disabled={!selectedListing?.available || selectedListing?.sellerUID === currentUser?.uid}
                >
                  {selectedListing?.sellerUID === currentUser?.uid ? "Your Listing" : "Purchase"}
                </button>
                {/* Submit Offer Button (Gold Accent) */}
                <button
                  disabled={offerMade}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedListing && selectedListing.available) {
                      setShowOfferModal(true)
                      setShowSafetyTips(true)
                    } else {
                      toast.warn("Sorry, this listing is not currently accepting new offers.", {toastId: 'reserved-listing-error'});
                    }
                  }}
                  className={`disabled:opacity-50 ${offerMade ? "!cursor-default" : ""} flex-1 bg-[#FDD023] hover:bg-[#FDD023]/90 text-black py-2 rounded-xl font-bold  transition-all`}
                >                  
                  Make Offer
                </button>
                {/* Favorite Button (Dark Background, Gold/Red Accent) */}
                  <button onClick={() => {handleFavorite(selectedListing.docId);}}
                    className={`px-2 py-2 rounded-xl border border-zinc-700 hover:border-[#FDD023] transition-all 
                      ${likedItems.includes(selectedListing.docId) ? "bg-[#1a0f2e]" : "bg-[#1a0f2e] hover:bg-[#2c1844]"}`}
                  >
                  <Heart className={`w-8 h-8 stroke-2 
                    ${likedItems.includes(selectedListing.docId) 
                      ? "fill-red-500 stroke-red-500 "
                      : "fill-none stroke-gray-400 hover:fill-[#FDD023] hover:stroke-[#FDD023] hover:stroke-1" 
                    } `} />
                </button>
                </div>
                </div>
            </div>
          </div>
        {/* New Offer Modal */}
          {showOfferModal 
          ? (<div 
            onClick={(e) => {e.stopPropagation();}} 
            // New Offer Modal (Dark Background, Gold/White Text)
            className="fixed z-60 w-96 p-8 py-6 mr-10 bg-[#1a0f2e] top-1/2 right-0 rounded-2xl transform -translate-y-1/2 shadow-2xl border border-[#FDD023]/50 text-white"
            >
            <div className="mb-4 text-[#FDD023] text-2xl text-center font-bold">
              New Offer
            </div>
            <form className="">
            {/* Offer Amount */}
              <label className="block text-sm font-medium text-white">Offer Amount <span className="text-red-500">*</span></label>
              <input
                id="amount"
                type="string"
                name="amount"
                value={offerAmount !== null ? `$${offerAmount}`  : ""}
                onChange={(e) => {
                  const cleanValue = e.target.value.replace(/[^\d.]/g, '');
                  const numericalValue = cleanValue ? parseFloat(cleanValue) : null;
                  if (numericalValue !== null && numericalValue >= selectedListing.price) {
                    setOfferAmount(selectedListing.price); // MAX amount is set to original price
                    toast.warn("Amount too high. Enter lower number",{toastId:"exceed-max-error"})
                  } else {
                    setOfferAmount(numericalValue);
                  }
                }
                }
                placeholder="$0"
                className="mt-1 w-full px-3 py-1 border border-zinc-700 rounded-lg bg-[#2c1844] text-white focus:outline-none focus:ring-2 focus:ring-[#FDD023]"
                min="0"
                max={selectedListing.price}
              />
            {/* Offer Note */}
              <label className="mt-2 block text-sm font-medium text-white">Note to seller <span className="text-red-500">*</span></label>
              <textarea
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                    placeholder="Add a note for the seller..."
                    maxLength={100}
                    rows={3}
                    className="mt-1 w-full px-2 py-1 border border-zinc-700 rounded-lg bg-[#2c1844] text-white focus:outline-none focus:ring-2 focus:ring-[#FDD023] resize-none"
                  />
                  <p className="text-sm text-gray-400 mt-1">{100-offerNote.length} characters left</p>
            </form>
            <div className="mt-6 flex gap-3">
              <button
                onClick={()=>handleCloseOfferModal()}
                className="flex-1 px-4 py-2 border-2 border-zinc-700 text-white rounded-lg font-semibold hover:bg-[#2c1844] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={()=>handleSubmitOffer()}
                className="flex-1 px-4 py-2 bg-[#FDD023] text-black rounded-lg font-semibold hover:bg-[#FDD023]/90 transition-all"
                disabled={loading}
              >
                Submit Offer
              </button>
            </div>
          </div>)
          : null
          }
        </div>
      )}
      {/* Create Listing Modal */}
        {showCreateListing && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 gap-2"
          onClick={handleCloseNewListingModal}
        >
          
          {/* Modal LEFT SIDE - Listing*/}
            <div
            className="relative bg-[#1a0f2e] rounded-2xl max-w-5xl w-5/5 h-5/5 max-h-[90vh] shadow-2xl flex "
            onClick={(e) => e.stopPropagation()}>
            
            {/* Preview Left Side - Image with Carousel */}
              <div className="w-1/2 bg-gradient-to-br from-[#12091a] to-[#FDD023]/20 flex items-center justify-center relative">
                <img 
                  src={
                  uploadedImages.length > 0 
                    ? URL.createObjectURL(uploadedImages[previewImageIndex]) 
                    : "https://img.freepik.com/free-vector/blurred-purple-background_1107-140.jpg"
                  } 
                  alt={newTitle} 
                  className="w-full h-full object-cover rounded-tl-2xl rounded-bl-2xl" 
                />
              
              {/* Carousel Navigation */}
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
            

            {/* Preview Right Side - Listing Info */}
              <div className="w-1/2 flex flex-col text-white">
                {/* Header */}
                  <div className="px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                    {/* Category Tag */}
                      <span className="inline-block px-3 py-1 bg-[#FDD023] text-black rounded-full text-sm font-medium">
                        {newCategory || "Category"}
                      </span>
                  </div>

                {/* Scrollable Content */}
                  <div className="overflow-y-auto p-6 pt-2 h-4/5">
                    {/* Title and Price */}
                      <div className="mb-4">
                        <h3 className="text-3xl font-bold text-[#FDD023] mb-2">{newTitle || "Title"}</h3>
                        <p className="text-4xl font-bold text-white">${newPrice || "0"}</p>
                      </div>
                    {/* Location */}
                      <div className="flex items-center text-gray-300 mb-4 pb-4 ">
                        <MapPin className="w-5 h-5 mr-2" />
                        <span className="text-lg">{newLocation || "Location"}</span>
                      </div>
                    {/* Description */}
                      <div className="mb-6 h-4/7">
                        <h4 className="text-lg pl-2 font-semibold text-white mb-2">Description</h4>
                        <textarea 
                          className="text-gray-200 rounded-xl p-4 py-2 bg-[#2c1844] w-full h-full leading-relaxed resize-none"
                          value={newDescription || "Enter description..."}
                          disabled>
                        </textarea>
                      </div>
                  </div>
                {/* Seller Info */}
                  <div className="bg-[#2c1844] rounded-xl p-4 m-6 m-0 h-460px">
                    <h4 className="text-lg font-semibold text-[#FDD023] mb-2">Seller Information</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#FDD023] rounded-full flex items-center justify-center text-black font-bold text-lg">{(currentUserData?.username.charAt(0).toUpperCase())}</div>
                        <div>
                          <p className="font-semibold text-white">{currentUserData?.username}</p>
                          <p className="text-sm text-gray-400">Member since {currentUserData?.accountCreation.toDate().toLocaleDateString('en-US', {month: 'long', year:'numeric'})}</p>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>

          {/* Modal RIGHT SIDE - Input */}
            <div
              className="flex flex-col relative bg-gradient-to-b from-[#1a0f2e] to-[#2c1844] border border-[#FDD023]/30 rounded-2xl max-w-3xl w-2/3 max-h-[90vh] shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
              <div className="z-50 sticky top-0 bg-[#2c1844] border-b border-zinc-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-[#FDD023]">Create New Listing</h2>
                <button
                  onClick={()=>{handleCloseNewListingModal()}}
                  className="text-white hover:text-[#FDD023] w-8 h-8 flex items-center justify-center rounded-full transition-all"
                >
                  <X size={30} color="#FDD023" />
                </button>
              </div>
            

            {/* Form Content */}
              <div className="p-6 overflow-y-auto text-white">
                <div className="flex flex-col space-y-6">
                {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Calculus Textbook"
                      className="w-full px-4 py-3 border border-zinc-700 rounded-lg bg-[#1a0f2e] focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent"
                    />
                  </div>

                {/* Price and Category Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">$</span>
                        <input
                          type="text"
                          value={newPrice || ""}
                          onChange={(e) => setNewPrice(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-3 border border-zinc-700 rounded-lg bg-[#1a0f2e] focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as Category)}
                        className="w-full px-4 py-3 border border-zinc-700 rounded-lg bg-[#1a0f2e] focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent"
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.filter(cat => cat !== "All").map((cat) => (
                          <option key={cat} value={cat} className="bg-[#1a0f2e]">{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Pickup Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-700 rounded-lg bg-[#1a0f2e] focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent"
                    >
                      <option value="" disabled>Select a safe meetup location</option>
                      <optgroup label="🛡️ Recommended Safe Spots" className="bg-[#2c1844]">
                        {safeLocations.filter(loc => loc.safety === "high").map((loc) => (
                          <option key={loc.name} value={loc.name} className="bg-[#1a0f2e]">
                            {loc.icon} {loc.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="📍 Other Campus Locations" className="bg-[#2c1844]">
                        {safeLocations.filter(loc => loc.safety === "medium").map((loc) => (
                          <option key={loc.name} value={loc.name} className="bg-[#1a0f2e]">
                            {loc.icon} {loc.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  {/* Show location details when selected */}
                    {newLocation && safeLocations.find(loc => loc.name === newLocation) && (
                      <div className="mt-2 p-3 bg-[#2c1844] rounded-lg border border-[#FDD023]/30">
                        <p className="text-sm text-gray-300">
                          {safeLocations.find(loc => loc.name === newLocation)?.description}
                        </p>
                        <p className="text-sm text-[#FDD023] font-medium mt-1">
                          ⏰ {safeLocations.find(loc => loc.name === newLocation)?.hours}
                        </p>
                      </div>
                    )}
                  </div>
                {/* Condition */ }
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Condition <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-700 rounded-lg bg-[#1a0f2e] focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent"
                    >
                      <option value="" disabled>Select a condition</option>
                      <option value="New" className="bg-[#1a0f2e]">New</option>
                      <option value="Like New" className="bg-[#1a0f2e]">Like New</option>
                      <option value="Used" className="bg-[#1a0f2e]">Used</option>
                    </select>
                  </div>

                {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Upload Photos <span className="text-red-500">*</span>
                    </label>
                  {/* Upload Button */}
                    <div className="mb-4">
                      <label className="cursor-pointer">
                      <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-[#FDD023] transition-all">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-[#FDD023] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <p className="text-white font-medium">Click to upload photos</p>
                          <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 5 images</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      </label>
                    </div>

                  {/* Image Preview Grid */}
                    {uploadedImages.length > 0 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          {uploadedImages.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-zinc-700"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              >
                                ×
                              </button>
                              {index === 0 && (
                                <span className="absolute bottom-1 left-1 bg-[#FDD023] text-black text-xs px-2 py-1 rounded">
                                  Cover
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  
                  <p className="text-sm text-gray-400 mt-2">
                    {uploadedImages.length}/5 images uploaded
                    {uploadedImages.length > 0 && " • First image will be the cover photo"}
                  </p>
                  </div>

                {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Describe your item in detail..."
                      maxLength={500}
                      rows={5}
                      className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-[#1a0f2e] focus:outline-none focus:ring-2 focus:ring-[#FDD023] focus:border-transparent resize-none"
                    />
                    <p className="text-sm text-gray-400 mt-1">{500-newDescription.length} characters left</p>
                  </div>
                </div>
              {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleCloseNewListingModal}
                    className="flex-1 px-6 py-3 border-2 border-zinc-700 text-white rounded-lg font-semibold hover:bg-[#1a0f2e] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitListing}
                    className="flex-1 px-6 py-3 bg-[#FDD023] text-black rounded-lg font-semibold hover:bg-[#FDD023]/90 transition-all"
                    disabled={loading}
                  >
                    Create Listing
                  </button>
                </div>
              </div>
            </div>
        </div>
      )}
      {/* Login Modal */}
        {currentUser == null && showLoginModal && (
          <div id="top"onClick={() => setShowLoginModal(false)} className="fixed inset-0 flex items-center justify-center bg-[#444]/60 z-50">
            <div id="box" onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative">
              <div className="text-center mb-6 ">
                <div className="mx-auto w-24 h-24 bg-purple-900 rounded-lg flex items-center justify-center">
                  <img className="w-18 h-16 " src="/tiger_logo.png">
                  </img>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mt-4">Welcome Back</h1>
                <p className="text-sm text-gray-500">Sign in with your @lsu.edu account</p>
              </div>
            {/*Close button (X)*/}
              <button className="absolute top-2 right-2 rounded-md"
                onClick={() => setShowLoginModal(false)}>
                <X size={30} color="#59168b"/>
              </button>
            
            {/* Login Form */}
              <form onSubmit={(e)=>handleLogin(e)} noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input 
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="email"
                    type="email"
                    name="email"
                    placeholder="email@lsu.edu"
                    value={email}
                    onChange={(e)=> setEmail(e.target.value)}
                    autoComplete='off'
                    onBlur={() => {
                    if (email && !lsuEmailRegex.test(email.trim())){
                      setInvalidEmail(true)}
                    else {setInvalidEmail(false)}
                    }}
                  />
                {/*Displays invalid email error if email is invalid */}
                  {invalidEmail && (
                  <label className="ml-1 text-sm font-medium text-red-500">Please enter a valid school email</label>
                  )}
                </div>
                <div>
                  <label className="block mt-4 text-sm font-medium text-gray-700">Password</label>
                  <input 
                    className="mt-1 mb-4 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e)=> setPassword(e.target.value)}
                    autoComplete='off'
                  />
                </div>
              {/* Submit button */}
                <button 
                  className={`w-full px-4 py-3 rounded-lg font-semibold text-white ${
                    loading || !lsuEmailRegex.test(email.trim()) || password.length === 0
                    ? 'bg-purple-900/60 cursor-not-allowed opacity-80'
                    : 'bg-purple-900 hover:bg-purple-800'
                  }`}
                  type="submit"
                  disabled={loading || !lsuEmailRegex.test(email.trim()) || password.length === 0}>
                  {loading ? 'Logging in...' : 'Login'} 
                </button> 
                <div className="mt-4 text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-purple-900 hover:underline">Sign up</Link>
                </div>
              </form>
          </div>
        </div>
      )}
      {showSafetyTips && (
        <div 
          className="fixed inset-0 bg-[#2c1844] bg-opacity-70 z-[70] flex items-center justify-center p-4"
        >
          <div 
            className="bg-[#2c1844] rounded-2xl max-w-md w-full p-6 border border-purple-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
            {/* Shield Icon: Updated to gold accent background */}
              <div className="w-16 h-16 bg-[#FDD023]/20 border border-[#FDD023]/40 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🛡️</span>
              </div>
            {/* Title: Updated to gold text */}
              <h3 className="text-2xl font-bold text-[#FDD023]">Safety First!</h3>
            {/* Subtitle: Updated to light gray text */}
              <p className="text-sm text-gray-300 mt-1">Please review these tips before meeting</p>
            </div>
            <div className="space-y-3 mb-6">
            {/* Positive Tip (Meet in Public): Darkened background, white text, gold icon */}
              <div className="flex gap-3 p-3 bg-gray-700/50 rounded-lg">
                <span className="text-[#FDD023] text-xl flex-shrink-0">✅</span>
                <div>
                  <p className="font-semibold text-white text-sm">Meet in Public Places</p>
                  <p className="text-xs text-gray-400">Student Union, Library, or busy campus locations</p>
                </div>
              </div>

            {/* Positive Tip (Daylight): Darkened background, white text, gold icon */}
              <div className="flex gap-3 p-3 bg-gray-700/50 rounded-lg">
                <span className="text-[#FDD023] text-xl flex-shrink-0">✅</span>
                <div>
                  <p className="font-semibold text-white text-sm">Meet During Daylight</p>
                  <p className="text-xs text-gray-400">Avoid late night meetings when possible</p>
                </div>
              </div>

            {/* Positive Tip (Bring a Friend): Darkened background, white text, gold icon */}
              <div className="flex gap-3 p-3 bg-gray-700/50 rounded-lg">
                <span className="text-[#FDD023] text-xl flex-shrink-0">✅</span>
                <div>
                  <p className="font-semibold text-white text-sm">Bring a Friend</p>
                  <p className="text-xs text-gray-400">Safety in numbers - never go alone</p>
                </div>
              </div>

            {/* Warning Tip (Inspect): Darkened background, white text, gold icon */}
              <div className="flex gap-3 p-3 bg-gray-700/50 rounded-lg">
                <span className="text-[#FDD023] text-xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-semibold text-white text-sm">Inspect Before Paying</p>
                  <p className="text-xs text-gray-400">Check item condition carefully</p>
                </div>
              </div>

            {/* Negative Tip (No Personal Info): Darkened background, white text, red icon */}
              <div className="flex gap-3 p-3 bg-gray-700/50 rounded-lg">
                <span className="text-red-400 text-xl flex-shrink-0">❌</span>
                <div>
                  <p className="font-semibold text-white text-sm">Never Share Personal Info</p>
                  <p className="text-xs text-gray-400">Don't give out your address or dorm room</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
            {/* Secondary Button (Cancel): Dark theme styling */}
              <button
                onClick={() => {setShowSafetyTips(false);setShowOfferModal(false)}}
                className="flex-1 px-4 py-2 border border-gray-500 text-gray-300 rounded-lg font-semibold bg-[#2c1844] hover:bg-[#1a0f2e] transition-all"
              >
              Cancel
              </button>
            {/* Primary Button (I Understand): Gold accent styling */}
              <button
                onClick={() => {
                  setShowSafetyTips(false);
                }}
                className="flex-1 px-4 py-2 bg-[#FDD023] text-black rounded-lg font-semibold hover:bg-[#FDD023]/80 transition-all"
              >
              I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>  
  );
}
