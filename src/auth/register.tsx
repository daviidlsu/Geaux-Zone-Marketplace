import React, { FormEvent, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer, Zoom } from 'react-toastify';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const toastID = "current-toast";

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repassword, setRepassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const lsuEmailRegex = /^[^@\s]+@lsu\.edu$/i;

    const handleHome = async () => {
        navigate('/');
    };

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const trimmedEmail = email.trim();

        // Basic validations
        if (!username) {
            toast.warn("Please enter a username", { toastId: toastID });
            return;
        }
        if (!trimmedEmail || !lsuEmailRegex.test(trimmedEmail)) {
            toast.warn("Please enter a valid @lsu.edu email", { toastId: toastID });
            return;
        }
        if (!password) {
            toast.warn("Please enter a password", { toastId: toastID });
            return;
        }
        if (!repassword) {
            toast.warn("Please re-enter your password", { toastId: toastID });
            return;
        }
        if (password.length < 8 || !/[!@#$%^&*_]/.test(password)) {
            toast.warn("Password must be at least 8 characters long and contain at least one special character", { toastId: toastID });
            return;
        }
        if (password !== repassword) {
            toast.warn("Passwords do not match", { toastId: toastID });
            return;
        }

        // Check existing email
        try {
            setSubmitting(true);
            const q = query(collection(db, "Users"), where("email", "==", trimmedEmail));
            const qSnapshot = await getDocs(q);
            if (!qSnapshot.empty) {
                toast.warn("Email already in use", { toastId: toastID });
                return;
            }

            const newuser = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
            await setDoc(doc(db, "Users", newuser.user.uid), {
                username,
                email: trimmedEmail,
                id: newuser.user.uid
            });

            await setDoc(doc(db, "UserChats", newuser.user.uid), {
                chats: []
            });

            toast.success("Account created!", { toastId: toastID });
            toast.success("Redirecting to login...", { toastId: toastID });
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message ?? "An error occurred. Please try again.", { toastId: toastID });
            setError(err?.message ?? "An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
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

            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-purple-900 text-2xl">LSU</div>
                        <h1 className="text-2xl font-bold text-gray-900 mt-4">Create an account</h1>
                        <p className="text-sm text-gray-500">Register with your @lsu.edu account</p>
                    </div>

                    <form onSubmit={handleRegister} noValidate>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your display name"
                            className="mt-1 mb-4 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@lsu.edu"
                            className="mt-1 mb-4 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            className="mt-1 mb-4 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            name="repassword"
                            value={repassword}
                            onChange={(e) => setRepassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="mt-1 mb-4 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        {error && <div role="alert" className="text-sm text-red-600 mb-4">{error}</div>}

                        <button
                            type="submit"
                            className={`w-full px-4 py-3 rounded-lg font-semibold text-white ${
                                submitting
                                    ? 'bg-purple-900/60 cursor-not-allowed opacity-80'
                                    : 'bg-purple-900 hover:bg-purple-800'
                            }`}
                            disabled={submitting}
                        >
                            {submitting ? 'Creating account…' : 'Create account'}
                        </button>

                        <div className="mt-4 text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-purple-900 hover:underline">Sign in</Link>
                        </div>
                    </form>
                </div>
            </main>

            <div className="max-w-7xl mx-auto px-6 py-4">
                <button className="mt-4 px-4 py-2 bg-yellow-400 text-purple-900 rounded-lg" onClick={handleHome}>Back to Home</button>
            </div>

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
    );
}

export default Register;