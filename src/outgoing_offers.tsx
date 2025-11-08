import { db } from "./firebase/firebase"
import { FieldValue, writeBatch, increment, Timestamp, collection, orderBy, limit,collectionGroup, deleteDoc, doc, getDoc,getDocs, query, updateDoc, where } from "firebase/firestore"
import { toast } from "react-toastify"
import { useAuth } from "./auth/auth"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { X, Search } from 'lucide-react'

import Navbar from "./components/navbar"
import Menu from "./components/menu"
import CustomToastContainer from "./components/toast"

interface Offer {
    parentId: string
    offerId: string
    listingTitle: string
    amount: number
    note: string
    buyerUID: string
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

    useEffect(()=>{
        const fetchOutgoingOffers = async() => {
            setLoading(true)
            try {
                const offersQuery = query(collectionGroup(db,"offers"),where("buyerUID", "==", currentUser?.uid))
                const querySnapshot = await getDocs(offersQuery)
                const fetchedOffers: Offer[] = querySnapshot.docs.map(doc => {
                    const data = doc.data()
                    return {
                        parentId: data.parentId,
                        offerId: doc.id,
                        listingTitle: data.listingTitle,
                        amount: data.amount,
                        note: data.note,
                        buyerUID: currentUser?.uid,
                        timeStamp: data.timeStamp
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
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar 
                handleLogout={handleLogout}
                setShowLoginModal={()=>{}}
                setShowMenu={setShowMenu}
                navigate={navigate}/>
            <Menu showMenu={showMenu} setShowMenu={setShowMenu}/>
            {offers.length === 0 ? (
                // State when no offers are available
                <div className="text-center py-12 bg-gray-50 rounded-xl shadow-inner">
                    <p className="text-gray-500 text-lg">No offers have been submitted for this listing yet.</p>
                </div>
            ) : (
                // Container for all offers
                <div className="space-y-6">
                    {/* Search Bar */}
                        <div className="bg-white border-gray-200 shadow-sm">
                            <div className="max-w-7xl mx-auto px-6 py-6 flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    {/*Possibly remove the category reset, if user needs to search in specific category*/}
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {setSearchQuery(e.target.value)}}
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
                    {offers.map((offer) => (
                        // Individual Offer Card
                        <div 
                            key={offer.offerId} 
                            className="bg-white p-6 py-4 max-w-7xl mx-auto rounded-xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow"
                        >
                            {/* Header: Amount and Date */}
                            <div className="flex justify-between items-center">
                                <h3 className="text-4xl font-extrabold text-purple-900">
                                    {offer.listingTitle}
                                </h3>
                                <span className="text-sm text-gray-500 mt-1">
                                    {offer.timeStamp?.toDate().toLocaleString('en-US', {hour: 'numeric', minute: 'numeric',month: 'long', day: 'numeric'}) || 'Date N/A'}
                                </span>
                            </div>             

                            {/* Offer Amount */}
                            <h2 className="py-2 mt-2 text-3xl font-extrabold text-purple-900">
                                ${offer.amount.toFixed(2)}
                            </h2>              

                            {/* Footer: Buyer Info and Action Buttons */}
                            <div className="mt-4 flex justify-between items-center">
                            
                                {/* Offer Note/Message */}
                                <p className="text-gray-700 mt-1 italic text-md border-b border-gray-100 pb-3">
                                    "{offer.note || 'No message provided.'}"
                                </p>               

                                {/* Action Buttons */}
                                <div>
                                    <button className="text-sm px-4 py-2 bg-purple-900 text-white font-semibold rounded-full mr-2 hover:bg-purple-700 transition-colors shadow-sm">
                                        View chat
                                    </button>
                                    <button onClick={()=>handleDeleteOffer(offer)}className="text-sm px-4 py-2 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-colors shadow-sm">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <CustomToastContainer/>
        </div>
    )
}