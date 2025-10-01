import { FormEvent } from 'react'
import { auth } from '../firebase/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'


const Login = () => {

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
                //navigate to home page
            }
        }catch(err){
            //throw toast error with err.message
        }
    }

    //Add HTML

}

export default Login;