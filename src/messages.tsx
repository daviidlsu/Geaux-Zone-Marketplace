import { useEffect, useMemo, useRef } from "react"
import { toast } from "react-toastify"
import { useAuth } from "./auth/auth"
import { useState } from "react"
import { replace, useNavigate, useParams } from "react-router-dom"
import { addDoc, collection, CollectionReference, doc, getDoc, getDocs, limit, onSnapshot, or, orderBy, query, QueryDocumentSnapshot, serverTimestamp, Timestamp, updateDoc, where } from "firebase/firestore"
import { db } from "./firebase/firebase"

import Navbar from "./components/navbar"
import Menu from "./components/menu"
import CustomToastContainer from "./components/toast"
import { Plus, Ban, Check } from "lucide-react"

type OfferMessageType = 'INCOMING' | 'OUTGOING';
type MessageContent = 'accept' | 'reject' | 'text';

interface MessageToggleProps {
    currentView: OfferMessageType;
    setView: (view: OfferMessageType) => void;
    incomingCount: number;
    outgoingCount: number;
    clearChatInfo(): void
}

interface Chat {
    id: string
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
}

interface Message {
    senderId: string
    text: string
    timestamp: Timestamp 
    type: MessageContent
}

const MessageToggle: React.FC<MessageToggleProps> = ({ currentView, setView, clearChatInfo, incomingCount, outgoingCount }) => {
  const baseClasses = "px-6 py-3 font-medium text-center rounded-lg transition-all duration-300 flex-1 relative z-10";
  const activeClasses = "text-white shadow-xl";
  const inactiveClasses = "text-gray-600 hover:text-purple-900";
  
  const isIncoming = currentView === 'INCOMING';

  return (
    <div className="relative flex w-full max-w-lg mx-auto bg-gray-200 p-1 rounded-xl shadow-inner">
      {/* Active Indicator */}
      <div
        className={`absolute top-1 bottom-1 w-1/2 bg-purple-900 rounded-lg shadow-md transition-all duration-300 ease-in-out`}
        style={{ left: isIncoming ? '0.25rem' : 'calc(50% - 0.25rem)' }}
      ></div>

      {/* Incoming Button */}
      <button
        className={`${baseClasses} ${isIncoming ? activeClasses : inactiveClasses}`}
        onClick={() => {setView('INCOMING');clearChatInfo()}}
      >
        Incoming Offers ({incomingCount})
      </button>

      {/* Outgoing Button */}
      <button
        className={`${baseClasses} ${!isIncoming ? activeClasses : inactiveClasses}`}
        onClick={() => {setView('OUTGOING');clearChatInfo()}}
      >
        Outgoing Offers ({outgoingCount})
      </button>
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

    // Sets chat based on chatId in URL
    useEffect(()=> {
        if (chatId && conversations.length >0) {
            const targetChat = conversations.find(c=>c.id==chatId)
            if (targetChat) {
                const chatType = targetChat.senderUID == currentUserData?.uid ? 'OUTGOING' : 'INCOMING'
                setView(chatType)
                setSelectedConversationId(chatId)
                navigate('/messages', {replace:true})
            }
        }
    },[chatId,conversations,navigate])

    // Gathers chats in real time
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
                } as Chat
            });
            setConversations(convos);

        }, (error) => {
            console.error("Error fetching chats: ",error)
        })
        return() => unsubscribe()
    }, [currentMessages,currentUser,conversations,selectedConversationId])
    
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
                    senderId: data.senderId,
                    text: data.text,
                    timestamp: data.timestamp,
                    type: data.type,
                } as Message
            });
            /* const lastMessage = messages[messages.length-1]
            if (lastMessage && lastMessage.senderId){
                setConversations(prevConvos => {
                    const updatedConvoIndex = prevConvos.findIndex(c => c.id === selectedConversationId);
                    if (updatedConvoIndex > -1) {
                        const updatedConvo = { ...prevConvos[updatedConvoIndex] };
                        updatedConvo.lastMessage = lastMessage.text;
                        updatedConvo.lastMessageTime = lastMessage.timestamp;
                        updatedConvo.lastMessageSender = lastMessage.senderId;

                        // Move the updated conversation to the very top (index 0)
                        const otherConvos = prevConvos.filter((_, index) => index !== updatedConvoIndex);
                        return [updatedConvo, ...otherConvos];
                    }
                return prevConvos;
                })

            } */

            setCurrentMessages(messages);
        }, (error) => {
            console.error("Error fetching chats: ",error)
        })
        return() => unsubscribe()
    }, [selectedConversationId, db])

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

    // Clears selected chat info when toggling 'incoming' and 'outgoing'
    const clearChatInfo = () => {
        setSelectedConversationId("")
        setCurrentMessages([])
    }

    const selectedConversation = conversations.find(c=>c.id === selectedConversationId)

    return (
        <div className="h-screen bg-gray-50 overflow-hidden">
            <Navbar 
                handleLogout={handleLogout}
                setShowLoginModal={()=>{}}
                setShowMenu={setShowMenu}
                navigate={navigate}/>
            <Menu showMenu={showMenu} setShowMenu={setShowMenu}/>
            <div className="mt-2 mb-2">
                <MessageToggle currentView={view} setView={setView} clearChatInfo={clearChatInfo} incomingCount={incomingCount} outgoingCount={outgoingCount}/>
            </div>
            <main className="flex flex-1 h-[calc(100vh-142px)] overflow-hidden">
                {/* Sidebar: Chat List */}
                    <aside className="w-full sm:w-1/3 max-w-xs h-full border-gray-300 border-t border-r rounded-r-md bg-white flex flex-col">
                        <div className="p-4 border-gray-300 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">Chats ({view == 'INCOMING' ? incomingCount : outgoingCount})</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.filter((convo) => convo.type===view).map((convo) => {
                                const isSelected = convo.id === selectedConversationId
                                return (
                                    <div
                                        key={convo.id}
                                        onClick={()=> setSelectedConversationId(convo.id)}
                                        className={`p-3 border-1 border-gray-300 ${
                                            isSelected ? 'bg-purple-900 border-l-4 border-purple-900' : 'bg-gray-200 hover:cursor-pointer hover:bg-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center justify-center">
                                                <span className=" h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"/> {/* Notification dot */}
                                                <p className={`ml-2 font-md font-bold ${isSelected ? "text-white" : "text-purple-900"}`}>{convo.listingTitle}</p>
                                            </div>
                                            <p className={`mt-0.5 text-xs text-gray-200 mt-0.5 ${isSelected ? "text-white" : "text-purple-900"}`}>
                                                {convo.lastMessageTime ? convo.lastMessageTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New Chat'}
                                            </p>
                                        </div>
                                        <p className={`text-sm text-gray-500 truncate mt-1 ${isSelected ? "text-white" : "text-purple-900"}`}>{convo.lastMessageSender == currentUserData?.uid ? "You: " +convo.lastMessage : convo.otherUsername +": "+convo.lastMessage}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </aside>
                {/* Chat Window: Message Display */}
                    <section className="flex-1 flex flex-col bg-white border-t border-gray-300 shadow-lg rounded-tl-md">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-300 bg-purple-900 text-white shadow-md">
                                    <h2 className="text-xl font-bold">
                                        Chat with {selectedConversation.otherUsername}
                                    </h2>
                                </div>

                                {/* Messages Container */}
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                    {currentMessages.map((msg, index) => {
                                        const isCurrentUser = msg.senderId === currentUserData?.uid;
                                        const time = msg.timestamp 
                                            ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                            : '...';

                                        return (
                                            <div
                                                key={index}
                                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] sm:max-w-[70%] lg:max-w-[60%] p-3 rounded-2xl shadow-sm ${
                                                        isCurrentUser
                                                            ? 'bg-purple-600 text-white rounded-br-md rounded-tr-xl rounded-bl-xl rounded-tl-xl'
                                                            : 'bg-gray-200 text-gray-800 rounded-tl-md rounded-br-xl rounded-bl-xl rounded-tr-xl'
                                                    }`}
                                                >
                                                    <p className="text-sm break-words leading-relaxed">{msg.text}</p>
                                                    <span className={`block text-xs mt-1 text-right opacity-70 ${isCurrentUser ? 'text-purple-200' : 'text-gray-600'}`}>
                                                        {time}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Ref for auto-scrolling to the latest message */}
                                    <div ref={messagesEndRef} />
                                </div>
                                
                                {/* Message Input */}
                                <div className="p-4 border-t border-gray-300 bg-white shadow-t-lg">
                                    <div className="flex space-x-3 items-center">
                                        <input 
                                            type="text" 
                                            placeholder="Type a message..."
                                            className="flex-1 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150"
                                            value = {newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown = {(e) => {if (e.key == 'Enter') {e.preventDefault(); sendMessage(newMessage)}}}
                                            maxLength={150}
                                        />
                                        {view=='INCOMING' && (
                                            <div className="flex items-center relative">
                                               {/* Action Button */}
                                               <button 
                                                   onClick={() => {setShowActionMenu(prev => !prev);console.log("toggle")}}
                                                   className="p-3 text-white hover:text-white hover:bg-purple-800 bg-purple-900 rounded-xl transition duration-150 flex items-center justify-center"
                                                   aria-expanded={showActionMenu}
                                                   title="More Actions"
                                                >
                                                   <Plus className="w-5 h-5" />
                                               </button>

                                               {/* Drop-up Menu */}
                                               {showActionMenu && (
                                                   <div className="absolute bottom-full mb-3 right-0 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                                                       <button className="items-center flex w-full text-left px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-green-100">
                                                        <Check className="mt-1 mr-2 w-5 h-5 stroke-green-400 stroke-3"/>
                                                           Accept Offer
                                                       </button>
                                                       <button className="items-center flex w-full text-left px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-red-100">
                                                        <Ban className="mt-1 mr-2 w-5 h-5 stroke-red-400 stroke-2.5"/>
                                                           Decline Offer
                                                       </button>
                                                   </div>
                                               )}
                                            </div>
                                        )}

                                        <button 
                                            className={`px-6 py-3 ${loading || newMessage=="" ? "bg-gray-400 cursor-not-allowed!"  : "bg-purple-900"} text-white font-semibold rounded-xl transition duration-150`}
                                            disabled={loading || newMessage==""}
                                            onClick = {()=>sendMessage(newMessage)}
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                                <svg className="w-16 h-16 mb-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                <p className="text-xl font-medium">Select a chat to start messaging.</p>
                                <p className="text-md mt-2">Your conversations will appear in the list on the left.</p>
                            </div>
                        )}
                    </section>
            </main>
            <CustomToastContainer/>
        </div>
    )
}