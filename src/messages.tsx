import { useEffect, useMemo, useRef } from "react"
import { toast } from "react-toastify"
import { useAuth } from './auth/AuthContext';
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { addDoc, collection, CollectionReference, deleteDoc, doc, limit, onSnapshot, or, orderBy, query, QueryDocumentSnapshot, serverTimestamp, Timestamp, updateDoc, where } from "firebase/firestore"
import { db } from "./firebase/firebase"

import Navbar from "./components/navbar"
import Menu from "./components/menu"
import CustomToastContainer from "./components/toast"
import { Plus, Ban, Check, Flag, Scale, X, Clock, ArrowLeft, Trash } from "lucide-react"

type OfferMessageType = 'INCOMING' | 'OUTGOING';
type MessageContent = 'counter' | 'image' | 'text';
type ChatStatus = 'ongoing' | 'terminated' ;

interface MessageToggleProps {
    currentView: OfferMessageType;
    incomingCount: number;
    outgoingCount: number;
    toggleView:(view: OfferMessageType) => void
}

interface Chat {
    id: string
    listingAmount: number
    listingTitle: string
    lastMessage: string
    lastMessageSender: string
    lastMessageTime: Timestamp
    recName: string
    recUID: string
    senderName: string
    senderUID: string
    otherUsername: string
    type: OfferMessageType
    status: ChatStatus
}

interface Message {
    id: string
    senderId: string
    text: string
    timestamp: Timestamp 
    type: MessageContent
    counterAmount?: number
    counterStatus: 'accepted' | 'rejected' | 'pending'
}

const MessageToggle: React.FC<MessageToggleProps> = ({ currentView, toggleView, incomingCount, outgoingCount }) => {
  const baseClasses = "px-6 py-3 font-medium text-center rounded-lg transition-all duration-300 flex-1 relative z-10";
  const activeClasses = "text-black shadow-xl"; // Active text should be readable on gold indicator
  const inactiveClasses = "text-white opacity-80 hover:text-[#FDD023]"; // Inactive text on dark background
  
  const isIncoming = currentView === 'INCOMING';

  return (
    // Updated background to dark purple and added gold indicator background
    <div className="relative flex w-full max-w-lg mx-auto bg-[#1a0f2e] p-1 rounded-xl shadow-inner border border-[#FDD023]/30">
      {/* Active Indicator (Gold) */}
      <div
        className={`absolute top-1 bottom-1 w-1/2 bg-[#FDD023] rounded-lg shadow-md transition-all duration-300 ease-in-out`}
        style={{ left: isIncoming ? '0.25rem' : 'calc(50% - 0.25rem)' }}
      ></div>

      {/* Incoming Button */}
      <button
        className={`${baseClasses} ${isIncoming ? activeClasses : inactiveClasses}`}
        onClick={() => {toggleView('INCOMING')}}
      >
        Incoming Offers ({incomingCount})
      </button>

      {/* Outgoing Button */}
      <button
        className={`${baseClasses} ${!isIncoming ? activeClasses : inactiveClasses}`}
        onClick={() => {toggleView('OUTGOING')}}
      >
        Outgoing Offers ({outgoingCount})
      </button>
    </div>
  );
};

interface CounterOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (amount: number) => void;
    listingTitle: string;
    listingAmount: number;
}

