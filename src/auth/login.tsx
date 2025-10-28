import { FormEvent, useState } from 'react'
import { auth } from '../firebase/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useNavigate, Link } from 'react-router-dom'
import { toast, ToastContainer, Zoom } from 'react-toastify'

const Login = () => {
    const navigate = useNavigate()
    const toastID = "login-toast"

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Require exact @lsu.edu domain (no subdomains). Case-insensitive.
    const lsuEmailRegex = /^[^@\s]+@lsu\.edu$/i

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

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
            const user = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword)
            if (user) {
                toast.success("Login Successful!", { toastId: toastID })
                navigate('/')
            }
        } catch (err: any) {
            console.error(err)
            toast.error(err?.message ?? "Failed to sign in", { toastId: toastID })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top navigation like Welcome page */}
            <header className="bg-purple-900 shadow-md">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-purple-900 text-lg">
                            LSU
                        </div>
                        <span className="text-white font-bold text-xl">Geaux-Zone Marketplace</span>
                    </div>
                    <div>
                        <Link to="/" className="px-4 py-1 rounded-2xl bg-yellow-400 text-purple-900 font-semibold hover:bg-yellow-300">Home</Link>
                    </div>
                </div>
            </header>

            {/* Centered login card */}
            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-purple-900 text-2xl">LSU</div>
                        <h1 className="text-2xl font-bold text-gray-900 mt-4">Welcome Back</h1>
                        <p className="text-sm text-gray-500">Sign in with your @lsu.edu account</p>
                    </div>

                    <form onSubmit={handleLogin} noValidate>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => {
                                if (email && !lsuEmailRegex.test(email.trim())) {
                                    toast.warn("Please sign in with a valid @lsu.edu email address", { toastId: toastID })
                                }
                            }}
                            placeholder="you@lsu.edu"
                            className="mt-1 mb-4 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="mt-1 mb-4 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        {error && <div role="alert" className="text-sm text-red-600 mb-4">{error}</div>}

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

            <ToastContainer
                toastStyle={{ backgroundColor: '#421168ff', color: '#fff', border: '1.5px #421168ff' , borderRadius: '16px'}}
                position="top-right"
                autoClose={4000}
                closeOnClick
                hideProgressBar={true}
                transition={Zoom}
                theme="light"
            />
        </div>
    )
}

export default Login