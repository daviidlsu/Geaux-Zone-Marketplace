import React, { FormEvent, useState, useMemo } from 'react';
import { auth, db } from '../firebase/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from "../components/navbar"
import CustomToastContainer from '../components/toast';


const Register: React.FC = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [invalidUsername, setInvalidUsername] = useState<boolean>(false);
    const [email, setEmail] = useState('');
    const [invalidEmail, setInvalidEmail] = useState<boolean>(false);
    const [password, setPassword] = useState('');
    const [invalidPass, setInvalidPass] = useState<boolean>(false);
    const [repassword, setRepassword] = useState('');
    const [invalidRepass, setInvalidRepass] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [accountCreated, setAccountCreated] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');

    const lsuEmailRegex = /^[^@\s]+@lsu\.edu$/i;

    const passChecks = useMemo(() => ({
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*_]/.test(password),
    }), [password]);

    const handleResendEmail = async () => {
        try {
            // Sign in temporarily to get access to the user
            const userCredential = await signInWithEmailAndPassword(auth, userEmail, userPassword);
            
            const actionCodeSettings = {
                url: window.location.origin + '/login',
                handleCodeInApp: false,
            };
            await sendEmailVerification(userCredential.user, actionCodeSettings);
            await auth.signOut();
            toast.success("Verification email resent!", { toastId: "resend-success" });
        } catch (err) {
            console.error('Resend error:', err);
            toast.error("Failed to resend email. Try again later.", { toastId: "resend-error" });
        }
    };

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const trimmedEmail = email.trim();

        // Basic validations
        if (!username) {
            toast.warn("Please enter a username", { toastId: "username-toast" });
            setInvalidUsername(true);
            return;
        }
        if (!trimmedEmail || !lsuEmailRegex.test(trimmedEmail)) {
            toast.warn("Please enter a valid @lsu.edu email", { toastId: "email-toast" });
            setInvalidEmail(true);
            return;
        }
        if (!password) {
            toast.warn("Please enter a password", { toastId: "pass-toast" });
            setInvalidPass(true);
            return;
        }
        if (!repassword) {
            toast.warn("Please re-enter your password", { toastId: "repass-toast" });
            setInvalidRepass(true);
            return;
        }
        if (password.length < 8 || !/[!@#$%^&*_]/.test(password)) {
            toast.warn("Password does not meet requirements", { toastId: "pass-len-toast" });
            setInvalidPass(true);
            return;
        }
        if (password !== repassword) {
            toast.warn("Passwords do not match", { toastId: "pass-match-toast" });
            setInvalidRepass(true);
            return;
        }

        // Create account
        try {
            setSubmitting(true);

            // Firebase Auth will automatically check if email already exists
            const newuser = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
            
            // Create user document in Firestore
            await setDoc(doc(db, "Users", newuser.user.uid), {
                username,
                email: trimmedEmail,
                uid: newuser.user.uid,
                accountCreation: serverTimestamp(),
                likedItems: []
            });

            // Create user chats document
            await setDoc(doc(db, "UserChats", newuser.user.uid), {
                chats: []
            });

            // Send email verification with action code settings
            const actionCodeSettings = {
                url: `${window.location.origin}/login?verified=true`,
                handleCodeInApp: false,
            };
            await sendEmailVerification(newuser.user, actionCodeSettings);
            
            // Store credentials for resend functionality
            setUserEmail(trimmedEmail);
            setUserPassword(password);
            setAccountCreated(true);

            toast.success("Account created!", { toastId: "account-created-toast" });
            toast.info("A verification email was sent to your LSU inbox.", { toastId: "verify-email-toast" });

            // Sign out user to force verification
            await auth.signOut();

        } catch (err: unknown) {
            console.error('Full error:', err);

            // Try to safely extract a Firebase Auth error code if available
            let errorCode: string | undefined;
            if (err && typeof err === 'object' && 'code' in err) {
                // Narrow to an object with an optional code property
                errorCode = (err as { code?: unknown }).code as string | undefined;
            }

            console.error('Error code:', errorCode);
            
            // Handle Firebase Auth errors
            if (errorCode === 'auth/email-already-in-use') {
                toast.error("This email is already registered. Please log in instead.", { toastId: "email-exists-toast" });
                setInvalidEmail(true);
            } else if (errorCode === 'auth/invalid-email') {
                toast.error("Invalid email format", { toastId: "invalid-email-toast" });
                setInvalidEmail(true);
            } else if (errorCode === 'auth/weak-password') {
                toast.error("Password is too weak", { toastId: "weak-pass-toast" });
                setInvalidPass(true);
            } else {
                toast.error("An error occurred. Please try again.", { toastId: "create-error-toast" });
            }
            setError("An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-center bg-cover bg-[url('/lsu-register.jpg')] flex flex-col">
            <Navbar
                handleLogout={{} as unknown as () => Promise<void>}
                setShowLoginModal={()=>{}}
                setShowMenu={()=>toast.warn("Please Login or Register to access the menu.", {toastId: 'menu-login-warning'})}
                navigate={navigate}
            />

            <main className="flex-1 flex items-center justify-center py-8 px-4 overflow-y-auto">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8 pt-6 pb-6 my-4">
                    <div className="text-center mb-4">
                        <div className="mx-auto w-24 h-24 bg-purple-900 rounded-lg flex items-center justify-center">
                            <img className="w-16 h-16 " src="/geauxzone_tiger.png" alt="GeauxZone Tiger"></img>
                        </div>                        
                        <h1 className="text-2xl font-bold text-gray-900 mt-2">Create an account</h1>
                        <p className="text-sm text-gray-500">Register with your @lsu.edu account</p>
                    </div>

                    {!accountCreated ? (
                        <form onSubmit={handleRegister} noValidate>
                            <label className="block mt-1 text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={username}
                                onChange={(e) => {setUsername(e.target.value); setInvalidUsername(false)}}
                                placeholder="Display name"
                                className={`mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${invalidUsername ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'}`}
                                autoComplete='off'
                            />

                            <label className="block mt-1 text-sm font-medium text-gray-700">Email</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => {
                                    if (email && !lsuEmailRegex.test(email.trim())){
                                        setInvalidEmail(true)}
                                    else {setInvalidEmail(false)}
                                }}
                                placeholder="Email@lsu.edu"
                                className={`mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${invalidEmail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'}`}
                                autoComplete='off'
                            />
                            
                            {invalidEmail && (
                                <label className="ml-1 text-sm font-medium text-red-500">Please enter a valid school email</label>
                            )}

                            <label className="block mt-1 text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={(e) => {setPassword(e.target.value); setInvalidPass(false)}}
                                placeholder="Create a password"
                                className={`mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${invalidPass ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'}`}
                                autoComplete='off'
                            />
                        
                            {password.length > 0 && (
                                <div className="mt-2 mb-3 pl-1 text-sm space-y-1">
                                    <p className="font-medium text-gray-700 mb-1">Password must contain:</p>

                                    {[
                                        { label: "At least 8 characters", valid: passChecks.length },
                                        { label: "One uppercase letter", valid: passChecks.upper },
                                        { label: "One lowercase letter", valid: passChecks.lower },
                                        { label: "One number", valid: passChecks.number },
                                        { label: "One special character (!@#$%^&*_)", valid: passChecks.special },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span
                                                className={`w-3 h-3 rounded-full ${
                                                    item.valid ? "bg-green-500" : "bg-red-500"
                                                }`}
                                            ></span>
                                            <span
                                                className={`${
                                                    item.valid ? "text-green-600" : "text-red-500"
                                                }`}
                                            >
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <label className="block mt-1 text-sm font-medium text-gray-700">Confirm Password</label>
                            <input
                                type="password"
                                name="repassword"
                                value={repassword}
                                onChange={(e) => {setRepassword(e.target.value); setInvalidRepass(false)}}
                                placeholder="Re-enter password"
                                className={`mt-1 mb-4 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${invalidRepass ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'}`}
                                autoComplete='off'
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

                            <div className="mt-4 mb-0 text-center text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link to="/login" className="font-semibold text-purple-900 hover:underline">Sign in</Link>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="text-sm font-semibold text-green-800 mb-1">
                                            Account created successfully!
                                        </p>
                                        <p className="text-sm text-green-700 mb-2">
                                            A verification email has been sent to <strong>{userEmail}</strong>
                                        </p>
                                        <div className="text-xs text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                                            <p className="font-semibold mb-1">⚠️ Important:</p>
                                            <ol className="list-decimal ml-4 space-y-1">
                                                <li>Click the verification link in your email</li>
                                                <li>The link will open in your browser</li>
                                                <li>Wait for "Email verified" message</li>
                                                <li>Return here and click "Go to Login" below</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm font-semibold text-blue-800 mb-2">📧 Email not arriving?</p>
                                <ul className="text-xs text-gray-700 space-y-1 mb-3 ml-4 list-disc">
                                    <li>Check your spam/junk folder</li>
                                    <li>Emails may take 2-5 minutes to arrive</li>
                                    <li>Search for emails from "noreply@"</li>
                                </ul>
                                <button
                                    onClick={handleResendEmail}
                                    className="text-sm text-purple-900 hover:underline font-semibold"
                                >
                                    Resend verification email
                                </button>
                            </div>

                            <button
                                onClick={() => navigate('/login')}
                                className="w-full px-4 py-3 bg-purple-900 hover:bg-purple-800 text-white rounded-lg font-semibold"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <CustomToastContainer/>
        </div>
    );
}

export default Register;