import { FormEvent } from "react";
import { auth, db } from "../firebase/firebase";
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from "firebase/firestore";

const Register = () => {

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const formData = new FormData(e.currentTarget);
        const { username, email, password, repassword } = Object.fromEntries(formData.entries()) as Record<string, string>; //Casts the form entries to String key : String value pairs instead of Unknown

        if (password!=repassword){
            //return toast error
        }

        //sanitize/validate user input

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

            //Toast successful creation message
        }catch(err){
            //throw toast error with err.message
        }
    }

    //Add HTML

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
                        type="email"
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
                <button type="submit">Register</button>
            </form>
        </div>
    );

}

export default Register;