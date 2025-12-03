import { useNavigate } from 'react-router-dom'
import { X, Library, House, Mail, ShoppingCart, Info, MapPin, User} from "lucide-react";

interface MenuProps {
    showMenu: boolean
    setShowMenu: (show: boolean) => void
}

export default function Menu({ showMenu, setShowMenu}: MenuProps) {
    const navigate = useNavigate()

    const menuItems = [
        { name: 'About', icon: Info ,action: () => navigate('/') },
        { name: 'Home', icon: House, action: () => navigate('/listings') },
        { name: 'Profile', icon: User, action: () => navigate('/profile') },
        { name: 'Your Listings', icon: Library, action: () => navigate('/my-listings') },
        { name: 'Outgoing Offers', icon: ShoppingCart, action: () => navigate('/outgoing-offers') },
        { name: 'Messages', icon: Mail, action: () => navigate('/messages') },
        { name:  'Events', icon: MapPin, action:() => navigate('/events') },
    ];

    return (
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
    )
}
