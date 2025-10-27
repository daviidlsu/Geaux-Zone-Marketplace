import { useState, FormEvent } from "react";
import { Search, Filter, MapPin, Heart, X} from "lucide-react";
import { auth } from "./firebase/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from 'react-toastify';


type Category = "All" | "Tickets" | "Textbooks" | "Clothing" | "Electronics" | "Other" | string;

interface Listing {
  id: number;
  title: string;
  price: number;
  image: string;
  category: Category;
  location: string;
  description: string;
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [loggedIn, setLoggedIn] = useState<boolean>(false); // Placeholder for authentication state
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [newCategory, setNewCategory] = useState<Category>("");
  const [newLocation, setNewLocation] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newImage, setNewImage] = useState<string>("");
  const [showCreateListing, setShowCreateListing] = useState<boolean>(false);

  const listings: Listing[] = [
    { id: 1, title: "Textbook", price: 45, image: "https://i.ebayimg.com/images/g/04IAAOSwDiRlVIsd/s-l400.jpg", category: "Textbooks", location: "Union", description: "This is a great item in excellent condition. Perfect for LSU students looking for quality at an affordable price. Feel free to contact me if you have any questions!" },
    { id: 2, title: "LSU Jersey", price: 34, image: "https://i.ebayimg.com/images/g/408AAOSw8FBncfAV/s-l400.jpg", category: "Clothing", location: "Union", description: "This is a great item in excellent condition. Perfect for LSU students looking for quality at an affordable price. Feel free to contact me if you have any questions!" },
    { id: 3, title: "Bike", price: 220, image: "https://upload.wikimedia.org/wikipedia/commons/3/37/Danish_bicycle_female.jpg", category: "Other", location: "Union", description: "This is a great item in excellent condition. Perfect for LSU students looking for quality at an affordable price. Feel free to contact me if you have any questions!" },
    { id: 4, title: "Fronchetti", price: 67, image: "https://conf.researchr.org/getProfileImage/felipefronchetti/40da9bf4-e117-4240-8a91-f0eede574a7f/small.jpg?1711682220000", category: "Other", location: "PFT", description: "This is a great item in excellent condition. Perfect for LSU students looking for quality at an affordable price. Feel free to contact me if you have any questions!" },
    
  ];

  const categories: Category[] = ["All", "Tickets", "Textbooks", "Clothing", "Electronics", "Other"];

  const filteredListings = listings.filter((listing) => {
    const matchesCategory = selectedCategory === "All" || listing.category === selectedCategory;
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  // Listing handler
  const handleListing = (listing: Listing) => {
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
        //console.log(user);
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
  };
  // Register button handler
  const handleRegister = () => {
    navigate('/register');
  }

  const handleCreateListing = () => {
  if (!loggedIn) {
    alert("Please login to create a listing.");
    setShowLoginModal(true);
  } else {
    setShowCreateListing(true);
  }
};

const handleCloseCreateListing = () => {
  setShowCreateListing(false);
};

const handleSubmitListing = () => {
  if (!newTitle || !newPrice || !newLocation || !newDescription) {
    alert("Please fill in all fields.");
    return;
  }

  console.log("New listing:", {
    title: newTitle,
    price: parseFloat(newPrice),
    category: newCategory,
    location: newLocation,
    description: newDescription,
    image: newImage || "https://via.placeholder.com/300x200"
  });

  // Reset form
  setNewTitle("");
  setNewPrice("");
  setNewCategory("Textbooks");
  setNewLocation("");
  setNewDescription("");
  setNewImage("");
  setShowCreateListing(false);

  alert("Listing created successfully!");
};

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
                ? 'bg-purple-950 text-white hover:bg-purple-800'
                : 'bg-yellow-400 text-purple-900 hover:bg-yellow-300'}`}> {/*Determines button style based on login state*/}
              {loggedIn ? 'Logout' : 'Login'} {/* Determines button text */}
            </button>
            {!loggedIn && (
              <button onClick={handleRegister} className="px-5 py-2 bg-yellow-400 text-purple-900 font-semibold hover:bg-yellow-300 transition-all">Sign Up</button>
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

      <button 
        onClick={handleCreateListing}
        className="fixed bottom-8 right-8 w-16 h-16 bg-yellow-400 text-purple-900 rounded-full shadow-2xl hover:bg-yellow-300 transition-all transform hover:scale-110 flex items-center justify-center text-3xl font-bold z-30">
        +
        </button>

      {/* Listing Detail Modal */}
      {selectedListing && (
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
              />
            </div>

            {/* Right Side - Details */}
            <div className="w-1/2 flex flex-col">
              {/* Header with Close Button */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-sm font-medium">
                  {selectedListing.category}
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
                  <p className="text-gray-700 leading-relaxed">
                  {selectedListing.description}
                     </p>
                      </div>

                {/* Seller Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Seller Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      TS
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Tiger Student</p>
                      <p className="text-sm text-gray-600">LSU Student • Member since 2024</p>
                    </div>
                  </div>
                </div>
              </div>
            
           
              

              {/* Action Buttons - Fixed at Bottom */}
              <div className="px-6 py-4 border-t border-gray-200 bg-white">
                <div className="flex gap-3">
                  <button onClick={() => {handleContactSeller();}} className="flex-1 bg-purple-900 text-white py-3 rounded-xl font-bold hover:bg-purple-800 transition-all">
                    Contact Seller
                  </button>
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
          className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={handleCloseCreateListing}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Create New Listing</h2>
              <button
                onClick={handleCloseCreateListing}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6">
              <div className="space-y-6">
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
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">$</span>
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  <p className="text-sm text-gray-500 mt-1">Or upload from your device (coming soon)</p>
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
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">{newDescription.length} characters</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleCloseCreateListing}
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
