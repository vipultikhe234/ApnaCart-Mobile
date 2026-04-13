import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { motion } from 'framer-motion';
import MobileLoader from '../components/MobileLoader';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (localStorage.getItem('access_token')) navigate('/');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const fcm_token = await import('../services/firebase').then(m => m.getFCMToken());
            const response = await authService.login({ email, password, fcm_token });
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Still initialize to setup listeners
            import('../services/firebase').then(m => m.initializeFirebase());

            const from = location.state?.from || '/';
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex flex-col font-sans">
            {/* Elegant Header Area */}
            <div className="pt-24 pb-8 px-8 flex flex-col items-center justify-center text-center relative">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="w-16 h-16 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <span className="text-white dark:text-zinc-900 text-2xl font-bold font-['Outfit'] tracking-tight">AC</span>
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white font-['Outfit'] tracking-tight mb-2">
                        ApnaCart
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Sign in to continue your experience.
                    </p>
                </motion.div>
            </div>

            {/* Login Form */}
            <div className="flex-1 px-8 pt-4 pb-12 w-full max-w-md mx-auto">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl mb-6 flex items-center gap-3">
                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white transition-all placeholder:text-zinc-400"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1 pr-1">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                                <button type="button" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Forgot?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-12 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white transition-all placeholder:text-zinc-400"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-sm ${
                                loading 
                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-[0.98]'
                            }`}
                        >
                            {loading ? (
                                <MobileLoader size={20} />
                            ) : (
                                <>
                                    <span className="text-sm font-semibold">Sign In</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-zinc-900 dark:text-white hover:underline">
                                Create one
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
            
            <div className="mt-auto pb-8 text-center">
                 <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
                    Secure checkout provided by Stripe <br />
                    Powered by ApnaCart © 2026
                 </p>
            </div>
        </div>
    );
};

export default Login;
