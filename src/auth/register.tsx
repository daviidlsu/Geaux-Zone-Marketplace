import { FormEvent } from "react";
import { auth, db } from "../firebase/firebase";
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from 'react-toastify';

const Register = () => {
    const navigate = useNavigate();

    const handleHome = async () => {
        navigate('/');
    }

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const formData = new FormData(e.currentTarget);
        const { username, email, password, repassword } = Object.fromEntries(formData.entries()) as Record<string, string>; //Casts the form entries to String key : String value pairs instead of Unknown

        {//Check for empty fields
            if (!username){
                toast.warn("Please enter a username");
                //Add css to make field red
                return;
            }
            if (!email || !email.endsWith("@lsu.edu")){
                toast.warn("Please enter a valid school email");
                //Add css to make field red
                return;
            }
            if (!password){
                toast.warn("Please enter a password");
                //Add css to make field red
                return;
            }
            if (!repassword){
                toast.warn("Please re-enter your password");
                //Add css to make field red
                return;
            }}

        {//Check if email already exists
            const q = query(collection(db, "Users"), where("email","==",email));
            const qSnapshot = await getDocs(q);
            if (!qSnapshot.empty){
                toast.warn("Email already in use");
                return;
            }}
        {//Check if school email
            if (!email.endsWith("@lsu.edu")){
                toast.warn("Please use a valid school email");
                return;
            }}
        {//Check if valid password
            if (password.length < 8 || !/[!@#$%^&*_]/.test(password)){
                toast.warn("Password must be at least 8 characters long and contain at least one special character");
                return;
            }}
        {//Check if passwords match
            if (password!=repassword){
                toast.warn("Passwords do not match");
                return;
            }}

        try{ 
            const newuser = await createUserWithEmailAndPassword(auth, email, password)
            await setDoc(doc(db,"Users", newuser.user.uid), {
                username,
                email,
                id: newuser.user.uid
            });

            await setDoc(doc(db, "UserChats", newuser.user.uid), {
                chats: []
            });
            toast.success("Account created!");
            toast.success("Redirecting to login...");
            setTimeout(() => navigate('/login'), 3000);
        }catch(error){
            toast.error("An error occurred. Please try again.");
        }
    }

    return (
        <div>
            <form onSubmit={handleRegister}>
                <div>
                    <label>Username</label>
                    <input
                        type="text"
                        name="username"
                    />
                </div>
                <div>
                    <label>Email</label>
                    <input
                        type="text"
                        name="email"
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                    />
                </div>
                <div>
                    <label>Re-enter Password</label>
                    <input
                        type="password"
                        name="repassword"
                    />
                </div>
                <button type="submit" className="border 1px">Register</button>
            </form>
            <button className="border 1px" onClick={handleHome}>Back to Home</button>
            <ToastContainer
                position="bottom-right"
                autoClose={4000}
                hideProgressBar={true}
                transition={Zoom}
                theme="light"
            />
        </div>
    );

}

export default Register;