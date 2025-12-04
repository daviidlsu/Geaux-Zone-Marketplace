import { Menu } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

// Define the structure for props this component will accept
interface NavbarProps {
    handleLogout: () => Promise<void>;
    setShowLoginModal: (show: boolean) => void;
    setShowMenu: (show: boolean) => void;
    navigate: (path: string) => void;  
}

export default function Navbar({
    handleLogout,
    setShowLoginModal,
    setShowMenu,
    navigate,
    }: NavbarProps) {
    const { currentUser, currentUserData } = useAuth();
    return (
        <nav className="sticky top-0 z-50 bg-[#461d7c] shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Menu Button */}
                <button 
                    onClick={currentUser 
                        ? () => setShowMenu(true) 
                        : () => {
                            setShowLoginModal(true); 
                            toast.warn("Please Login or Register to access the menu.", {toastId: 'menu-login-warning'});
                          }
                    } 
                    className="absolute flex left-0 top-1/2 transform -translate-y-1/2 ml-6 p-2 w-10 h-10 rounded-full hover:bg-[#ffffff20] transition-colors items-center justify-center"
                >
                    <Menu className="stroke-white w-8 h-8"/>
                </button>
                
                <div className="flex items-center justify-between w-full ml-[-72px]">
                  {/* Logo/Title */}
    <Link to="/listings" className="ml-20 flex items-center gap-3">
  <img
    className="w-10 h-10"
    src="/geauxzone_tiger.png"
    alt="TigerTrade logo"
  />
  <span
    className="text-white font-bold text-xl"
    style={{ fontFamily: "Rock Salt, cursive" }}
  >
    TigerTrade
  </span>
    </Link>

    {/* Auth Buttons (Login/Logout/Signup) */}
        {location.pathname !="/register" && location.pathname !="/login" && (
            <div className="absolute flex right-0 gap-2 mr-6 font-sans">
                <button 
                    onClick={currentUser ? handleLogout : () => setShowLoginModal(true)} 
                    className={`px-4 py-1 rounded-2xl transition-colors font-semibold
                    ${currentUser 
                        ? 'text-white hover:text-yellow-600'
                        : 'text-white hover:text-yellow-600'}`
                    }> 
                    {currentUser ? 'Logout' : 'Login'} 
                </button>
                            
                {currentUser == null && (
                    <button 
                        onClick={() => navigate("/register")} 
                        className="px-2 py-2 rounded-2xl text-yellow-500 font-semibold hover:text-yellow-600 transition-all active:cursor:grabbing"
                    >
                    Sign Up
                    </button>
                )}

                {currentUser != null && currentUserData && (
                    <button 
                        className="w-10 h-10 rounded-full bg-purple-950 text-white font-bold items-center justify-center flex"
                        onClick={() => navigate("/profile")}>
                        {currentUserData.username?.charAt(0).toUpperCase()} 
                    </button>
                )}
             </div>
        )}
        </div>
            </div>
        </nav>
    );
}