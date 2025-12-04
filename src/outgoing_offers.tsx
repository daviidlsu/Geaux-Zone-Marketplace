import { db } from "./firebase/firebase"
import { writeBatch, increment, Timestamp, collection, orderBy, limit,collectionGroup, doc, getDoc,getDocs, query, updateDoc, where } from "firebase/firestore"
import { toast } from "react-toastify"
import { useAuth } from "./auth/AuthContext"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { X, Search} from 'lucide-react'

import Navbar from "./components/navbar"
import Menu from "./components/menu"
import CustomToastContainer from "./components/toast"

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

export default function OutgoingOffers() {
    const navigate = useNavigate()
    const { currentUser, logout } = useAuth()
    const [loading, setLoading] = useState<boolean>(false)
    const [offers, setOffers] = useState<Offer[]>([])
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [showMenu, setShowMenu] = useState<boolean>(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            toast.success("Logout Successful!", {toastId: 'logout-success'});
        } catch (error) {
            console.error("Error signing out:", error);
        }
    }

    // Fetch offers
    useEffect(()=>{
        const fetchOutgoingOffers = async() => {
            setLoading(true)
            try {
                const offersQuery = query(collectionGroup(db,"offers"),where("buyerUID", "==", currentUser?.uid))
                const querySnapshot = await getDocs(offersQuery)
                const fetchedOffers: Offer[] = querySnapshot.docs.map(doc => {
                    const data = doc.data()
                    return {
                        chatId: data.chatId,
                        parentId: data.parentId,
                        offerId: doc.id,
                        listingTitle: data.listingTitle,
                        amount: data.amount,
                        note: data.note,
                        buyerUID: currentUser?.uid,
                        timeStamp: data.timeStamp,
                        status: data.status
                    } as Offer
                })
                fetchedOffers.sort((a,b)=> a.timeStamp.toMillis() - b.timeStamp.toMillis())
                setOffers(fetchedOffers) 
            } catch(error) {
                console.error("Error fetching outgoing offers:", error);
                toast.error("Error fetching outgoing offers", {toastId:"fetch-outgoing-offer-error"})
            } finally {
                setLoading(false)
            }           
        }
        fetchOutgoingOffers()
    },[currentUser])

    const handleDeleteOffer = async (offer: Offer) => {
        setLoading(true)
        const parentRef = doc(db,"Inventory",offer.parentId)
        const parentSnapshot = await getDoc(parentRef)
        const collRef = collection(db, "Inventory",offer.parentId,"offers")
        const offerRef = doc(collRef, offer.offerId)
        const batch = writeBatch(db)
        try {
            batch.delete(offerRef)
            if (offer.chatId){
                const chatRef = doc(db,"Chats",offer.chatId)
                //batch.delete(chatRef)
                batch.update(chatRef, {status: "terminated"})
            }
            batch.update(parentRef, {offers: increment(-1)})
            await batch.commit()
            if (parentSnapshot.data()?.highestOffer == offer.amount) {
                const offersQuery = query(collRef,orderBy("amount", "desc"),limit(1))
                const amountSnapshot = await getDocs(offersQuery)
                if (!amountSnapshot.empty) {
                    await updateDoc(parentRef, {highestOffer: amountSnapshot.docs[0].data()?.amount})
                }
                else {
                    await updateDoc(parentRef, {highestOffer: 0})
                }
            }
            setOffers(prevOffers => prevOffers.filter(o => o.offerId !== offer.offerId));
            toast.success("Offer successfully deleted!", {toastId: "delete-offer-success"})
        } catch (error) {
            console.log("Error occured deleting offer: ",error)
            toast.error("Error occured deleting offer", {toastId: "delete-offer-error"})
        } finally {
            setLoading(false)
        }
    }

    const renderOffers = (offers: Offer[]) => {
        const filteredOffers = offers.filter((offer) => {
            return offer.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase())
        });

        if (filteredOffers.length === 0) {
            return (
                <div className="text-center py-12 bg-white/5 rounded-xl shadow-lg border border-white/10">
                    <p className="text-white/70 text-lg">You have not made an offer on any listings.</p>
                </div>
            )
        }

        return (
            <div className="space-y-6">
                {filteredOffers.map((offer) => (
                    <div 
                        key={offer.offerId} 
                        className="bg-white/5 p-6 rounded-2xl shadow-[0_12px_40px_rgba(253,208,35,0.2)] border border-white/10 hover:shadow-[0_12px_60px_rgba(253,208,35,0.3)] transition-all"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-2xl sm:text-3xl font-bold text-[#FDD023]">{offer.listingTitle}</h3>
                            <span className="text-white/60 text-sm">
                                {offer.timeStamp?.toDate().toLocaleString('en-US', {hour: 'numeric', minute: 'numeric',month: 'long', day: 'numeric'}) || 'Date N/A'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white/90 mb-2">${offer.amount.toFixed(2)}</h2>
                        <p className="text-white/70 italic mb-4">"{offer.note || 'No message provided.'}"</p>
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={()=>handleViewChat(offer)}
                                disabled={offer.status=="pending" || offer.status=="rejected"}
                                className={`text-sm px-4 py-2 rounded-full font-semibold transition-all shadow-sm 
                                ${offer.status=="pending" || offer.status=="rejected" ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-[#FDD023] text-[#41206a] hover:brightness-95"}`}>
                                {offer.status=="pending" ? "Pending" : offer.status=="rejected" ? "Rejected" : "View Chat"}
                            </button>
                            <button 
                                onClick={()=>handleDeleteOffer(offer)}
                                className="text-sm px-4 py-2 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all shadow-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const handleViewChat = async (offer: Offer) => {
        try {
            navigate(`/messages/${offer.chatId}`)
        } catch (err) {
            console.error("Error viewing chat:", err)
            toast.error("Error viewing chat", {toastId: "view-chat-error"})
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#12091a] via-[#1a0f2e] to-[#2c1844] flex flex-col">
                <Navbar handleLogout={handleLogout} setShowLoginModal={() => {}} setShowMenu={setShowMenu} navigate={navigate} />
                <Menu showMenu={showMenu} setShowMenu={setShowMenu} />
                <div className="flex flex-col max-w-7xl mx-auto px-4 py-10 min-h-[70vh] items-center justify-center text-white">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="animate-spin w-8 h-8 border-4 border-t-[#FDD023] border-white/20 rounded-full mr-3"></div>
                        <span className="text-lg font-medium">Loading offers...</span>
                    </div>
                </div>
                <CustomToastContainer/>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#12091a] via-[#1a0f2e] to-[#2c1844] text-white font-inter">
            <Navbar handleLogout={handleLogout} setShowLoginModal={() => {}} setShowMenu={setShowMenu} navigate={navigate} />
            <Menu showMenu={showMenu} setShowMenu={setShowMenu} />
            <div className="flex flex-col max-w-7xl mx-auto px-4 py-10 space-y-6">
                {/* Search Bar */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e)=>setSearchQuery(e.target.value)}
                            placeholder="Search for items..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 text-white/90 placeholder-white/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDD023] transition-all"
                        />
                        {searchQuery!=="" && (
                            <button onClick={()=>setSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <X color="white" size={20} />
                            </button>
                        )}
                    </div>
                </div>
                {renderOffers(offers)}
            </div>
            <CustomToastContainer/>
        </div>
    )
}
