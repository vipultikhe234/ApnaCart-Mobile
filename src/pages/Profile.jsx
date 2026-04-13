import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Phone,
    MapPin,
    Shield,
    LogOut,
    Edit2,
    X,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Camera,
    Settings,
    Moon,
    Sun,
    Monitor,
    Bell,
    Globe,
    FileText,
} from 'lucide-react';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setFormData({
                name: parsedUser.name || '',
                phone: parsedUser.phone || '',
                address: parsedUser.address || ''
            });
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authService.updateProfile(formData);
            const updatedUser = response.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setEditing(false);
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            navigate('/login');
        } catch (error) {
            localStorage.clear();
            navigate('/login');
        }
    };

    if (!user) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-[#0A0A0A]">
            <div className="w-8 h-8 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (showSettings) {
        return (
            <div className="bg-zinc-50 dark:bg-[#0A0A0A] min-h-screen pb-32 font-sans">
                <div className="px-6 pt-12 pb-4 sticky top-0 z-40 bg-zinc-50/90 dark:bg-[#0A0A0A]/90 backdrop-blur-xl flex items-center gap-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <button
                        onClick={() => setShowSettings(false)}
                        className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shadow-sm active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Settings</h1>
                </div>

                <div className="px-6 mt-6 space-y-8">
                    {/* Appearance */}
                    <section>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Appearance</h2>
                        <div className="bg-white dark:bg-zinc-900 p-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                            {[
                                { id: 'light', icon: Sun, label: 'Light' },
                                { id: 'dark', icon: Moon, label: 'Dark' },
                                { id: 'system', icon: Monitor, label: 'System' }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => handleThemeChange(mode.id)}
                                    className={`flex items-center justify-center gap-2 flex-1 py-3 rounded-2xl transition-all ${
                                        theme === mode.id 
                                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                                >
                                    <mode.icon size={16} />
                                    <span className="text-xs font-semibold">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Preferences */}
                    <section>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Preferences</h2>
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300"><Bell size={18} /></div>
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Push Notifications</span>
                                </div>
                                <div className="w-11 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300"><Globe size={18} /></div>
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Language</span>
                                </div>
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-white">English</span>
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* About */}
                    <section>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">About</h2>
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300"><Shield size={18} /></div>
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Privacy Policy</span>
                                </div>
                                <ChevronRight size={16} className="text-zinc-400" />
                            </div>
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300"><FileText size={18} /></div>
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Terms of Service</span>
                                </div>
                                <ChevronRight size={16} className="text-zinc-400" />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-50 dark:bg-[#0A0A0A] min-h-screen pb-32 font-sans">
            {/* Soft Header */}
            <div className="relative pt-16 pb-6 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shadow-sm">
                <div className="relative mb-4">
                    <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                        <span className="text-3xl font-bold text-zinc-900 dark:text-white">{user.name[0]}</span>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{user.name}</h2>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
            </div>

            <div className="px-6 mt-8 space-y-8">
                {/* Controls Area */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setEditing(!editing)}
                        className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                            editing ? 'bg-red-50 dark:bg-red-500/10 text-red-600' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                        }`}
                    >
                        {editing ? <X size={16} /> : <Edit2 size={16} />}
                        <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
                    </button>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 shadow-sm active:scale-95"
                    >
                        <Settings size={18} />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {editing ? (
                        <motion.form
                            key="editing"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleUpdate}
                            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6"
                        >
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">Edit Details</h3>
                            
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-900/10 placeholder:text-zinc-400"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-900/10 placeholder:text-zinc-400"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none h-20 placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm flex items-center justify-center shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span>Save Changes</span>
                                )}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="viewing"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                                <div className="p-4 flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                                        <Phone size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">Phone</p>
                                        <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{user.phone || 'Not linked'}</p>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">Address</p>
                                        <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{user.address || 'No address added'}</p>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                        <Shield size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">Account Tier</p>
                                        <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">Verified User</p>
                                    </div>
                                </div>
                            </div>



                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-white dark:bg-zinc-900 rounded-2xl text-red-500 font-semibold border border-zinc-100 dark:border-zinc-800 shadow-sm active:scale-[0.98] transition-all"
                            >
                                <LogOut size={18} />
                                <span className="text-sm">Log out</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Profile;
