import { useState, FormEvent, useEffect } from "react";
import { Search, Filter, MapPin, Heart, X, Menu, Library, House} from "lucide-react";
import { auth, db } from "./firebase/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer, Zoom } from 'react-toastify';
import { collection, addDoc, getDoc, getDocs, doc, getDocsFromServer, query, Timestamp, where } from "firebase/firestore";

type Category = "All" | "Tickets" | "Textbooks" | "Clothing" | "Electronics" | "Other" | string;

interface Listing {
  docId: string;
  id: number;
  title: string;
  categoryID: Category;
  Description: string;
  price: number;
  dateListed: Timestamp;
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

interface userData {
  uid: string;
  username: string;
  accountCreation: Timestamp;
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const [currentUserData, setCurrentUserData] = useState<userData | null>(null);
  const [email, setEmail] = useState<string>('')
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredNum, setFilteredNum] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [invalidEmail, setInvalidEmail] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [listingOwner, setListingOwner] = useState<sellerInfo | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState<Category>("");
  const [newLocation, setNewLocation] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newImage, setNewImage] = useState<string>("");
  const [password, setPassword] = useState('')
  const [showCreateListing, setShowCreateListing] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const lsuEmailRegex = /^[^@\s]+@lsu\.edu$/i
  const categories: Category[] = ["All", "Tickets", "Textbooks", "Clothing", "Electronics", "Other"];

  const menuItems = [
    { name: 'Home', icon: House, action: () => navigate('/') },
    { name: 'Your Listings', icon: Library, action: () => navigate('/my-listings') },
  ];

  // Fetch listings from Firestore
  const fetchListings = async (): Promise<Listing[]> => {
    try{
      const querySnapshot = await getDocs(collection(db, "Inventory")); // Might need to adjust for available items
      const fetchedListings: Listing[] = querySnapshot.docs.filter(doc => {
        const data = doc.data() as Listing;
        return auth.currentUser?.uid !== data.sellerUID;}
      ).map(doc => {
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
  }, [auth.currentUser]);

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
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-900 transition-colors flex-grow truncate">{listing.title}</h3>
            <div className="flex w-1/10 h-1/10 center-items justify-center">
            <button onClick={(e)=>{e.stopPropagation();handleFavorite}} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
              <Heart className="w-5 h-5" />
            </button>
            </div>
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

  // Closes selected listing
  const handleCloseListing = () => {
    setSelectedListing(null);
    setListingOwner(null);
  }

  // Contact seller handler
  const handleContactSeller = () => {
    if (auth.currentUser == null) {
      toast.warn("Please Login or Register to contact seller.", {toastId: 'contact-error'});
    } else {
      // Implement contact seller functionality here
    }
  }

  // Favorite listing handler
  const handleFavorite = () => {
    if (auth.currentUser == null) {
      toast.warn("Please Login or Register to favorite listings.", {toastId: 'favorite-error'});
    } else {
      // Implement favorite functionality here
    }
  }

  // Login handler
  const handleLogin = async (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget);
    const {email, password} = Object.fromEntries(formData.entries()) as Record<string,string>;
    // TODO: sanitize user input
    try{
        setIsLoading(true);
        const userCred = await signInWithEmailAndPassword(auth, email, password)
        const User = userCred.user
        if (User){
          const docSnap = await getDoc(doc(db, 'Users', User.uid))
          if (docSnap.exists()){setCurrentUserData(docSnap.data() as userData)}
          navigate('/');
          toast.success("Login Successful!", {toastId: 'login-success'});
          setShowLoginModal(false); // Close modal on successful login
          setIsLoading(false);
        }
        else {toast.error("User not found.", {toastId:'user-not-found'})}
    }catch(error){
        setIsLoading(false);
        toast.error("Login Failed. Please check your credentials.", {toastId: 'login-failed'});
        console.log(error);
    }
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUserData(null);
      navigate('/');
      toast.success("Logout Successful!", {toastId: 'logout-success'});
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }
  // Register button handler
  const handleRegister = () => {
    navigate('/register');
  }

  // Create listing handler
  const handleCreateListing = () => {
    if (auth.currentUser == null) {
      toast.warn("Please login to create a listing.", {toastId:'login-to-create'});
      setShowLoginModal(true);
    } else {
      setShowCreateListing(true);
    }
  };

  // Close create listing modal
  const handleCloseNewListingModal = () => {
    setNewTitle("");
    setNewPrice(null);
    setNewCategory("");
    setNewLocation("");
    setNewDescription("");
    setNewImage("");
    setShowCreateListing(false);
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
    try {
      await addDoc(collection(db, "Inventory"), {
        Description: newDescription,
        available: true,
        categoryID: newCategory,
        dateListed: new Date(), // Store current date
        image: newImage || "https://via.placeholder.com/300x200",
        location: newLocation,      
        price: newPrice || null,
        sellerUID: auth.currentUser?.uid || "anonymous",
        title: newTitle
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
    handleCloseNewListingModal();
    toast.success("Listing created successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <nav className="sticky top-0 z-50 bg-purple-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={ auth.currentUser ? ()=> setShowMenu(true) : ()=> {setShowLoginModal(true);toast.warn("Please Login or Register to access the menu.", {toastId: 'menu-login-warning'})}} className="absolute flex left-0 top-1/2 transform -translate-y-1/2 ml-6 p-2 w-10 h-10 rounded-full hover:bg-[#ffffff20] transition-colors items-center justify-center">
            <Menu className="stroke-white w-8 h-8"/>
          </button>
          <div className="flex items-center justify-between w-full ml-[-72px]">
            <div className="flex items-center gap-3">
              <img className="w-10 h-10 " src="/geauxzone_tiger.png"></img>
              <span className="text-white font-bold text-xl">Geaux-Zone Marketplace</span>
            </div>
            <div className="flex gap-2 font-sans">
              <button onClick={auth.currentUser ? handleLogout : () => setShowLoginModal(true)} className={`px-4 py-1 rounded-2xl text-purple-900 transition-colors font-semibold
                ${auth.currentUser 
                  ? 'text-white hover:text-yellow-600'
                  : 'text-white hover:text-yellow-600'}`}> {/*Determines button style based on login state*/}
                {auth.currentUser ? 'Logout' : 'Login'} {/* Determines button text */}
              </button>
              {auth.currentUser == null && (
                <button onClick={handleRegister} className="px-2 py-2 rounded-2xl text-yellow-500 font-semibold hover:text-yellow-600 transition-all active:cursor:grabbing">Sign Up</button>
              )}
              {auth.currentUser != null && (
                <button className="w-10 h-10 rounded-full bg-purple-950 text-white font-bold items-center justify-center flex">
                  {currentUserData?.username.charAt(0).toUpperCase()}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="bg-white border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 pb-2 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            {/*Possibly remove the category reset, if user needs to search in specific category*/}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value);setSelectedCategory("All")}}
              placeholder="Search for items..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            /> 
            {/*Clear search button if searchQuery is not empty*/}
            {searchQuery!=="" && (
              <button 
              onClick={()=>{setSearchQuery("");console.log(searchQuery)}} 
              className="absolute flex right-3 top-1/2 transform -translate-y-1/2 items-center justify-center">
                <X color="gray" size={20}></X>
            </button>)}
          </div>
          <button className="px-6 py-3 bg-purple-900 text-white rounded-lg font-semibold hover:bg-purple-800 transition-all flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 pt-2">
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
      
      {/* New Listing Button */}
      <button onClick={handleCreateListing} className="fixed bottom-8 right-8 bg-yellow-500 text-white p-2 rounded-full w-12 h-12 hover:w-44 flex items-center shadow-lg transition-all duration-300 ease-in-out group">    
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
          className="fixed inset-0 bg-[#444]/70 z-50 flex items-center justify-center p-4"
          onClick={handleCloseListing}
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
                  onClick={handleCloseListing}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full transition-all"
                >
                  <X size={30} color="#59168b" />
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

      {/* Create Listing Modal */}
      {showCreateListing && (
        <div
          className="fixed inset-0 bg-white bg-opacity-80 z-50 flex grid-cols-2 items-center justify-center p-4 gap-2"
          onClick={handleCloseNewListingModal}
        >
          {/* Listing Preview Container LEFT SIDE*/}
          <div
            className="relative bg-white rounded-2xl max-w-5xl w-4/5 h-4/5 max-h-[90vh] shadow-2xl flex overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {/* Left Side - Image */}
            <div className="w-1/2 bg-gradient-to-br from-purple-100 to-yellow-100 flex items-center justify-center">
              <img 
                src={newImage || "https://img.freepik.com/free-photo/blurred-abstract-background_58702-1509.jpg?semt=ais_hybrid&w=740&q=80"} 
                alt={newTitle} 
                className="w-full h-full object-cover rounded-tl-2xl rounded-bl-2xl" 
              />
            </div>

            {/* Right Side - Listing Info */}
            <div className="w-1/2 flex flex-col">
              {/* Header with Close Button */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-sm font-medium">
                  {newCategory || "Category"}
                </span>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-6 h-4/5">
                {/* Title and Price */}
                <div className="mb-4">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{newTitle || "Title"}</h3>
                  <p className="text-4xl font-bold text-purple-900">${newPrice || "0"}</p>
                </div>
                {/* Location */}
                <div className="flex items-center text-gray-700 mb-4 pb-4 border-b border-gray-200">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-lg">{newLocation || "Location"}</span>
                </div>
                {/* Description */}
                <div className="mb-6 h-1/2">
                  <h4 className="text-lg pl-2 font-semibold text-gray-900 mb-2">Description</h4>
                  <textarea 
                    className="text-gray-800 rounded-xl p-4 pt-2 bg-gray-100 w-full h-full leading-relaxed resize-none"
                    value={newDescription || "Enter description..."}
                    disabled>
                  </textarea>
                </div>
              </div>

              {/* Seller Info */}
                <div className="bg-gray-100 rounded-xl p-4 m-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Seller Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center text-white font-bold text-lg">{(currentUserData?.username.charAt(0).toUpperCase())}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{currentUserData?.username}</p>
                      <p className="text-sm text-gray-600">Member since {currentUserData?.accountCreation.toDate().toLocaleDateString('en-US', {month: 'long', year:'numeric'})}</p>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* Input Form Container  RIGHT SIDE*/}
            <div
              className="flex flex-col relative bg-white border-1 border-gray-300 rounded-2xl max-w-3xl w-2/3 max-h-[90vh] shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="z-50 sticky top-0 bg-white border-b bg-opacity-0 border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Create New Listing</h2>
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Calculus Textbook"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Price and Category Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative z-0">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">$</span>
                      <input
                        type="text"
                        value={newPrice || ""}
                        onChange={(e) => setNewPrice(e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as Category)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.filter(cat => cat !== "All").map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g., Student Union, West Campus"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image URL (optional)
                  </label>
                  <input
                    type="text"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex gap-1.5 mt-1">
                  <button className="text-center w-20 px-4 py-1 text-xs text-white font-semibold rounded-lg bg-purple-900 hover:bg-purple-800">
                    Upload
                  </button>
                  <p className="text-sm text-gray-500 mt-0">Upload from your device (coming soon)
                  </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe your item in detail..."
                    maxLength={500}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">{500-newDescription.length} characters left</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCloseNewListingModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitListing}
                  className="flex-1 px-6 py-3 bg-purple-900 text-white rounded-lg font-semibold hover:bg-purple-800 transition-all"
                >
                  Create Listing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {auth.currentUser == null && showLoginModal && (
        <div id="top"onClick={() => setShowLoginModal(false)} className="fixed inset-0 flex items-center justify-center bg-[#444]/60 z-50">
          
            <div id="box" onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative">
              <div className="text-center mb-6 ">
                <div className="mx-auto w-24 h-24 bg-purple-900 rounded-lg flex items-center justify-center">
                  <img className="w-16 h-16 " src="/geauxzone_tiger.png">
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
            <form onSubmit={handleLogin} noValidate>
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
                />
              </div>
              {/* Submit button */}
              <button 
                className={`w-full px-4 py-3 rounded-lg font-semibold text-white ${
                  isLoading || !lsuEmailRegex.test(email.trim()) || password.length === 0
                  ? 'bg-purple-900/60 cursor-not-allowed opacity-80'
                  : 'bg-purple-900 hover:bg-purple-800'
                }`}
                type="submit"
                disabled={isLoading || !lsuEmailRegex.test(email.trim()) || password.length === 0}>
                  {isLoading ? 'Logging in...' : 'Login'} 
              </button> 
              <div className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-purple-900 hover:underline">Sign up</Link>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Modal */}
      <>
        <div className={`fixed inset-0 bg-black/50 z-[99] transition-opacity duration-300 ${showMenu ? 'opacity-100 visible': 'opacity-0 invisible'}`}
          onClick={()=>setShowMenu(false)}>
          <div 
            className={`fixed top-0 left-0 w-64 h-full rounded-r-2xl bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out ${showMenu ? 'translate-x-0' : '-translate-x-full'}`}
            onClick={(e)=>e.stopPropagation()}>
            <div className="p-4 flex flex-col h-full">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl ml-2 font-bold text-purple-900">Menu</h2>
                <button 
                  onClick={()=>setShowMenu(false)} 
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close menu">
                  <X className="w-6 h-6 text-gray-700" />
                </button>
              </div>
              <nav className="flex-grow">
                {menuItems.map((item) => {
                  return (
                    <a
                      key={item.name}
                      onClick={() => {setShowMenu(false);item.action()}}
                      className="flex items-center justify-between p-3 pl-1 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors hover:cursor-pointer"
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </a>
                  );
                })}
                </nav>
              </div>
            </div>
          </div>
        </>

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