const CounterOfferModal: React.FC<CounterOfferModalProps> = ({ isOpen, onClose, onSend, listingTitle, listingAmount }) => {
    const [amount, setAmount] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleSend = () => {
        if (amount==null || amount! <= 0) {
            toast.error("Please enter a valid amount greater than $0.00.", { toastId: "invalid-counter" });
            return;
        }
        onSend(amount!);
        setAmount(null);
    };

    const handleClose = () => {
        setAmount(null);
        onClose()
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
            {/* Modal Content - Kept white background for contrast/pop-up feel, but updated accents */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-[#1a0f2e]">Send Counter Offer</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <p className="text-gray-600 mb-2">
                    Submitting a counter offer for: <span className="font-semibold">{listingTitle}</span>
                </p>
                <p className="text-gray-500 mb-2">
                    Listed Price: <span className="font-semibold text-[#1a0f2e]">${listingAmount}</span>
                </p>

                <div className="mb-6">
                    <label htmlFor="counter-amount" className="block text-sm font-medium text-gray-700 mb-2">
                        Offer Amount (USD)
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-bold">$</span>
                        </div>
                        <input
                            type="string"
                            id="counter-amount"
                            value={amount !== null ? `${amount}`  : ""}
                            onChange={(e) => {
                                const cleanValue = e.target.value.replace(/[^\d.]/g, '');
                                const numericalValue = cleanValue ? parseFloat(cleanValue) : null;
                                if (numericalValue !== null && numericalValue >= listingAmount) {
                                    setAmount(listingAmount); // MAX amount is set to original price. Could make it seller choice
                                    toast.warn("Amount too high. Enter lower number",{toastId:"exceed-max-error"})
                                } else {
                                    setAmount(numericalValue);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSend();
                                }
                            }}
                            placeholder="0"
                            // Updated focus ring to gold accent
                            className="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-[#FDD023] focus:border-[#FDD023] text-lg"
                            min="0"
                            max={listingAmount}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        // Changed background to gold accent
                        className="px-4 py-2 text-sm font-semibold text-black bg-[#FDD023] rounded-lg hover:bg-[#FDD023]/80 transition disabled:bg-gray-300 disabled:text-gray-500"
                        disabled={amount! <= 0 || amount == null}
                    >
                        Send Counter
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Messages() {
    const navigate = useNavigate();
    const { currentUser, currentUserData, logout } = useAuth();
    const { chatId } = useParams<{ chatId: string }>()
    const [conversations, setConversations] = useState<Chat[]>([]);
    const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState<boolean>(false)
    const [newMessage, setNewMessage] =useState<string>("") 
    const [selectedConversationId, setSelectedConversationId] = useState<string>("");
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [showActionMenu, setShowActionMenu] = useState<boolean>(false)
    const [view, setView] = useState<OfferMessageType>('INCOMING');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showCounterModal, setShowCounterModal] = useState<boolean>(false)
    
    // Handles logout 
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            toast.success("Logout Successful!", {toastId: 'logout-success'});
        } catch (error) {
            console.error("Error signing out:", error);
        }
    }
    
    // Updates chats in real time
    const chatsCollectionRef = useMemo(() => {
        return collection(db, "Chats") as CollectionReference<Chat>
    },[db])

    // Updates chat count based on the type ('incoming' or 'outgoing')
    const { incomingCount, outgoingCount } = useMemo(() => {
        const counts = conversations.reduce((acc, convo) => {
            if (convo.type === 'INCOMING') {
                acc.incomingCount++;
            } else if (convo.type === 'OUTGOING') {
                acc.outgoingCount++;
            }
            return acc;
        }, { incomingCount: 0, outgoingCount: 0 });
        return counts;
    }, [conversations]);

    // Sets chat based on chatId in URL or 1st 'Incoming' Chat if no URL chatId(Initial Load)
    useEffect(()=> {
        if (conversations.length >0 && selectedConversationId==="") {
            if (chatId) {
                const targetChat = conversations.find(c=>c.id==chatId)
                if (targetChat) {
                    const chatType = targetChat.senderUID == currentUserData?.uid ? 'OUTGOING' : 'INCOMING'
                    setView(chatType)
                    setSelectedConversationId(chatId)
                    navigate('/messages', {replace:true})
                }
            }
            else {
                handleToggleView('INCOMING')
            }
        }
    },[chatId,conversations,navigate])

    // Updates chats in real time
    useEffect(()=>{
        const q = query(chatsCollectionRef,or(
            where('recUID',"==", currentUser?.uid),
            where('senderUID',"==", currentUser?.uid)
        ),
        orderBy('lastMessageTime','desc'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(doc=>{
                const data = doc.data();
                const sender = data.senderUID
                return {
                    id: doc.id,
                    listingAmount: data.listingAmount,
                    listingTitle: data.listingTitle,
                    lastMessageSender: data.lastMessageSender,
                    lastMessageTime: data.lastMessageTime,
                    lastMessage: data.lastMessage,
                    recName: data.recName,
                    recUID: data.recUID,
                    senderName: data.senderName,
                    senderUID: sender,
                    otherUsername: data.senderName==currentUserData?.username ? data.recName : data.senderName,
                    type: sender == currentUserData?.uid ? 'OUTGOING' : 'INCOMING',
                    status: data.status
                } as Chat
            });
            setConversations(convos);

        }, (error) => {
            console.error("Error fetching chats: ",error)
        })
        return() => unsubscribe()
    }, [currentMessages,currentUser,chatsCollectionRef])
    
    // Gathers (up to) 50 messages from the selected chat
    useEffect(()=>{
        if (!selectedConversationId) {
            setCurrentMessages([])
            return
        }
        const messagesRef = collection(db,"Chats",selectedConversationId,"messages")
        const q = query(messagesRef as CollectionReference<Message>, orderBy('timestamp', 'asc'), limit(50))
         const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map((doc: QueryDocumentSnapshot<Message>) =>{
                const data = doc.data();
                return {
                    id: doc.id,
                    senderId: data.senderId,
                    text: data.text,
                    timestamp: data.timestamp,
                    type: data.type,
                    counterAmount: data.counterAmount,
                    counterStatus: data.counterStatus
                } as Message
            });
            setCurrentMessages(messages);
        }, (error) => {
            console.error("Error fetching chats: ",error)
        })
        return() => unsubscribe()
    }, [selectedConversationId, db, currentUserData])

    // Scrolls down when a new message appears
    useEffect(()=>{
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
    },[currentMessages])

    // Submits new message to firebase
    const sendMessage = async (text: string) => {
        if (text=="" || text==null){
            toast.warn("No message entered",{toastId:"no-message-error"})
            return
        }
        try {
            setLoading(true)
            setNewMessage("")
            await addDoc(collection(db,"Chats",selectedConversationId,"messages"), {
                senderId: currentUserData?.uid,
                text: newMessage,
                timestamp: serverTimestamp(), 
                type: "text",
            })
            const parentDoc = doc(db,"Chats",selectedConversationId)
            await updateDoc(parentDoc, {
                lastMessage: newMessage,
                lastMessageSender: currentUserData?.uid,
                lastMessageTime: serverTimestamp()
            })

        } catch(e) {
            toast.error("Error occured sending message", {toastId:"send-message-error"})
            console.log("Error occured sending message: ",e)
        }
        setLoading(false)
    }

    // Selects 1st chat found under new view
    const handleToggleView = (newView: OfferMessageType) => {
        setView(newView);
        
        setSelectedConversationId("");
        setCurrentMessages([]);

        const firstChat = conversations.find(convo => convo.type === newView);

        if (firstChat) {
            setSelectedConversationId(firstChat.id);
        }
    };

    // Submits counter offer to firebase
    const sendCounterOffer = async (amount: number) => {
        console.log(selectedConversation)
        if (!selectedConversation) return;

        setShowCounterModal(false); // Close modal immediately
        try {
            setLoading(true);
            const text = `Counter offer submitted for $${amount}.`;

            // 1. Add the counter message to the messages subcollection
            await addDoc(collection(db, "Chats", selectedConversationId, "messages"), {
                senderId: currentUserData?.uid,
                text: text,
                timestamp: serverTimestamp(),
                type: "counter",
                counterAmount: amount,
                counterStatus: 'pending'
            });

            // 2. Update the parent chat document
            const parentDoc = doc(db, "Chats", selectedConversationId);
            await updateDoc(parentDoc, {
                lastMessage: text,
                lastMessageSender: currentUserData?.uid,
                lastMessageTime: serverTimestamp(),
            });

            toast.success(`Counter offer for $${amount} sent!`, { toastId: "counter-success" });
            setShowCounterModal(false)

        } catch (e) {
            toast.error("Error sending counter offer.", { toastId: "counter-error" });
            console.log("Error sending counter offer: ", e);
        } finally {
            setLoading(false);
        }
    };

    // Handles counter action buttons
    const handleCounterAction = async (messageId: string, action: 'accept' | 'reject') => {
        try {
            setLoading(true);
            const messageDocRef = doc(db, "Chats", selectedConversationId, "messages", messageId);
            
            // 1. Update the message status
            await updateDoc(messageDocRef, {
                counterStatus: action === 'accept' ? 'accepted' : 'rejected',
            });

            // 2. Add a status message to the chat
            const statusText = action === 'accept' 
                ? `Counter offer accepted! Moving forward with the transaction at the new price.`
                : `Counter offer declined.`;

            // 3. Update the parent chat last message
            const parentDoc = doc(db,"Chats",selectedConversationId)
            await updateDoc(parentDoc, {
                lastMessage: statusText,
                lastMessageSender: currentUserData?.uid,
                lastMessageTime: serverTimestamp()
            })

            toast.success(`Counter offer ${action}ed.`, { toastId: `${action}-success` });

            // set listing status to 'reserved' here

        } catch (e) {
            toast.error(`Error ${action}ing counter offer.`, { toastId: `${action}-error` });
            console.error(`Error ${action}ing counter offer: `, e);
        } finally {
            setLoading(false);
        }
    }

    // Handles removing offer
    const handleRemoveOffer = async () => {
        await deleteDoc(doc(db,"Chats",selectedConversationId))
    }

    const selectedConversation = conversations.find(c=>c.id === selectedConversationId)

    return (
        // Applied the dark gradient background to the entire page
        <div className="h-screen bg-gradient-to-b from-[#12091a] via-[#1a0f2e] to-[#2c1844] text-white overflow-hidden"
            onClick={()=>setShowActionMenu(false)}>
            <Navbar 
                handleLogout={handleLogout}
                setShowLoginModal={()=>{}}
                setShowMenu={setShowMenu}
                navigate={navigate}/>
            <Menu showMenu={showMenu} setShowMenu={setShowMenu}/>
            <CustomToastContainer />
            {/* Header */}
                <div className="flex mt-2 mb-2">
                    {/* Go back button - Updated text color to gold/white */}
                        <button 
                            onClick={() => navigate(-1)} // Go back to the previous page (Listings)
                            className="flex items-center text-[#FDD023] hover:text-white p-4 pr-0 font-semibold"
                        >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Listings
                        </button> 
                    <MessageToggle currentView={view} toggleView={handleToggleView} incomingCount={incomingCount} outgoingCount={outgoingCount}/>
                </div>
            {/* Main Chat Area */}
            <main className="flex flex-1 h-[calc(100vh-142px)] overflow-hidden">
                {/* Sidebar: Chat List */}
                    {/* Updated sidebar background, border, and text colors */}
                    <aside className="w-full sm:w-1/3 max-w-xs h-full border-zinc-700 border-t border-r rounded-r-md bg-[#1a0f2e] flex flex-col">
                        <div className="p-4 border-zinc-700 border-b">
                            <h2 className="text-xl font-semibold text-[#FDD023]">Chats ({view == 'INCOMING' ? incomingCount : outgoingCount})</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.filter((convo) => convo.type===view).map((convo) => {
                                const isSelected = convo.id === selectedConversationId
                                return (
                                    <div
                                        key={convo.id}
                                        onClick={()=> setSelectedConversationId(convo.id)}
                                        // Updated selected/unselected styles
                                        className={`p-3 border-zinc-700 border-b transition-colors ${
                                            isSelected ? 'bg-[#2c1844] border-l-4 border-[#FDD023]' : 'bg-transparent hover:cursor-pointer hover:bg-[#1a0f2e]/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center justify-center">
                                                <span className=" h-2 w-2 rounded-full bg-[#FDD023] flex-shrink-0"/> {/* Notification dot (Gold) */}
                                                <p className={`ml-2 font-md font-bold ${isSelected ? "text-[#FDD023]" : "text-white"}`}>{convo.listingTitle}</p>
                                            </div>
                                            <div className="mt-0.5 items-center text-right">
                                                <p className={`text-xs text-white ${convo.status === 'ongoing' ? "mb-4.5" : ""}`}>
                                                    {convo.lastMessageTime ? convo.lastMessageTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New Chat'}
                                                </p>
                                                {convo.status === 'terminated' && (
                                                    <p className="text-red-100 text-xs mt-0.5 font-italic rounded-lg bg-red-500 px-1"> Offer Removed</p>
                                                )}
                                            </div>
                                        </div>
                                        <p className={`text-sm text-white truncate `}>{convo.lastMessageSender == currentUserData?.uid ? "You: " +convo.lastMessage : convo.otherUsername +": "+convo.lastMessage}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </aside>
                {/* Chat Window: Message Display */}
                    <section className="flex-1 flex flex-col  shadow-lg rounded-tl-md">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4  bg-[#2c1844] text-white shadow-md">
                                    <h2 className="text-xl font-bold">
                                        Chat with {selectedConversation.otherUsername}
                                    </h2>
                                </div>

                                {/* Messages Container */}
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#1a0f2e]">
                                    {currentMessages.map((msg, index) => {
                                        const isCurrentUser = msg.senderId === currentUserData?.uid;
                                        const time = msg.timestamp 
                                            ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                            : '...';

                                        if (msg.type === 'counter') {
                                            const isIncomingOffer = !isCurrentUser;
                                            const isPending = msg.counterStatus === 'pending';

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        // Distinct card style for counter offers - using gold accent
                                                        className={`max-w-[80%] sm:max-w-[70%] lg:max-w-[60%] p-4 rounded-2xl shadow-lg border-2 ${
                                                            isCurrentUser 
                                                                ? 'bg-[#FDD023]/20 border-[#FDD023]/40 text-white rounded-br-md' // Outgoing
                                                                : 'bg-[#FDD023]/30 border-[#FDD023]/60 text-white rounded-tl-md' // Incoming
                                                        }`}
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <Scale className="w-6 h-6 text-[#FDD023]" />
                                                            <h4 className="font-bold text-lg text-[#FDD023]">
                                                                {isCurrentUser ? 'Your Counter Offer' : 'Incoming Counter Offer'}
                                                            </h4>
                                                        </div>
                                                        <p className="mb-1 text-gray-300">
                                                            Listed Price: ${selectedConversation.listingAmount}
                                                        </p>

                                                        <p className="text-sm font-semibold mb-3">
                                                            Amount: <span className="text-[#FDD023]">${msg.counterAmount}</span>
                                                        </p>

                                                        {/* Status Indicator */}
                                                        <div className={`text-xs font-medium py-1 px-2 rounded-full inline-flex items-center ${
                                                            msg.counterStatus === 'accepted' ? 'bg-green-600 text-white' :
                                                            msg.counterStatus === 'rejected' ? 'bg-red-600 text-white' :
                                                            'bg-blue-600 text-white'
                                                        }`}>
                                                            {msg.counterStatus === 'accepted' && <Check className="w-4 h-4 mr-1" />}
                                                            {msg.counterStatus === 'rejected' && <Ban className="w-4 h-4 mr-1" />}
                                                            {msg.counterStatus === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                                                            {msg.counterStatus?.toUpperCase() || 'UNKNOWN'}
                                                        </div>

                                                        {/* Accept/Reject Buttons for INCOMING PENDING Offers */}
                                                        {isIncomingOffer && isPending && (
                                                            <div className="mt-4 pt-3 border-t border-zinc-700 flex space-x-2">
                                                                <button
                                                                    onClick={() => handleCounterAction(msg.id, 'accept')}
                                                                    disabled={loading}
                                                                    className="flex-1 py-2 px-3 text-sm font-semibold text-black bg-[#FDD023] rounded-lg hover:bg-[#FDD023]/90 transition disabled:bg-gray-400"
                                                                >
                                                                    <Check className="w-4 h-4 mr-1 inline-block" /> Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCounterAction(msg.id, 'reject')}
                                                                    disabled={loading}
                                                                    className="flex-1 py-2 px-3 text-sm font-semibold text-white bg-red-700 rounded-lg hover:bg-red-800 transition disabled:bg-gray-400"
                                                                >
                                                                    <X className="w-4 h-4 mr-1 inline-block" /> Decline
                                                                </button>
                                                            </div>
                                                        )}
                                                        <span className="block text-xs mt-2 text-right opacity-80 text-gray-400">
                                                            {time}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        else {
                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] sm:max-w-[70%] lg:max-w-[60%] p-3 rounded-2xl shadow-sm ${
                                                            isCurrentUser
                                                                // Updated message bubble styles to dark purple/gold accent
                                                                ? 'bg-[#2c1844] text-white rounded-br-md rounded-tr-xl rounded-bl-xl rounded-tl-xl'
                                                                : 'bg-[#dfba25] text-black rounded-tl-md rounded-br-xl rounded-bl-xl rounded-tr-xl'
                                                        }`}
                                                    >
                                                    {msg.type=='text' && (
                                                        <div>
                                                            <p className="text-sm break-words leading-relaxed">{msg.text}</p>
                                                            <span className={`block text-xs mt-1 text-right opacity-70 ${isCurrentUser ? 'text-gray-400' : 'text-gray-700'}`}>
                                                                {time}
                                                            </span>
                                                        </div>
                                                    )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })}
                                    {/* Ref for auto-scrolling to the latest message */}
                                    <div ref={messagesEndRef} />
                                </div>
                                
                                {/* Message Input */}
                                <div className="p-4 border-t border-zinc-700 bg-[#2c1844] shadow-t-lg">
                                    <div className="flex space-x-3 items-center">
                                        <input 
                                            type="text" 
                                            placeholder={selectedConversation.status === 'terminated' ? "This chat has been terminated." : "Type a message..."}
                                            className={`flex-1 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 ${selectedConversation.status === 'terminated' ? "!cursor-not-allowed" : ""} focus:border-purple-500 transition duration-150`}
                                            value = {newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown = {(e) => {if (e.key == 'Enter') {e.preventDefault(); sendMessage(newMessage)}}}
                                            maxLength={150}
                                            disabled={selectedConversation.status === 'terminated'}
                                        />
                                        
                                            <div className="flex items-center relative"
                                                onClick={(e)=>e.stopPropagation()}>
                                               {/* Action Button */}
                                               {selectedConversation.status === 'ongoing' ? (
                                                <button 
                                                    onClick={() => {setShowActionMenu(prev => !prev);console.log("toggle")}}
                                                    className={`p-3 text-white hover:text-white hover:bg-purple-800 bg-purple-900 rounded-xl transition duration-150 flex items-center justify-center`}
                                                    aria-expanded={showActionMenu}
                                                    title="More Actions"
                                                 >
                                                    <Plus className="w-5 h-5" />
                                                </button>)
                                                : (
                                                    <button 
                                                    onClick={() => {setShowActionMenu(prev => !prev);console.log("toggle")}}
                                                    className={`p-3 hover:bg-red-600 bg-red-500 rounded-xl transition duration-150 flex items-center justify-center`}
                                                    aria-expanded={showActionMenu}
                                                    title="More Actions"
                                                 >
                                                    <Trash className="stroke-white w-5 h-5" />
                                                </button>)
                                                }

                                               {/* Drop-up Menu */}
                                               {showActionMenu && (
                                                   <div className="absolute bottom-full mb-3 right-0 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                                                       {selectedConversation.status==="ongoing" ? (
                                                        <button onClick={()=>{setShowCounterModal(true);setShowActionMenu(false)}} className="items-center flex w-full text-left px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-yellow-100">
                                                        <Scale className="mt-1 mr-2 w-5 h-5 stroke-yellow-400 stroke-3"/>
                                                           Send Counter
                                                       </button>) : null}
                                                       <button className="items-center flex w-full text-left px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-red-100">
                                                        <Flag className="mt-1 mr-2 w-5 h-5 stroke-red-400 stroke-2.5 fill-red-400"/>
                                                           Report User
                                                       </button>
                                                       <button 
                                                        className="items-center flex w-full text-left px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-red-200"
                                                        onClick={() => {handleRemoveOffer();setShowActionMenu(false)}}>
                                                        <Ban className="mt-1 mr-2 w-5 h-5 stroke-red-400 stroke-2.5"/>
                                                           Close Offer
                                                       </button>
                                                   </div>
                                               )}
                                            </div>
                                            <button 
                                                onClick={() => sendMessage(newMessage)}
                                                disabled={!newMessage || loading}
                                                // Send button using gold accent
                                                className="p-3 text-black bg-[#FDD023] hover:bg-[#FDD023]/90 rounded-xl transition duration-150 disabled:!cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-300 flex items-center justify-center"
                                            >
                                                Send
                                            </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-[#1a0f2e] text-white">
                                <p className="text-xl font-semibold mb-2">No conversation selected</p>
                                <p className="text-gray-400">Select a chat from the sidebar to view messages.</p>
                            </div>
                        )}
                    </section>
                </main>
            <CounterOfferModal 
                isOpen={showCounterModal} 
                onClose={() => setShowCounterModal(false)}
                onSend={sendCounterOffer}
                listingTitle={selectedConversation?.listingTitle || "Item"}
                listingAmount={selectedConversation?.listingAmount || 0}
            />
        </div>
    );
}