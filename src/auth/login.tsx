import { FormEvent, useState } from 'react'
import { auth } from '../firebase/firebase'
import { signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import Navbar from '../components/navbar'
import CustomToastContainer from '../components/toast'

const Login = () => {
    const navigate = useNavigate()
    const toastID = "login-toast"

    const [email, setEmail] = useState('')
    const [invalidEmail, setInvalidEmail] = useState<boolean>(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [showResendOption, setShowResendOption] = useState(false)
    const [unverifiedEmail, setUnverifiedEmail] = useState('')
    const [unverifiedPassword, setUnverifiedPassword] = useState('')

    // Require exact @lsu.edu domain (no subdomains). Case-insensitive.
    const lsuEmailRegex = /^[^@\s]+@lsu\.edu$/i

    const handleResendVerification = async () => {
        try {
            // Sign in temporarily to resend verification
            const userCredential = await signInWithEmailAndPassword(auth, unverifiedEmail, unverifiedPassword)
            
            const actionCodeSettings = {
                url: `${window.location.origin}/login?verified=true`,
                handleCodeInApp: false,
            }
            
            await sendEmailVerification(userCredential.user, actionCodeSettings)
            await signOut(auth)
            
            toast.success("Verification email resent! Check your inbox.", { toastId: "resend-success" })
            setShowResendOption(false)
        } catch (err) {
            console.error('Resend error:', err)
            toast.error("Failed to resend verification email.", { toastId: "resend-error" })
        }
    }

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setShowResendOption(false)

        const trimmedEmail = email.trim()
        const trimmedPassword = password

        if (!lsuEmailRegex.test(trimmedEmail)) {
            toast.warn("Please sign in with a valid @lsu.edu email address", { toastId: toastID })
            return
        }

        if (!trimmedPassword) {
            toast.warn("Please enter your password", { toastId: toastID })
            return
        }

        try {
            setSubmitting(true)

            // Try signing in
            const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword)
            const user = userCredential.user

            // Block Unverified Emails
            if (!user.emailVerified) {
                await signOut(auth)

                // Store credentials for resend option
                setUnverifiedEmail(trimmedEmail)
                setUnverifiedPassword(trimmedPassword)
                setShowResendOption(true)

                toast.warn("Please verify your LSU email before logging in.", { toastId: "verify-login-warn" })

                return
            }

            toast.success("Login Successful!", { toastId: toastID })
        } catch (err: unknown) {
            console.error(err)
            
            const fbErr = err as FirebaseError
            
            if (fbErr?.code === 'auth/user-not-found') {
                toast.error("No account found with this email", { toastId: toastID })
            } else if (fbErr?.code === 'auth/wrong-password') {
                toast.error("Incorrect password", { toastId: toastID })
            } else if (fbErr?.code === 'auth/invalid-credential') {
                toast.error("Invalid email or password", { toastId: toastID })
            } else if (fbErr?.code === 'auth/too-many-requests') {
                toast.error("Too many failed attempts. Please try again later.", { toastId: toastID })
            } else {
                const message = err instanceof Error ? err.message : String(err) || "Failed to sign in"
                toast.error(message, { toastId: toastID })
            }
            setError("Failed to sign in")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="h-screen overflow-hidden bg-cover flex flex-col bg-[url('/lsu-login.jpg')] bg-bottom">
            <Navbar
                handleLogout={{} as unknown as () => Promise<void>}
                setShowLoginModal={()=>{}}
                setShowMenu={()=>toast.warn("Please Login or Register to access the menu.", {toastId: 'menu-login-warning'})}
                navigate={navigate}
            />

            <main className="flex-1 flex items-center justify-center py-12 px-4 opacity-99">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                    <div className="text-center mb-4">
                        <div className="mx-auto w-24 h-24 bg-purple-900 rounded-lg flex items-center justify-center">
                            <img className="w-18 h-16 " src="/tiger_logo.png" alt="GeauxZone Tiger" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mt-4">Welcome Back</h1>
                        <p className="text-sm text-gray-500">Sign in with your @lsu.edu account</p>
                    </div>

                    <form onSubmit={handleLogin} noValidate className="p-8">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => {
                                if (email && !lsuEmailRegex.test(email.trim())) {
                                    setInvalidEmail(true)
                                } else {
                                    setInvalidEmail(false)
                                }
                            }}
                            placeholder="you@lsu.edu"
                            className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoComplete='off'
                        />

                        {invalidEmail && (
                            <label className="ml-1 text-sm font-medium text-red-500">Please enter a valid school email</label>
                        )}

                        <label className="block mt-4 text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="mt-1 mb-4 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoComplete='off'
                        />

                        {error && <div role="alert" className="text-sm text-red-600 mb-4">{error}</div>}

                        {showResendOption && (
                            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">⚠️</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-yellow-800 mb-1">
                                            Email not verified
                                        </p>
                                        <p className="text-xs text-gray-700 mb-3">
                                            Check your inbox for the verification link, or click below to resend.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleResendVerification}
                                            className="text-sm text-purple-900 hover:underline font-semibold"
                                        >
                                            Resend verification email
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`w-full px-4 py-3 rounded-lg font-semibold text-white ${
                                submitting || !lsuEmailRegex.test(email.trim()) || password.length === 0
                                    ? 'bg-purple-900/60 cursor-not-allowed opacity-80'
                                    : 'bg-purple-900 hover:bg-purple-800'
                            }`}
                            disabled={submitting || !lsuEmailRegex.test(email.trim()) || password.length === 0}
                        >
                            {submitting ? 'Signing in…' : 'Sign in'}
                        </button>

                        <div className="mt-4 text-center text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-purple-900 hover:underline">Sign up</Link>
                        </div>
                    </form>
                </div>
            </main>

            <CustomToastContainer/>
        </div>
    )
}

export default Login