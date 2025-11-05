import { toast } from "react-toastify"
import { useAuth } from "./auth/auth"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import Navbar from "./components/navbar"
import Menu from "./components/menu"
import CustomToastContainer from "./components/toast"

export default function IncomingMessages() {
    const navigate = useNavigate()
    const { logout } = useAuth()
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar 
            handleLogout={handleLogout}
            setShowLoginModal={()=>{}}
            setShowMenu={setShowMenu}
            navigate={navigate}
        />
            <Menu showMenu={showMenu} setShowMenu={setShowMenu}/>
            <CustomToastContainer/>
        </div>
    )
}