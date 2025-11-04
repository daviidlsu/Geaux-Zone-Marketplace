import { useState, useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { db } from "./firebase/firebase";
import { useAuth } from "./auth/auth.tsx";
import { toast, ToastContainer, Zoom } from 'react-toastify';
import { Search, Filter, MapPin, Heart, X, Menu, Library, House, Trash2, TriangleAlert } from "lucide-react";
import { collection, getDocs, doc, query, Timestamp, where, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import Navbar from "./components/navbar.tsx";
import "./index.css"

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
  lastModified: Timestamp;
}

export default function Listings() {
    const navigate = useNavigate();

    const { currentUser, currentUserData, isLoading, logout } = useAuth();

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

     const menuItems = [
        { name: 'Home', icon: House, action: () => navigate('/') },
        { name: 'Your Listings', icon: Library, action: () => navigate('/my-listings') },
    ];

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
    return (
        <div className="w-full overflow-x-auto rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th
                            scope="col"
                            className="ml-4 py-3.5 pl-6 pr-3 text-left text-m font-semibold text-gray-900"
                        >
                            Listing Title
                        </th>
                        <th 
                            scope="col" 
                            className="px-3 py-3.5 text-left text-m font-semibold text-gray-900"
                        >
                            Price
                        </th>
                        <th 
                            scope="col" 
                            className="px-3 py-3.5 text-left text-m font-semibold text-gray-900"
                        >
                            Location
                        </th>
                        <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-m font-semibold text-gray-900"
                        >
                            Date Listed
                        </th>
                    </tr>
                </thead>
                
                {/* TABLE BODY */}
                <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredListings.map((listing) => (
                        <tr key={listing.docId} onClick={()=>{handleOpenEditListingModal(listing);setSearchQuery("")}} className="hover:bg-purple-50 transition-colors cursor-pointer">
                            {/* Title Column */}
                            <td className="whitespace-nowrap py-4 pl-6 pr-3 text-m font-medium text-gray-900 truncate max-w-xs">
                                {listing.title}
                            </td>
                            {/* Price Column */}
                            <td className="whitespace-nowrap px-3 py-4 text-m text-gray-500">
                                ${listing.price}
                            </td>
                            {/* Location Column */}
                            <td className="whitespace-nowrap px-3 py-4 text-m text-gray-500">
                                {listing.location}
                            </td>
                            {/* Date Listed Column */}
                            <td className="whitespace-nowrap px-3 py-4 text-m text-gray-500">
                                {listing.dateListed.toDate().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year:'numeric'})}
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
        setSelectedListing(null);
        setShowSelectedListing(false);
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
      try {
        await updateDoc(doc(db, "Inventory", listing.docId), {
          Description: newDescription,
          available: true,
          categoryID: newCategory,
          dateListed: new Date(), // Store current date
          image: newImage || "https://via.placeholder.com/300x200",
          location: newLocation,      
          price: newPrice || null,
          title: newTitle,
          lastModified: serverTimestamp()
        });
        setReloadTrigger(prev => prev + 1); // Trigger re-fetch of listings
      } catch (e) {
        console.error("Error adding document: ", e);
      }
      handleCloseEditListingModal();
      toast.success("Listing changed successfully!");
    };

    const handleDeleteListing = async (listing:Listing) => {
      console.log(listing)
        // Clean up associated favorite records
        const batch = writeBatch(db);
        const favoritesRef=collection(db, "Favorites");
        console.log(favoritesRef)
        const querySnapshot = await getDocs(query(favoritesRef, where("listingID", "==", listing.docId)));
        if (querySnapshot.empty) {
            console.log(`No favorite records found for listing:${listing.docId}. Cleanup complete.`);
        }
        else {
          querySnapshot.forEach((doc) => {
            batch.delete(doc.ref)
          }
        )};
        await batch.commit()

        // Delete the listing document
        await deleteDoc(doc(db, "Inventory", listing.docId));
        setReloadTrigger(prev => prev + 1); // Trigger re-fetch of listings
        setShowDeleteConfirm(false);
        handleCloseEditListingModal();
    }
    
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <Navbar
              handleLogout={handleLogout}
              setShowLoginModal={()=>{}}
              setShowMenu={setShowMenu}
              navigate={navigate}
              toastWarn={toast.warn}
            />

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

            {/* Search Bar */}
            <div className="bg-white border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6 flex gap-3">
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
                            onClick={()=>setSearchQuery("")} 
                            className="absolute flex right-3 top-1/2 transform -translate-y-1/2 items-center justify-center">
                            <X color="gray" size={20}></X>
                        </button>)}
                    </div>
                </div>
            </div>

            {/* Listings Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredNum} {filteredNum === 1 ? "Listed Item" : "Listed Items"}
                </h2>
              </div>
              <div id="listing-grid" className="grid grid-col h-full gap-6">
                {renderListings()}
              </div>
            </div>

            {showSelectedListing && (
                    <div
                      className="fixed inset-0 bg-white bg-opacity-80 z-50 flex grid-cols-2 items-center justify-center p-4 gap-2"
                      onClick={handleCloseEditListingModal}
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
                          <h2 className="text-2xl font-bold text-gray-900">Edit Listing</h2>
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
                          <div className="mt-6 flex gap-2">
                            <button 
                              onClick={()=>setShowDeleteConfirm(true)}
                              className="flex justify-center items-center w-14 h-12 border-2 border-red-300 text-red-300 rounded-lg font-semibold hover:bg-red-500 hover:text-white transition-all">
                                  <Trash2 className="w-6 h-6"/>
                            </button>
                            <button
                              onClick={handleCloseEditListingModal}
                              className="flex h-12 w-1/3 border-2 border-gray-300 justify-center items-center text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={()=>handleChangeListing(selectedListing!)}
                              className="flex h-12 w-2/3 bg-purple-900 justify-center items-center text-white rounded-lg font-semibold hover:bg-purple-800 transition-all"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
            { showDeleteConfirm && (
              <div onClick={()=>setShowDeleteConfirm(false)} className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
                <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 space-y-4 transform transition-all">
                  <div className="text-xl font-semibold mb-0">Are you sure?</div>
                  <span className="text-md font-semibold text-red-500">This will PERMANENTLY delete this listing</span>
                  <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={()=>setShowDeleteConfirm(false)}
                    className="flex px-4 py-2 rounded-full hover:bg-gray-100 transition-colors">
                      Cancel
                  </button>
                  <button
                  onClick={()=>handleDeleteListing(selectedListing!)}
                    className="flex px-4 py-2 bg-red-500 text-white text-bold rounded-full hover:bg-red-600 transition-colors">
                      Delete
                      <TriangleAlert  className="ml-1"/>
                  </button>
                  </div>
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
  };