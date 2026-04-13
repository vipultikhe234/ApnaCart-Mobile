import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import MobileLoader from '../components/MobileLoader';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';

const Registration = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '',
        address: '', password: '', password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const validateStep1 = () => {
        if (!formData.name.trim()) return 'Please enter your name.';
        if (!formData.email.trim()) return 'Please enter your email.';
        if (!formData.phone.trim()) return 'Please enter your phone number.';
        if (!formData.address.trim()) return 'Please enter your delivery address.';
        return null;
    };

    const goNext = () => {
        const err = validateStep1();
        if (err) { setError(err); return; }
        setError('');
        setStep(2);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const fcm_token = await import('../services/firebase').then(m => m.getFCMToken());
            const response = await authService.register({ ...formData, fcm_token });
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Still initialize to setup listeners
            import('../services/firebase').then(m => m.initializeFirebase());

            const from = location.state?.from || '/';
            navigate(from, { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors;
            setError(typeof msg === 'object' ? Object.values(msg).flat().join('. ') : (msg || 'Registration failed.'));
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex flex-col font-sans">
            {/* Elegant Header Area */}
            <div className="pt-20 pb-4 px-8 flex flex-col items-center justify-center text-center relative">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="w-16 h-16 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <span className="text-white dark:text-zinc-900 text-2xl font-bold font-['Outfit'] tracking-tight">AC</span>
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white font-['Outfit'] tracking-tight mb-2">
                        Create Account
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Join ApnaCart to continue.
                    </p>
                </motion.div>
            </div>

            {/* Clean Stepper */}
            <div className="px-8 flex items-center justify-between w-full max-w-md mx-auto mb-8 mt-2">
                <div className="flex-1 flex flex-col gap-1.5">
                    <div className={`h-1 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                    <span className={`text-[10px] font-semibold transition-colors duration-500 ${step >= 1 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>Step 1: Details</span>
                </div>
                <div className="w-4"></div>
                <div className="flex-1 flex flex-col gap-1.5 align-end text-right">
                    <div className={`h-1 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                    <span className={`text-[10px] font-semibold transition-colors duration-500 ${step >= 2 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>Step 2: Password</span>
                </div>
            </div>

            {/* Form Area */}
            <div className="flex-1 px-8 pb-12 w-full max-w-md mx-auto relative z-10">
                <AnimatePresence mode="popLayout">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl mb-6 flex items-center gap-3"
                        >
                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="space-y-5"
                        >
                            <FormInput label="Full Name" icon={User} placeholder="John Doe" value={formData.name} onChange={v => update('name', v)} />
                            <FormInput label="Email Address" icon={Mail} placeholder="your@email.com" type="email" value={formData.email} onChange={v => update('email', v)} />
                            <FormInput label="Phone Number" icon={Phone} placeholder="+1 234 567 890" type="tel" value={formData.phone} onChange={v => update('phone', v)} />

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Delivery Address</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors">
                                        <MapPin size={18} />
                                    </div>
                                    <textarea
                                        value={formData.address}
                                        onChange={e => update('address', e.target.value)}
                                        placeholder="Enter your full address..."
                                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white transition-all placeholder:text-zinc-400 resize-none h-24"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={goNext}
                                className="w-full py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-[0.98]"
                            >
                                <span className="text-sm font-semibold">Continue</span>
                                <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="step2"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            onSubmit={handleRegister}
                            className="space-y-5"
                        >
                            <FormInput
                                label="Create Password"
                                icon={Lock}
                                placeholder="••••••••"
                                type={showPass ? "text" : "password"}
                                value={formData.password}
                                onChange={v => update('password', v)}
                                suffix={
                                    <button type="button" onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />
                            <FormInput
                                label="Confirm Password"
                                icon={Lock}
                                placeholder="••••••••"
                                type={showConfirmPass ? "text" : "password"}
                                value={formData.password_confirmation}
                                onChange={v => update('password_confirmation', v)}
                                suffix={
                                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                                        {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 flex items-center justify-center gap-2 rounded-2xl transition-all shadow-sm ${
                                        loading 
                                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                                        : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-[0.98]'
                                    }`}
                                >
                                    {loading ? (
                                        <MobileLoader size={20} />
                                    ) : (
                                        <span className="text-sm font-semibold">Create Account</span>
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="mt-10 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-zinc-900 dark:text-white hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
            
            <div className="mt-auto pb-8 text-center">
                 <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
                    Your data is secure and encrypted. <br />
                    Powered by ApnaCart © 2026
                 </p>
            </div>
        </div>
    );
};

const FormInput = ({ label, icon: Icon, placeholder, type = "text", value, onChange, suffix }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors">
                <Icon size={18} />
            </div>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-12 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-900 dark:focus:border-white transition-all placeholder:text-zinc-400"
                required
            />
            {suffix && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                    {suffix}
                </div>
            )}
        </div>
    </div>
);

export default Registration;
