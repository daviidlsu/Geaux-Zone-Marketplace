import { FormEvent } from 'react'
import { auth } from '../firebase/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'


const Login = () => {
    const navigate = useNavigate();

    const handleLogin = async (e:FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const formData = new FormData(e.currentTarget);
        const {email, password} = Object.fromEntries(formData.entries()) as Record<string,string>;

        //sanitize user input

        try{
            const user = await signInWithEmailAndPassword(auth, email, password)
            if (user){
                //retrieve user authtoken
                //throw successful login toast
                //navigate('/'); //redirect to previous page
            }
        }catch(err){
            //throw toast error with err.message
        }
    }

    //Add HTML
    return (
        <div>
            <form onSubmit={handleLogin}>
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
                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default Login;