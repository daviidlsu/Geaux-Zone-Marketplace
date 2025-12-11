import { ArrowLeft } from 'lucide-react';
import { addDoc, collection, doc, getDoc, getDocs, increment, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase/firebase.ts";
import { useAuth } from './auth/AuthContext';
import { Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Menu from "./components/menu.tsx"
import Navbar from "./components/navbar.tsx";
import CustomToastContainer from "./components/toast.tsx";

interface Offer {
    amount: number
    buyerDisplayName?: string
    buyerUID: string
    chatId: string
    listingTitle: string
    note: string
    offerId: string
    parentId: string
    status: string
    timeStamp: Timestamp
}

interface CheckStatusProps {
    status: string
    handleReject: () => void | Promise<void>
    handleAccept: () => void | Promise<void>
    handleChat: () => void | Promise<void>
}

// CheckStatus component determines offer action buttons based on offerStatus
const CheckStatus: React.FC<CheckStatusProps> = ({status, handleReject, handleAccept, handleChat}) => {
    return (
        (() => {
            if (status=="pending") {
                return (
                    <div>
                        <span className='px-2 py-1 rounded-full bg-blue-200 mr-2 text-xs text-blue-500 font-semibold'>New</span>
                        <button onClick={handleAccept} className="text-sm px-4 py-2 bg-green-500 text-white font-semibold rounded-full mr-2 hover:bg-green-600">Accept</button>
                        <button onClick={handleReject} className="text-sm px-4 py-2 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600">Reject</button>
                    </div>
                )
            } else if (status=="in-progress") {
                return (
                    <div>
                        <span className='rounded-full bg-gray-300 px-2 py-1 mr-2 text-xs text-gray-500 font-semibold'>In-progress</span>
                        <button onClick={handleChat} className="text-sm px-4 py-2 bg-purple-900 text-white font-semibold rounded-full hover:bg-purple-800">View Chat</button>
                    </div>
                )
            } else if (status=="accepted") {
                return (
                    <div>
                        <span className="text-xs px-2 py-1 bg-green-300 mr-2 text-green-600 font-semibold rounded-full">Accepted</span>
                        <button onClick={handleChat} className="text-sm px-4 py-2 bg-purple-900 text-white font-semibold rounded-full hover:bg-purple-800">View Chat</button>
                    </div>
                )
            }
        })()
    )
}

export default function ListingOffers(){
    const navigate = useNavigate();
    const {logout, currentUserData} = useAuth()
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
                        amount: data.amount,
                        buyerDisplayName: userDataMap.get(data.buyerUID) || "",
                        buyerUID: data.buyerUID,
                        chatId: data.chatId,
                        listingTitle: data.listingTitle,
                        note: data.note,
                        offerId: doc.id,
                        parentId: data.parentId,
                        status: data.status,
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

    // Handles offer reject button 
    const handleReject = async (offer: Offer) => {
        setLoading(true)
        try {
            const parentRef = doc(db, "Inventory", offer.parentId)
            const docRef = doc(db,"Inventory",offer.parentId, "offers", offer.offerId)
            await updateDoc(docRef, {
                status:"rejected"
            })
            await updateDoc( parentRef, {
                offers: increment(-1)
            })
            setOffers(prevOffers=> {return (prevOffers.filter(o => o.offerId != offer.offerId))})
            toast.success ("Rejected offer", {toastId: "reject-success"})
        }
        catch (err){
            toast.error ("Error rejecting offer", {toastId: "reject-error"})
            console.log("Error rejecting offer: ",err)
        } finally {
            setLoading(false)
        }
    }

    // Handles offer accept button
    // ADD WHAT HAPPENS TO OTHER OFFERS WHEN AN OFFER IS ACCEPTED
    const handleAccept = async (offer: Offer) => {
        setLoading(true)
        try {
            const newChatRef = doc(collection(db,"Chats"))
            const batch = writeBatch(db)

            // Sets values of new chat 
            batch.set(newChatRef, {
                lastMessage: "",
                lastMessageSender: "",
                lastMessageTime: null,
                listingTitle: offer.listingTitle,
                listingAmount: offer.amount,
                recName: currentUserData?.username,
                recUID: currentUserData?.uid,
                senderName: offer.buyerDisplayName,
                senderUID: offer.buyerUID,
                status: "ongoing"
            })

            // Updates offer status and chatId
            const docRef = doc(db,"Inventory",offer.parentId, "offers", offer.offerId)
            batch.update(docRef, {
                    status:"in-progress",
                    chatId: newChatRef.id
                }
            )
            batch.commit()

            // If commit succeeds, update LOCAL offer status
            setOffers(prevOffers =>
                prevOffers.map(o =>
                    o.offerId === offer.offerId
                        ? { ...o, status: "in-progress" } // Update the accepted offer's status
                        : o // Keep other offers as they are
                )
            );
            toast.success ("Accepted offer", {toastId: "accept-success"})
        }
        catch (err){
            toast.error ("Error accepting offer", {toastId: "accept-error"})
            console.log("Error accepting offer: ",err)
        } finally {
            setLoading(false)
        }
    }

    // Handles start/view chat button
    const handleChat = async (offer: Offer) => {
        setLoading(true)
        try {
            if (offer.status=="pending"){
                const docRef = doc(db,"Inventory",offer.parentId, "offers", offer.offerId)
                const newChatRef = await addDoc(collection(db,"Chats"),{
                    lastMessage: "",
                    lastMessageSender: "",
                    lastMessageTime: null,
                    listingAmount: offer.amount,
                    listingTitle: offer.listingTitle,
                    recName: offer.buyerDisplayName,
                    recUID: offer.buyerUID,
                    senderName: currentUserData?.username,
                    senderUID: currentUserData?.uid
                })
                await updateDoc(docRef, {
                    status:"in-progress",
                    chatId: newChatRef.id
                })
                navigate(`/messages/${newChatRef.id}`) // ADD CHAT ID TO PATH TO OPEN ASSOCIATED CHAT
            } else {
                console.log()
                navigate(`/messages/${offer.chatId}`)
            }
        }
        catch (err){
            toast.error ("Error accessing chat", {toastId: "chat-error"})
            console.log("Error accessing chat: ",err)
        } finally {
            setLoading(false)
        }
    }

    // If loading, display loading message
    if (loading) {
        return (
            <div>
                <Navbar
                    handleLogout={handleLogout}
                    setShowLoginModal={()=>{}}
                    setShowMenu={setShowMenu}
                    navigate={navigate}/>
                <Menu showMenu={showMenu} setShowMenu={setShowMenu}/>
                <div className="max-w-4xl mx-auto px-4 py-10">
                {/* Go back button */}
                    <button 
                        onClick={() => navigate("/my-listings")} // Go back to the previous page (Your Listings)
                        className="flex items-center text-purple-900 hover:text-purple-700 mb-6 font-semibold"
                    >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Your Listings
                    </button>
                {/* Listing Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    Offers for: <span className="text-purple-900">{listingTitle}</span>
                    </h1>
                {/* Loading message */}
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-t-purple-900 border-gray-200 rounded-full mr-2"></div>
                        Loading offers...
                </div>
                <CustomToastContainer/>
            </div>
        );
    }
    
    return(
        <div className='min-h-screen w-screen bg-gradient-to-b from-[#12091a] via-[#1a0f2e] to-[#2c1844]'>
            <Navbar
              handleLogout={handleLogout}
              setShowLoginModal={()=>{}}
              setShowMenu={setShowMenu}
              navigate={navigate}/>
            <Menu showMenu={showMenu} setShowMenu={setShowMenu}/>
            <div className="max-w-4xl mx-auto px-4 py-10 ">
            {/* Go back button */}
                <button 
                    onClick={() => navigate(-1)} // Go back to the previous page (Your Listings)
                    className="flex items-center text-[#FDD023]  mb-6 font-semibold"
                >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Your Listings
                </button>
            {/* Listing Title */}
                <h1 className="text-3xl font-bold text-[#FDD023] mb-6">
                Offers for: <span className="text-[#FDD023]">{listingTitle}</span>
                </h1>
            {/* Offers */}
                {offers.length === 0 ? (
                    <div className="text-center py-12 rounded-xl shadow-md">
                        <p className="text-gray-200 text-lg">No offers have been submitted for this listing yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {offers.filter((offer)=>offer.status != "rejected" ).map((offer) => (
                            <div key={offer.offerId} className="bg-[#2c1844] p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-2xl font-bold text-[#FDD023]">
                                        ${offer.amount}
                                    </h2>
                                    <span className="text-sm text-gray-400">
                                        {/* Format the timestamp here */}
                                        {offer.timeStamp?.toDate().toLocaleString('en-US', {hour: 'numeric', minute: 'numeric',month: 'long', day: 'numeric'}) || 'Date N/A'}
                                    </span>
                                </div>
                                <p className="text-gray-300 mt-2 italic">"{offer.note || 'No message provided.'}"</p>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <p className="text-sm text-gray-400">Offered by: {offer.buyerDisplayName || "cannot find user"}</p>
                                    <CheckStatus status={offer.status} handleReject={()=>handleReject(offer)} handleAccept={()=>handleAccept(offer)} handleChat={()=>handleChat(offer)}/>
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