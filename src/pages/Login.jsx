import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import MobileLoader from '../components/MobileLoader';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Smartphone
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
            import('../services/firebase').then(m => m.initializeFirebase());
            const from = location.state?.from || '/';
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication Failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
            {/* Ultra-Premium Mesh Gradient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[60%] bg-orange-600/10 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[100%] h-[60%] bg-blue-600/5 blur-[140px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150" />
            </div>

            {/* Top Navigation */}
            <div className="relative z-20 px-8 pt-10 flex items-center justify-between">
                <button 
                    onClick={() => navigate('/')}
                    className="group w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all backdrop-blur-3xl active:scale-90"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col px-8 justify-center pb-20 mt-10">
                {/* Hero Logo Section */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-14 relative flex justify-center"
                >
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full"
                    />

                    <div className="relative">
                        <div className="absolute -inset-4 bg-white/5 border border-white/10 rounded-[40px] backdrop-blur-3xl" />
                        <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center relative z-10 shadow-2xl border border-white/20 p-1.5">
                            <img src="/app-icon.png" alt="Logo" className="w-full h-full object-contain" />
                            <motion.div 
                                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                transition={{ rotate: { duration: 12, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
                                className="absolute -top-4 -right-4 w-11 h-11 bg-white dark:bg-zinc-800 shadow-xl rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700 z-20"
                            >
                                <Sparkles size={18} className="text-orange-500" fill="currentColor" />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Centered Branding Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 text-center"
                >
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Apna<span className="text-orange-500">Cart</span>
                    </h1>
                    <p className="text-[10px] font-medium text-zinc-500 mt-2 uppercase tracking-widest">
                        Priority Access Portal
                    </p>
                </motion.div>

                {/* Form Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                            >
                                <AlertCircle className="text-red-500" size={18} />
                                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-3">
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="EMAIL"
                                    className="w-full bg-white/5 border border-white/5 focus:border-orange-500/50 rounded-3xl py-5 pl-16 pr-6 text-sm font-bold tracking-widest uppercase outline-none transition-all placeholder:text-zinc-700"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="PASSWORD"
                                    className="w-full bg-white/5 border border-white/5 focus:border-orange-500/50 rounded-3xl py-5 pl-16 pr-16 text-sm font-bold tracking-widest uppercase outline-none transition-all placeholder:text-zinc-700"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-orange-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end pr-2">
                             <button type="button" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors">Forgot Password?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`relative w-full py-6 rounded-[32px] mt-4 overflow-hidden transition-all active:scale-[0.98] shadow-2xl ${
                                loading 
                                ? 'bg-zinc-800 text-zinc-600' 
                                : 'bg-orange-600 text-white shadow-orange-600/30 font-black uppercase tracking-[0.2em] italic text-sm'
                            }`}
                        >
                            {loading ? (
                                <span className="animate-pulse tracking-[0.3em]">Authenticating</span>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    <span>Login</span>
                                    <ArrowRight size={20} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    </form>

                    <div className="flex flex-col items-center gap-6 mt-12">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                            New here?{' '}
                            <Link to="/register" className="text-orange-500 border-b border-orange-500/30 pb-0.5">Create Account</Link>
                        </p>
                        
                        <div className="flex gap-4">
                            <button className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-center transition-all">
                                <Smartphone size={20} className="text-zinc-400" />
                            </button>
                            <button className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-center transition-all">
                                <Sparkles size={20} className="text-zinc-400" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="pb-10 text-center relative z-10">
                 <p className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.4em] leading-relaxed">
                    Powered by ApnaCart © 2026
                 </p>
            </div>
        </div>
    );
};

export default Login;
