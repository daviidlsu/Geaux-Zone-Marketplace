import { ArrowLeft } from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase/firebase.ts";
import { useAuth } from "./auth/auth.tsx";
import { Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Menu from "./components/menu.tsx"
import Navbar from "./components/navbar.tsx";
import CustomToastContainer from "./components/toast.tsx";

interface Offer {
    offerId: string
    amount: number
    note: string
    buyerDisplayName?: string
    buyerUID: string
    timeStamp: Timestamp
}

export default function ListingOffers(){
    const navigate = useNavigate();
    const {logout} = useAuth()
    const {listingId} = useParams<{ listingId:string}>()
    const [listingTitle, setListingTitle] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)
    const [offers, setOffers] = useState<Offer[]>([])
    const [showMenu, setShowMenu] = useState<boolean>(false)

    useEffect(()=>{
        const fetchOffers = async () => {
            if (!listingId) {
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                // Fetch Listing Title
                const listingRef = doc(db, 'Inventory', listingId);
                const listingSnap = await getDoc(listingRef);
                if (listingSnap.exists()) {
                    setListingTitle(listingSnap.data().title || 'Untitled Listing');
                } else {
                    setListingTitle('Listing Not Found');
                }
                // Fetch listing offers
                const offersCollectionRef = collection(db, 'Inventory', listingId, 'offers');                
                const querySnapshot = await getDocs(offersCollectionRef);

                // Filters out "placeholder" doc (used to keep "offers" collection from self-terminating)
                const offersDocs = querySnapshot.docs.filter(doc => doc.id !== "placeholder");
                
                // Makes an array of pairs (listing -> sellerUID)
                const uniqueSellerUIDs = Array.from(new Set(offersDocs.map(doc => doc.data().buyerUID)));
                const userDataMap = new Map<string, string>(); // Map of UID -> DisplayName
                
                // Fetches displayNames and replaces the UIDs with corresponding usernames
                const userPromises = uniqueSellerUIDs.map(async (uid) => {
                    const userDocRef = doc(db, 'Users', uid); 
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        // Creates a key-value pair for every sellerUID in uniqueSellerUIDs
                        userDataMap.set(uid, userSnap.data().username || `User ${uid.substring(0, 4)}`);
                    } else {
                        userDataMap.set(uid, `Unknown User (${uid.substring(0, 4)})`);
                    }
                });

                // Wait for all user fetches to complete
                await Promise.all(userPromises);

                // Query for Offers associated with this listing
                const fetchedOffers: Offer[] = querySnapshot.docs.filter(doc => doc.id !== "placeholder").map(doc => {
                    const data = doc.data()
                    return {
                        offerId: doc.id,
                        amount: data.amount,
                        note: data.note,
                        buyerDisplayName: userDataMap.get(data.buyerUID) || "",
                        buyerUID: data.sellerUID,
                        timeStamp: data.timeStamp,
                 } as Offer
                } );
                console.log(fetchedOffers)
                // Sort offers by amount (could change to sort by time)
                fetchedOffers.sort((a, b) => b.amount - a.amount); 

                setOffers(fetchedOffers);

            } catch (error) {
                console.error("Error fetching offers:", error);
                toast.error("Error fetching offers", {toastId:"fetch-offer-error"})
            } finally {
                setLoading(false);
            }
        }
        fetchOffers()
    },[listingId])

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            toast.success("Logout Successful!", {toastId: 'logout-success'});
        } catch (error) {
            console.error("Error signing out:", error);
        }
    }

    // If loading, display loading message
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-t-purple-900 border-gray-200 rounded-full mr-2"></div>
                Loading offers...
            </div>
        );
    }
    
    return(
        <div>
            <Navbar
              handleLogout={handleLogout}
              setShowLoginModal={()=>{}}
              setShowMenu={setShowMenu}
              navigate={navigate}/>
            <Menu showMenu={showMenu} setShowMenu={setShowMenu}/>
            <div className="max-w-4xl mx-auto px-4 py-10">
            <button 
                onClick={() => navigate(-1)} // Go back to the previous page (Your Listings)
                className="flex items-center text-purple-900 hover:text-purple-700 mb-6 font-semibold"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
             Back to Your Listings
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Offers for: <span className="text-purple-900">{listingTitle}</span>
            </h1>

            {offers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-md">
                    <p className="text-gray-500 text-lg">No offers have been submitted for this listing yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {offers.map((offer) => (
                        <div key={offer.offerId} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                            <div className="flex justify-between items-start">
                                <h2 className="text-2xl font-bold text-purple-900">
                                    ${offer.amount.toFixed(2)}
                                </h2>
                                <span className="text-sm text-gray-500">
                                    {/* Format the timestamp here */}
                                    {offer.timeStamp?.toDate().toLocaleString('en-US', {hour: 'numeric', minute: 'numeric',month: 'long', day: 'numeric'}) || 'Date N/A'}
                                </span>
                            </div>
                            <p className="text-gray-700 mt-2 italic">"{offer.note || 'No message provided.'}"</p>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <p className="text-sm text-gray-600">Offered by: {offer.buyerDisplayName || "cannot find user"}</p>
                                {/* Add buttons here to Accept or Reject the offer */}
                                <div>
                                    <button className="text-sm px-4 py-2 bg-purple-900 text-white rounded-full mr-2 hover:bg-purple-800">Open Chat</button>
                                    <button className="text-sm px-4 py-2 bg-green-500 text-white rounded-full mr-2 hover:bg-green-600">Accept</button>
                                    <button className="text-sm px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600">Reject</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
            <CustomToastContainer/>
        </div>
    )
}